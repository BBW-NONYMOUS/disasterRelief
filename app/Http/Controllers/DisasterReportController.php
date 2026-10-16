<?php

namespace App\Http\Controllers;

use App\Enums\ReportStatus;
use App\Enums\SeverityLevel;
use App\Enums\UserRole;
use App\Http\Requests\StoreDisasterReportRequest;
use App\Models\Barangay;
use App\Models\DisasterReport;
use App\Models\Donation;
use App\Models\Purok;
use App\Models\ReportPhoto;
use App\Services\DisasterAlertService;
use App\Services\ImageSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DisasterReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = DisasterReport::with(['reporter', 'barangay', 'purok', 'photos']);

        match ($user->role) {
            UserRole::Resident => $query->where('reporter_id', $user->id),
            UserRole::PurokPresident => $query->where('purok_id', $user->purok_id),
            UserRole::Admin => $query->where('barangay_id', $user->barangay_id),
            UserRole::Donor => $query->whereIn('status', [ReportStatus::Confirmed->value, ReportStatus::Resolved->value]),
            UserRole::SuperAdmin => null,
        };

        $status = $request->query('status');
        if ($status && ReportStatus::tryFrom($status)) {
            $query->where('status', $status);
        }

        return Inertia::render('DisasterReports/Index', [
            'reports' => $query->latest()->paginate(15)->withQueryString(),
            'filters' => ['status' => $status],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', DisasterReport::class);

        $user = $request->user();
        return Inertia::render('DisasterReports/Create', [
            'barangays' => Barangay::all(['id', 'name']),
            'puroks' => $user->barangay_id
                ? Purok::where('barangay_id', $user->barangay_id)->get(['id', 'name'])
                : [],
        ]);
    }

    public function store(StoreDisasterReportRequest $request, DisasterAlertService $alerts, ImageSanitizer $images): RedirectResponse
    {
        $this->authorize('create', DisasterReport::class);

        $data = $request->validated();
        $user = $request->user();

        // Re-encode first so a bad photo fails before anything is saved.
        $paths = [];
        foreach ($request->file('photos', []) as $photo) {
            $paths[] = $images->store($photo, 'disaster-reports');
        }

        $report = DB::transaction(function () use ($data, $user, $paths) {
            $report = DisasterReport::create([
                'reporter_id' => $user->id,
                'barangay_id' => $data['barangay_id'],
                'purok_id' => $data['purok_id'] ?? null,
                'type' => $data['type'],
                'description' => $data['description'],
                'affected_area' => $data['affected_area'],
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'severity' => $data['severity'] ?? SeverityLevel::Moderate,
                'status' => ReportStatus::Reported,
            ]);

            foreach ($paths as $path) {
                ReportPhoto::create(['disaster_report_id' => $report->id, 'path' => $path]);
            }

            $report->history()->create(['status' => ReportStatus::Reported, 'actor_id' => $user->id]);

            return $report;
        });

        $alerts->reportCreated($report);

        return redirect()->route('disaster-reports.index')
            ->with('success', 'Disaster report submitted successfully.');
    }

    public function show(Request $request, DisasterReport $disasterReport): Response
    {
        $this->authorize('view', $disasterReport);

        $user = $request->user();
        $status = $disasterReport->status;
        $canMerge = $status->canTransitionTo(ReportStatus::Merged) && $user->can('merge', $disasterReport);

        return Inertia::render('DisasterReports/Show', [
            'report' => $disasterReport->load([
                'reporter', 'barangay', 'purok', 'photos', 'verifier',
                'assistanceRequests.requester', 'history.actor', 'mergedInto:id,type,affected_area',
            ]),
            'can' => [
                'update' => $user->can('update', $disasterReport),
                'delete' => $user->can('delete', $disasterReport),
                'verify' => $status->canTransitionTo(ReportStatus::Verified) && $user->can('verify', $disasterReport),
                'confirm' => $status->canTransitionTo(ReportStatus::Confirmed) && $user->can('confirm', $disasterReport),
                'reject' => $status->canTransitionTo(ReportStatus::Rejected) && $user->can('reject', $disasterReport),
                'resolve' => $status->canTransitionTo(ReportStatus::Resolved) && $user->can('resolve', $disasterReport),
                'merge' => $canMerge,
            ],
            // Possible surviving incidents for a duplicate: active, same barangay.
            'merge_candidates' => $canMerge
                ? DisasterReport::where('barangay_id', $disasterReport->barangay_id)
                    ->whereKeyNot($disasterReport->id)
                    ->whereIn('status', ReportStatus::active())
                    ->latest()
                    ->get(['id', 'type', 'affected_area', 'status'])
                : [],
        ]);
    }

    public function edit(DisasterReport $disasterReport): Response
    {
        $this->authorize('update', $disasterReport);

        return Inertia::render('DisasterReports/Edit', [
            'report' => $disasterReport->load(['photos']),
            'barangays' => Barangay::all(['id', 'name']),
            'puroks' => Purok::where('barangay_id', $disasterReport->barangay_id)->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, DisasterReport $disasterReport): RedirectResponse
    {
        $this->authorize('update', $disasterReport);

        // Status is deliberately not editable here — see verify/confirm/reject/resolve.
        $data = $request->validate([
            'type' => 'sometimes|string|max:100',
            'description' => 'sometimes|string',
            'affected_area' => 'sometimes|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'severity' => ['sometimes', Rule::enum(SeverityLevel::class)],
            'purok_id' => ['nullable', Rule::exists('puroks', 'id')->where('barangay_id', $disasterReport->barangay_id)],
        ]);

        $disasterReport->update($data);

        return redirect()->route('disaster-reports.show', $disasterReport)
            ->with('success', 'Report updated.');
    }

    public function destroy(DisasterReport $disasterReport): RedirectResponse
    {
        $this->authorize('delete', $disasterReport);

        foreach ($disasterReport->photos as $photo) {
            Storage::disk('public')->delete($photo->path);
        }

        $disasterReport->delete();

        return redirect()->route('disaster-reports.index')
            ->with('success', 'Report deleted.');
    }

    /** Purok President confirms the incident on the ground and forwards it to the barangay. */
    public function verify(Request $request, DisasterReport $disasterReport, DisasterAlertService $alerts): RedirectResponse
    {
        $this->authorize('verify', $disasterReport);

        return $this->transition($request, $disasterReport, ReportStatus::Verified, $alerts,
            'Report verified and forwarded to the barangay.', ['verified_by' => $request->user()->id]);
    }

    public function confirm(Request $request, DisasterReport $disasterReport, DisasterAlertService $alerts): RedirectResponse
    {
        $this->authorize('confirm', $disasterReport);

        return $this->transition($request, $disasterReport, ReportStatus::Confirmed, $alerts, 'Incident confirmed.');
    }

    /** Fold a duplicate report into the surviving incident; its requests and donations follow. */
    public function merge(Request $request, DisasterReport $disasterReport): RedirectResponse
    {
        $this->authorize('merge', $disasterReport);

        $data = $request->validate([
            'target_id' => [
                'required',
                Rule::exists('disaster_reports', 'id')
                    ->where('barangay_id', $disasterReport->barangay_id)
                    ->whereIn('status', ReportStatus::active()),
            ],
            'note' => 'nullable|string|max:1000',
        ], [
            'target_id.required' => 'Choose the incident this duplicate belongs to.',
            'target_id.exists' => 'The target must be an active incident in the same barangay.',
        ]);

        if ((int) $data['target_id'] === $disasterReport->id) {
            return back()->withErrors(['target_id' => 'A report cannot be merged into itself.']);
        }

        if (! $disasterReport->status->canTransitionTo(ReportStatus::Merged)) {
            return back()->with('error', "Cannot merge a {$disasterReport->status->label()} report.");
        }

        $target = DisasterReport::findOrFail($data['target_id']);

        DB::transaction(function () use ($disasterReport, $target, $data, $request) {
            $disasterReport->update([
                'status' => ReportStatus::Merged,
                'merged_into_id' => $target->id,
                'merged_at' => now(),
            ]);

            $disasterReport->history()->create([
                'status' => ReportStatus::Merged,
                'actor_id' => $request->user()->id,
                'note' => $data['note'] ?? "Merged into incident #{$target->id} ({$target->type} — {$target->affected_area}).",
            ]);

            // The surviving incident inherits the duplicate's requests and pledges.
            $disasterReport->assistanceRequests()->update(['disaster_report_id' => $target->id]);
            Donation::where('disaster_report_id', $disasterReport->id)->update(['disaster_report_id' => $target->id]);
        });

        return redirect()->route('disaster-reports.show', $target)
            ->with('success', "Duplicate merged into “{$target->type} — {$target->affected_area}”.");
    }

    public function reject(Request $request, DisasterReport $disasterReport, DisasterAlertService $alerts): RedirectResponse
    {
        $this->authorize('reject', $disasterReport);

        $request->validate(['note' => 'required|string|max:1000'], ['note.required' => 'Give a reason for rejecting the report.']);

        return $this->transition($request, $disasterReport, ReportStatus::Rejected, $alerts, 'Report rejected.');
    }

    public function resolve(Request $request, DisasterReport $disasterReport, DisasterAlertService $alerts): RedirectResponse
    {
        $this->authorize('resolve', $disasterReport);

        return $this->transition($request, $disasterReport, ReportStatus::Resolved, $alerts, 'Incident marked as resolved.');
    }

    private function transition(
        Request $request,
        DisasterReport $report,
        ReportStatus $to,
        DisasterAlertService $alerts,
        string $message,
        array $extra = [],
    ): RedirectResponse {
        $note = $request->validate(['note' => 'nullable|string|max:1000'])['note'] ?? null;

        if (! $report->status->canTransitionTo($to)) {
            return back()->with('error', "Cannot move a {$report->status->label()} report to {$to->label()}.");
        }

        DB::transaction(function () use ($report, $to, $note, $extra, $request) {
            $report->update(['status' => $to, "{$to->value}_at" => now(), ...$extra]);
            $report->history()->create(['status' => $to, 'actor_id' => $request->user()->id, 'note' => $note]);
        });

        $alerts->statusChanged($report);

        return back()->with('success', $message);
    }
}
