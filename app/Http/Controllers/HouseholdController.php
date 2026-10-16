<?php

namespace App\Http\Controllers;

use App\Enums\HouseholdStatus;
use App\Enums\UserRole;
use App\Models\Household;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HouseholdController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Household::class);

        $user = $request->user();
        $query = Household::with(['purok.barangay', 'verifier:id,name']);

        match ($user->role) {
            UserRole::PurokPresident => $query->where('purok_id', $user->purok_id),
            UserRole::Admin => $query->whereHas('purok', fn ($q) => $q->where('barangay_id', $user->barangay_id)),
            default => null,
        };

        return Inertia::render('Households/Index', [
            'households' => $query->orderBy('priority_flag', 'desc')->orderBy('head_name')->paginate(20),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Household::class);

        return Inertia::render('Households/Create', [
            'puroks' => $this->puroksInScope($request->user())->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Household::class);

        $allowedPuroks = $this->puroksInScope($request->user())->pluck('id')->all();

        $data = $request->validate([
            'purok_id' => ['required', Rule::in($allowedPuroks)],
            'head_name' => 'required|string|max:255',
            'address' => 'required|string',
            'members_count' => 'required|integer|min:1|max:50',
            'priority_flag' => 'boolean',
        ], [
            'purok_id.in' => 'You can only add households to puroks you manage.',
        ]);

        Household::create([...$data, 'status' => HouseholdStatus::Waiting]);

        return redirect()->route('households.index')->with('success', 'Household added.');
    }

    public function show(Request $request, Household $household): Response
    {
        $this->authorize('view', $household);

        return Inertia::render('Households/Show', [
            'household' => $household->load(['purok.barangay', 'verifier:id,name', 'distributions', 'beneficiaries']),
            'can' => [
                'update' => $request->user()->can('update', $household),
                'verify' => ! $household->verified_at && $request->user()->can('verify', $household),
            ],
        ]);
    }

    public function edit(Household $household): Response
    {
        $this->authorize('update', $household);

        return Inertia::render('Households/Edit', [
            'household' => $household,
            'statuses' => HouseholdStatus::options(),
        ]);
    }

    public function update(Request $request, Household $household): RedirectResponse
    {
        $this->authorize('update', $household);

        $data = $request->validate([
            'head_name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'members_count' => 'sometimes|integer|min:1|max:50',
            'priority_flag' => 'boolean',
            'status' => ['sometimes', Rule::enum(HouseholdStatus::class)],
        ]);

        $household->update($data);

        return redirect()->route('households.index')->with('success', 'Household updated.');
    }

    /** Purok President vouches that the household exists and was affected. */
    public function verify(Request $request, Household $household): RedirectResponse
    {
        $this->authorize('verify', $household);

        if ($household->verified_at) {
            return back()->with('error', 'This household is already verified.');
        }

        $household->update(['verified_at' => now(), 'verified_by' => $request->user()->id]);

        return back()->with('success', "{$household->head_name}'s household verified.");
    }

    public function destroy(Household $household): RedirectResponse
    {
        $this->authorize('delete', $household);

        $household->delete();

        return redirect()->route('households.index')->with('success', 'Household removed.');
    }

    private function puroksInScope(User $user): Builder
    {
        return match ($user->role) {
            UserRole::PurokPresident => Purok::whereKey($user->purok_id),
            UserRole::Admin => Purok::where('barangay_id', $user->barangay_id)->orderBy('name'),
            default => Purok::orderBy('name'),
        };
    }
}
