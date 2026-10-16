<?php

namespace App\Http\Controllers;

use App\Enums\AssistanceRequestStatus;
use App\Enums\DistributionStatus;
use App\Enums\UserRole;
use App\Exceptions\InsufficientStockException;
use App\Models\AssistanceRequest;
use App\Models\Beneficiary;
use App\Models\Distribution;
use App\Models\Household;
use App\Models\InventoryItem;
use App\Services\DistributionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use LogicException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DistributionController extends Controller
{
    public function __construct(private DistributionService $distributions) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Distribution::class);

        $user = $request->user();
        $query = Distribution::with(['household.purok', 'admin']);

        match ($user->role) {
            UserRole::Admin => $query->where('barangay_id', $user->barangay_id),
            UserRole::PurokPresident => $query->whereHas('household', fn ($q) => $q->where('purok_id', $user->purok_id)),
            default => null,
        };

        return Inertia::render('Distributions/Index', [
            'distributions' => $query->latest()->paginate(15),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Distribution::class);

        $user = $request->user();

        $households = $this->householdsInScope($user)
            ->with('purok:id,name,barangay_id')
            ->orderBy('priority_flag', 'desc')
            ->orderBy('head_name')
            ->get(['id', 'purok_id', 'head_name', 'address', 'priority_flag', 'verified_at']);

        $barangayIds = $households->pluck('purok.barangay_id')->unique()->values();

        return Inertia::render('Distributions/Create', [
            'households' => $households,
            'inventory' => InventoryItem::whereIn('barangay_id', $barangayIds)
                ->where('quantity', '>', 0)
                ->orderBy('category')->orderBy('name')
                ->get(['id', 'barangay_id', 'category', 'name', 'quantity', 'unit', 'expiry_date']),
            'requests' => AssistanceRequest::where('status', AssistanceRequestStatus::Approved)
                ->whereIn('barangay_id', $barangayIds)
                ->when($user->role === UserRole::PurokPresident, fn ($q) => $q->where('purok_id', $user->purok_id))
                ->prioritized()
                ->get(['id', 'barangay_id', 'purok_id', 'household_id', 'type', 'quantity', 'priority', 'goods_needed']),
            'preselected' => [
                'assistance_request_id' => $request->integer('assistance_request_id') ?: null,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Distribution::class);

        $request->validate(['household_id' => 'required|exists:households,id']);
        $household = Household::with('purok')->findOrFail($request->input('household_id'));
        $this->authorize('view', $household);

        $barangayId = $household->purok->barangay_id;

        $data = $request->validate([
            'assistance_request_id' => [
                'nullable',
                Rule::exists('assistance_requests', 'id')
                    ->where('barangay_id', $barangayId)
                    ->where('status', AssistanceRequestStatus::Approved->value),
            ],
            'items' => 'required|array|min:1|max:30',
            'items.*.inventory_item_id' => ['required', 'integer', Rule::exists('inventory_items', 'id')->where('barangay_id', $barangayId)],
            'items.*.quantity' => 'required|integer|min:1',
        ], [
            'items.required' => 'Add at least one item from inventory.',
            'items.*.inventory_item_id.exists' => 'Choose an item from this barangay\'s inventory.',
        ]);

        $assistanceRequest = isset($data['assistance_request_id'])
            ? AssistanceRequest::find($data['assistance_request_id'])
            : null;

        try {
            $distribution = $this->distributions->create($household, $request->user(), $data['items'], $assistanceRequest);
        } catch (InsufficientStockException|LogicException $e) {
            throw ValidationException::withMessages(['items' => $e->getMessage()]);
        }

        return redirect()->route('distributions.show', $distribution)
            ->with('success', 'Distribution created and stock reserved from inventory.');
    }

    public function show(Request $request, Distribution $distribution): Response
    {
        $this->authorize('view', $distribution);

        $user = $request->user();

        return Inertia::render('Distributions/Show', [
            'distribution' => $distribution->load([
                'household.purok', 'admin', 'beneficiaries.household', 'distributionItems',
                'assistanceRequest:id,type,quantity,priority,status',
            ]),
            'signature_url' => $distribution->signature_path
                ? URL::temporarySignedRoute('distributions.signature', now()->addMinutes(30), $distribution)
                : null,
            'can' => [
                'update' => $user->can('update', $distribution),
                'delete' => $user->can('delete', $distribution),
            ],
        ]);
    }

    /** Captures the recipient's signature and records the beneficiary. */
    public function update(Request $request, Distribution $distribution): RedirectResponse
    {
        $this->authorize('update', $distribution);

        $request->validate([
            'signature' => 'required|image|mimes:png|max:2048',
        ]);

        if ($distribution->status !== DistributionStatus::Ongoing) {
            return back()->with('error', 'Start the distribution before capturing the recipient\'s signature.');
        }

        if ($distribution->signature_path) {
            return back()->with('error', 'A signature has already been recorded for this distribution.');
        }

        // Signatures are personal data: private disk, served through a signed route.
        $path = $request->file('signature')->store('signatures', 'local');

        DB::transaction(function () use ($distribution, $path) {
            $distribution->update(['signature_path' => $path]);

            Beneficiary::create([
                'distribution_id' => $distribution->id,
                'household_id' => $distribution->household_id,
                'items_received' => $distribution->items,
                'received_at' => now(),
            ]);
        });

        return redirect()->route('distributions.show', $distribution)->with('success', 'Signature saved and beneficiary recorded.');
    }

    public function signature(Distribution $distribution): StreamedResponse
    {
        $this->authorize('view', $distribution);

        abort_unless($distribution->signature_path, 404);

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($distribution->signature_path)) {
                return Storage::disk($disk)->response($distribution->signature_path, null, [
                    'Cache-Control' => 'private, max-age=600',
                ]);
            }
        }

        abort(404);
    }

    public function transition(Request $request, Distribution $distribution): RedirectResponse
    {
        $this->authorize('update', $distribution);

        $data = $request->validate([
            'status' => 'required|in:ongoing,completed',
        ]);

        $newStatus = DistributionStatus::from($data['status']);

        try {
            $newStatus === DistributionStatus::Ongoing
                ? $this->distributions->start($distribution)
                : $this->distributions->complete($distribution);
        } catch (LogicException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', "Status changed to {$newStatus->label()}.");
    }

    public function destroy(Distribution $distribution): RedirectResponse
    {
        $this->authorize('delete', $distribution);

        try {
            $this->distributions->cancel($distribution);
        } catch (LogicException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('distributions.index')->with('success', 'Distribution cancelled and items returned to inventory.');
    }

    private function householdsInScope($user): Builder
    {
        return match ($user->role) {
            UserRole::PurokPresident => Household::where('purok_id', $user->purok_id),
            UserRole::Admin => Household::whereHas('purok', fn ($q) => $q->where('barangay_id', $user->barangay_id)),
            default => Household::query(),
        };
    }
}
