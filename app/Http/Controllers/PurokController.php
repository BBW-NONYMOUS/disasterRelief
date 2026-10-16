<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Purok;
use App\Models\User;
use App\Services\PurokService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Super Admin: manage puroks and assign their presidents. Routes are restricted to role:super_admin. */
class PurokController extends Controller
{
    public function __construct(private PurokService $puroks) {}

    public function index(Request $request): Response
    {
        $barangayId = $request->integer('barangay_id') ?: null;

        $puroks = Purok::with(['barangay:id,name', 'president:id,name,email'])
            ->withCount(['households', 'disasterReports'])
            ->when($barangayId, fn ($q) => $q->where('barangay_id', $barangayId))
            ->orderBy('barangay_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('Puroks/Index', [
            'puroks' => $puroks,
            'barangays' => Barangay::orderBy('name')->get(['id', 'name']),
            'filters' => ['barangay_id' => $barangayId],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Puroks/Create', $this->formOptions() + [
            'defaults' => ['barangay_id' => $request->integer('barangay_id') ?: null],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            $purok = Purok::create(['barangay_id' => $data['barangay_id'], 'name' => $data['name']]);
            $this->puroks->assignPresident($purok, $this->president($data));
        });

        return redirect()->route('puroks.index', ['barangay_id' => $data['barangay_id']])->with('success', 'Purok added.');
    }

    public function edit(Purok $purok): Response
    {
        return Inertia::render('Puroks/Edit', ['purok' => $purok] + $this->formOptions());
    }

    public function update(Request $request, Purok $purok): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($purok, $data) {
            $purok->update(['barangay_id' => $data['barangay_id'], 'name' => $data['name']]);
            $this->puroks->assignPresident($purok, $this->president($data));
        });

        return redirect()->route('puroks.index', ['barangay_id' => $purok->barangay_id])->with('success', 'Purok updated.');
    }

    public function destroy(Purok $purok): RedirectResponse
    {
        $inUse = $purok->households()->exists()
            || $purok->disasterReports()->exists()
            || $purok->residents()->exists();

        if ($inUse) {
            return back()->with('error', "{$purok->name} still has households, reports or residents and cannot be deleted.");
        }

        $purok->delete();

        return back()->with('success', 'Purok deleted.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'barangay_id' => 'required|exists:barangays,id',
            'name' => 'required|string|max:255',
            'president_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('role', UserRole::PurokPresident->value)->where('status', 'active'),
            ],
        ], [
            'president_id.exists' => 'The president must be an active Purok President account.',
        ]);

        // A president from another barangay cannot lead this purok.
        if (! empty($data['president_id'])) {
            $president = User::find($data['president_id']);
            if ($president->barangay_id && (int) $president->barangay_id !== (int) $data['barangay_id']) {
                throw ValidationException::withMessages([
                    'president_id' => 'This Purok President belongs to a different barangay.',
                ]);
            }
        }

        return $data;
    }

    private function president(array $data): ?User
    {
        return empty($data['president_id']) ? null : User::find($data['president_id']);
    }

    private function formOptions(): array
    {
        return [
            'barangays' => Barangay::orderBy('name')->get(['id', 'name']),
            'presidents' => User::where('role', UserRole::PurokPresident->value)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'barangay_id', 'purok_id']),
        ];
    }
}
