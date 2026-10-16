<?php

namespace App\Http\Controllers;

use App\Enums\AssistanceRequestStatus;
use App\Enums\AssistanceType;
use App\Enums\ReportStatus;
use App\Enums\RequestPriority;
use App\Enums\UserRole;
use App\Models\AssistanceRequest;
use App\Models\Barangay;
use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Household;
use App\Models\Purok;
use App\Notifications\AssistanceRequestUpdated;
use App\Services\DisasterAlertService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AssistanceRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === UserRole::Donor) {
            return $this->donorIndex();
        }

        $query = AssistanceRequest::with(['requester:id,name', 'disasterReport:id,type,affected_area', 'purok:id,name', 'household:id,head_name']);

        match ($user->role) {
            UserRole::Resident => $query->where('requester_id', $user->id)->latest(),
            UserRole::PurokPresident => $query->where('purok_id', $user->purok_id)->prioritized(),
            UserRole::Admin => $query->where('barangay_id', $user->barangay_id)->prioritized(),
            UserRole::SuperAdmin => $query->prioritized(),
        };

        $status = $request->query('status');
        if ($status && AssistanceRequestStatus::tryFrom($status)) {
            $query->where('status', $status);
        }

        return Inertia::render('AssistanceRequests/Index', [
            'requests' => $query->paginate(15)->withQueryString(),
            'filters' => ['status' => $status],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', AssistanceRequest::class);

        $user = $request->user();

        return Inertia::render('AssistanceRequests/Create', [
            'disaster_reports' => DisasterReport::whereIn('status', [ReportStatus::Verified->value, ReportStatus::Confirmed->value])
                ->when($user->barangay_id, fn ($q) => $q->where('barangay_id', $user->barangay_id))
                ->latest()
                ->get(['id', 'type', 'affected_area', 'barangay_id']),
            'barangays' => Barangay::orderBy('name')->get(['id', 'name']),
            'puroks' => Purok::orderBy('name')->get(['id', 'name', 'barangay_id']),
            'types' => AssistanceType::options(),
            'defaults' => ['barangay_id' => $user->barangay_id, 'purok_id' => $user->purok_id],
        ]);
    }

    public function store(Request $request, DisasterAlertService $alerts): RedirectResponse
    {
        $this->authorize('create', AssistanceRequest::class);

        $data = $request->validate([
            'disaster_report_id' => 'nullable|exists:disaster_reports,id',
            'barangay_id' => 'required|exists:barangays,id',
            'purok_id' => ['nullable', Rule::exists('puroks', 'id')->where('barangay_id', $request->input('barangay_id'))],
            'type' => ['required', Rule::enum(AssistanceType::class)],
            'quantity' => 'required|integer|min:1|max:10000',
            'goods_needed' => 'required|string|max:2000',
            'urgency' => 'required|in:normal,urgent,critical',
        ]);

        $assistanceRequest = AssistanceRequest::create([
            ...$data,
            'requester_id' => $request->user()->id,
            'status' => AssistanceRequestStatus::Pending,
        ]);

        Notification::send(
            $alerts->officialsFor($assistanceRequest->barangay_id, $assistanceRequest->purok_id),
            new AssistanceRequestUpdated($assistanceRequest, "New {$assistanceRequest->type->label()} assistance request ({$assistanceRequest->urgency}) needs verification."),
        );

        return redirect()->route('assistance-requests.index')
            ->with('success', 'Assistance request submitted.');
    }

    public function show(Request $request, AssistanceRequest $assistanceRequest): Response
    {
        $this->authorize('view', $assistanceRequest);

        $user = $request->user();

        if ($user->role === UserRole::Donor) {
            return Inertia::render('AssistanceRequests/Show', [
                'request' => $this->forDonor($assistanceRequest->load(['barangay:id,name', 'purok:id,name', 'disasterReport:id,type,affected_area'])),
                'donor_view' => true,
            ]);
        }

        $status = $assistanceRequest->status;

        return Inertia::render('AssistanceRequests/Show', [
            'request' => $assistanceRequest->load([
                'requester:id,name,phone', 'disasterReport:id,type,affected_area', 'barangay:id,name', 'purok:id,name',
                'household:id,head_name,address,members_count,priority_flag,verified_at',
                'verifier:id,name', 'approver:id,name', 'distributions:id,assistance_request_id,status,items,created_at',
            ]),
            'households' => $assistanceRequest->purok_id
                ? Household::where('purok_id', $assistanceRequest->purok_id)->orderBy('head_name')->get(['id', 'head_name', 'address', 'verified_at'])
                : [],
            'priorities' => RequestPriority::options(),
            'donor_view' => false,
            'can' => [
                'verify' => $status->canTransitionTo(AssistanceRequestStatus::Verified) && $user->can('verify', $assistanceRequest),
                'approve' => $status->canTransitionTo(AssistanceRequestStatus::Approved) && $user->can('approve', $assistanceRequest),
                'reject' => $status->canTransitionTo(AssistanceRequestStatus::Rejected) && $user->can('reject', $assistanceRequest),
                'fulfill' => $status->canTransitionTo(AssistanceRequestStatus::Fulfilled) && $user->can('fulfill', $assistanceRequest),
                'distribute' => $status === AssistanceRequestStatus::Approved && $user->can('create', Distribution::class),
                'delete' => $user->can('delete', $assistanceRequest),
            ],
        ]);
    }

    /** Purok President validates the need on the ground and tags its priority. */
    public function verify(Request $request, AssistanceRequest $assistanceRequest): RedirectResponse
    {
        $this->authorize('verify', $assistanceRequest);

        $data = $request->validate([
            'priority' => ['required', Rule::enum(RequestPriority::class)],
            'household_id' => ['nullable', Rule::exists('households', 'id')->where('purok_id', $assistanceRequest->purok_id)],
            'note' => 'nullable|string|max:1000',
        ]);

        return $this->transition($request, $assistanceRequest, AssistanceRequestStatus::Verified, [
            'priority' => $data['priority'],
            'household_id' => $data['household_id'] ?? $assistanceRequest->household_id,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
            'remarks' => $data['note'] ?? $assistanceRequest->remarks,
        ], 'Request verified and forwarded to the barangay.');
    }

    /** Admin sets the final priority and commits the barangay to the request. */
    public function approve(Request $request, AssistanceRequest $assistanceRequest): RedirectResponse
    {
        $this->authorize('approve', $assistanceRequest);

        $data = $request->validate([
            'priority' => ['required', Rule::enum(RequestPriority::class)],
            'note' => 'nullable|string|max:1000',
        ]);

        return $this->transition($request, $assistanceRequest, AssistanceRequestStatus::Approved, [
            'priority' => $data['priority'],
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'remarks' => $data['note'] ?? $assistanceRequest->remarks,
        ], 'Request approved.');
    }

    public function reject(Request $request, AssistanceRequest $assistanceRequest): RedirectResponse
    {
        $this->authorize('reject', $assistanceRequest);

        $data = $request->validate(
            ['remarks' => 'required|string|max:1000'],
            ['remarks.required' => 'Give a reason for rejecting the request.'],
        );

        return $this->transition($request, $assistanceRequest, AssistanceRequestStatus::Rejected, [
            'remarks' => $data['remarks'],
        ], 'Request rejected.');
    }

    public function fulfill(Request $request, AssistanceRequest $assistanceRequest): RedirectResponse
    {
        $this->authorize('fulfill', $assistanceRequest);

        return $this->transition($request, $assistanceRequest, AssistanceRequestStatus::Fulfilled, [
            'fulfilled_at' => now(),
        ], 'Request marked as fulfilled.');
    }

    public function destroy(AssistanceRequest $assistanceRequest): RedirectResponse
    {
        $this->authorize('delete', $assistanceRequest);
        $assistanceRequest->delete();

        return redirect()->route('assistance-requests.index')
            ->with('success', 'Request deleted.');
    }

    private function transition(Request $request, AssistanceRequest $assistanceRequest, AssistanceRequestStatus $to, array $attributes, string $message): RedirectResponse
    {
        if (! $assistanceRequest->status->canTransitionTo($to)) {
            return back()->with('error', "Cannot move a {$assistanceRequest->status->label()} request to {$to->label()}.");
        }

        $assistanceRequest->update(['status' => $to, ...$attributes]);

        $assistanceRequest->requester?->notify(new AssistanceRequestUpdated(
            $assistanceRequest,
            "Your {$assistanceRequest->type->label()} assistance request is now {$to->label()}."
        ));

        return back()->with('success', $message);
    }

    /** Donors see aggregated approved needs and anonymous rows — no names, households or free text. */
    private function donorIndex(): Response
    {
        $rows = AssistanceRequest::with(['barangay:id,name', 'purok:id,name', 'disasterReport:id,type'])
            ->where('status', AssistanceRequestStatus::Approved)
            ->prioritized()
            ->paginate(15);

        $rows->setCollection($rows->getCollection()->map(fn (AssistanceRequest $r) => $this->forDonor($r)));

        return Inertia::render('AssistanceRequests/Index', [
            'requests' => $rows,
            'needs' => AssistanceRequest::openNeeds(),
            'filters' => ['status' => null],
        ]);
    }

    private function forDonor(AssistanceRequest $r): array
    {
        return [
            'id' => $r->id,
            'type' => $r->type?->value,
            'type_label' => $r->type?->label(),
            'quantity' => $r->quantity,
            'priority' => $r->priority?->value,
            'status' => $r->status->value,
            'barangay' => $r->barangay?->only('id', 'name'),
            'purok' => $r->purok?->only('id', 'name'),
            'disaster_report' => $r->disasterReport?->only('id', 'type'),
            'approved_at' => $r->approved_at?->toIso8601String(),
            'created_at' => $r->created_at?->toIso8601String(),
        ];
    }
}
