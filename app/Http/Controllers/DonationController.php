<?php

namespace App\Http\Controllers;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Enums\ReportStatus;
use App\Models\AssistanceRequest;
use App\Models\Barangay;
use App\Models\DisasterReport;
use App\Models\Donation;
use App\Services\DonationService;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use LogicException;

class DonationController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private DonationService $donationService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Donation::class);

        $user = $request->user();
        $query = Donation::with(['donor:id,name', 'barangay:id,name']);

        match ($user->role) {
            UserRole::Donor => $query->where('donor_id', $user->id),
            UserRole::Admin => $query->where(fn ($q) => $q->where('barangay_id', $user->barangay_id)->orWhereNull('barangay_id')),
            default => null,
        };

        $status = $request->query('status');
        if ($status && DonationStatus::tryFrom($status)) {
            $query->where('status', $status);
        }

        return Inertia::render('Donations/Index', [
            'donations' => $query->latest()->paginate(15)->withQueryString(),
            'filters' => ['status' => $status],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Donation::class);

        return Inertia::render('Donations/Create', [
            'barangays' => Barangay::orderBy('name')->get(['id', 'name']),
            'categories' => config('reliefnet.categories'),
            'units' => config('reliefnet.units'),
            'needs' => AssistanceRequest::openNeeds(),
            // Donors can pledge toward a specific active incident, not only a barangay.
            'active_reports' => DisasterReport::whereIn('status', [ReportStatus::Verified, ReportStatus::Confirmed])
                ->latest()
                ->get(['id', 'barangay_id', 'type', 'affected_area', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Donation::class);

        $data = $request->validate([
            'barangay_id' => 'required|exists:barangays,id',
            // Optional link to a specific incident; it must belong to the chosen barangay
            // and still be active (verified or confirmed).
            'disaster_report_id' => [
                'nullable',
                Rule::exists('disaster_reports', 'id')
                    ->where('barangay_id', $request->input('barangay_id'))
                    ->whereIn('status', [ReportStatus::Verified->value, ReportStatus::Confirmed->value]),
            ],
            'type' => 'required|in:cash,goods',
            'amount_cents' => 'exclude_unless:type,cash|required|integer|min:100',
            'items' => 'exclude_unless:type,goods|required|array|min:1|max:30',
            'items.*.name' => 'exclude_unless:type,goods|required|string|max:255',
            'items.*.category' => ['exclude_unless:type,goods', 'required', Rule::in(config('reliefnet.categories'))],
            'items.*.quantity' => 'exclude_unless:type,goods|required|integer|min:1|max:100000',
            'items.*.unit' => ['exclude_unless:type,goods', 'required', Rule::in(config('reliefnet.units'))],
            'delivery_method' => 'required|in:deliver,pickup',
            'scheduled_at' => 'nullable|date|after:now',
        ], [
            'items.required' => 'Add at least one item to donate.',
        ]);

        $donation = DB::transaction(function () use ($data, $request) {
            $items = collect($data['items'] ?? [])->map(fn ($item) => [
                ...$item,
                'name' => trim($item['name']),
            ]);

            $donation = Donation::create([
                'donor_id' => $request->user()->id,
                'barangay_id' => $data['barangay_id'],
                'disaster_report_id' => $data['disaster_report_id'] ?? null,
                'type' => $data['type'],
                'amount_cents' => $data['amount_cents'] ?? 0,
                // Human-readable summary kept for lists and legacy reports.
                'items' => $items->isEmpty() ? null : $items->map(fn ($i) => "{$i['quantity']} {$i['unit']} {$i['name']}")->implode(', '),
                'delivery_method' => $data['delivery_method'],
                'scheduled_at' => $data['scheduled_at'] ?? null,
                'payment_status' => PaymentStatus::Pending,
                'status' => DonationStatus::Pending,
            ]);

            $donation->donationItems()->createMany($items->all());

            return $donation;
        });

        if ($data['type'] === 'cash') {
            $checkoutUrl = $this->paymentService->createCheckout($donation);
            if ($checkoutUrl) {
                return Inertia::location($checkoutUrl);
            }

            return redirect()->route('donations.show', $donation)
                ->with('error', 'Online payment is unavailable right now. Your pledge was saved; the barangay will contact you to complete it.');
        }

        return redirect()->route('donations.show', $donation)
            ->with('success', 'Donation recorded. Thank you!');
    }

    public function show(Request $request, Donation $donation): Response
    {
        $this->authorize('view', $donation);

        $user = $request->user();
        $donation->load([
            'donor:id,name', 'barangay:id,name', 'receiver:id,name',
            'disasterReport:id,type,affected_area,status',
            'donationItems.allocations.distributionItem.distribution.household.purok',
        ]);

        // Donors see where their goods went (purok and date), never household names.
        $showHouseholds = in_array($user->role, [UserRole::Admin, UserRole::SuperAdmin], true);

        $items = $donation->donationItems->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'category' => $item->category,
            'unit' => $item->unit,
            'quantity' => $item->quantity,
            'received_quantity' => $item->received_quantity,
            'distributed_quantity' => $item->distributed_quantity,
            'allocations' => $item->allocations->map(function ($allocation) use ($showHouseholds) {
                $distribution = $allocation->distributionItem?->distribution;

                return [
                    'id' => $allocation->id,
                    'quantity' => $allocation->quantity,
                    'distributed_at' => $distribution?->distributed_at?->toIso8601String(),
                    'purok' => $distribution?->household?->purok?->name,
                    'household' => $showHouseholds ? $distribution?->household?->head_name : null,
                    'distribution_id' => $showHouseholds ? $distribution?->id : null,
                ];
            }),
        ]);

        $canReceive = $user->can('receive', $donation);

        return Inertia::render('Donations/Show', [
            'donation' => $donation->only([
                'id', 'type', 'amount_cents', 'items', 'delivery_method', 'scheduled_at', 'payment_status',
                'status', 'received_at', 'distributed_at', 'created_at',
            ]) + [
                'donor' => $donation->donor?->only('id', 'name'),
                'barangay' => $donation->barangay?->only('id', 'name'),
                'receiver' => $donation->receiver?->only('id', 'name'),
                'disaster_report' => $donation->disasterReport?->only('id', 'type', 'affected_area', 'status'),
            ],
            'donation_items' => $items,
            'can' => [
                'receive' => $canReceive && $donation->isGoods()
                    && in_array($donation->status, [DonationStatus::Pending, DonationStatus::Confirmed], true),
                'mark_distributed' => $canReceive && ! $donation->isGoods() && $donation->status === DonationStatus::Confirmed,
                'delete' => $user->can('delete', $donation),
            ],
        ]);
    }

    /** Admin records the goods that actually arrived; they are stocked into inventory. */
    public function receive(Request $request, Donation $donation): RedirectResponse
    {
        $this->authorize('receive', $donation);

        $data = $request->validate([
            'items' => 'nullable|array',
            'items.*.received_quantity' => 'required|integer|min:0|max:100000',
            'items.*.expiry_date' => 'nullable|date',
        ]);

        try {
            $this->donationService->receive($donation, $request->user(), $data['items'] ?? []);
        } catch (LogicException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Donation received and added to inventory.');
    }

    public function markDistributed(Donation $donation): RedirectResponse
    {
        $this->authorize('receive', $donation);

        try {
            $this->donationService->markCashDistributed($donation);
        } catch (LogicException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Cash donation marked as distributed.');
    }

    public function destroy(Donation $donation): RedirectResponse
    {
        $this->authorize('delete', $donation);
        $donation->delete();

        return redirect()->route('donations.index')->with('success', 'Donation removed.');
    }
}
