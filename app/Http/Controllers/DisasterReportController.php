<?php

namespace App\Http\Controllers;

use App\Enums\ReportStatus;
use App\Enums\SeverityLevel;
use App\Enums\UserRole;
use App\Http\Requests\StoreDisasterReportRequest;
use App\Models\Barangay;
use App\Models\DisasterReport;
use App\Models\Purok;
use App\Models\ReportPhoto;
use App\Services\DisasterAlertService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        if ($user->role === UserRole::Resident) {
            $query->where('reporter_id', $user->id);
        } elseif ($user->role === UserRole::PurokPresident) {
            $query->where('purok_id', $user->purok_id);
        } elseif ($user->role === UserRole::Admin) {
            $query->where('barangay_id', $user->barangay_id);
        }

        return Inertia::render('DisasterReports/Index', [
            'reports' => $query->latest()->paginate(15),
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

    public function store(StoreDisasterReportRequest $request, DisasterAlertService $alerts): RedirectResponse
    {
        $this->authorize('create', DisasterReport::class);

        $data = $request->validated();
        $user = $request->user();

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

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('disaster-reports', 'public');
                ReportPhoto::create(['disaster_report_id' => $report->id, 'path' => $path]);
            }
        }

        $alerts->reportCreated($report);

        return redirect()->route('disaster-reports.index')
            ->with('success', 'Disaster report submitted successfully.');
    }

    public function show(DisasterReport $disasterReport): Response
    {
        $this->authorize('view', $disasterReport);

        return Inertia::render('DisasterReports/Show', [
            'report' => $disasterReport->load(['reporter', 'barangay', 'purok', 'photos', 'assistanceRequests.requester']),
        ]);
    }

    public function edit(DisasterReport $disasterReport): Response
    {
        $this->authorize('update', $disasterReport);

        return Inertia::render('DisasterReports/Edit', [
            'report' => $disasterReport->load(['photos']),
            'barangays' => Barangay::all(['id', 'name']),
            'puroks' => Purok::where('barangay_id', $disasterReport->barangay_id)->get(['id', 'name']),
            'statuses' => ReportStatus::cases(),
        ]);
    }

    public function update(Request $request, DisasterReport $disasterReport, DisasterAlertService $alerts): RedirectResponse
    {
        $this->authorize('update', $disasterReport);

        $data = $request->validate([
            'type' => 'sometimes|string|max:100',
            'description' => 'sometimes|string',
            'affected_area' => 'sometimes|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'severity' => ['sometimes', Rule::enum(SeverityLevel::class)],
            'status' => 'sometimes|in:reported,confirmed,resolved',
            'purok_id' => 'nullable|exists:puroks,id',
        ]);

        $previousStatus = $disasterReport->status;

        if (isset($data['status'])) {
            $newStatus = ReportStatus::from($data['status']);
            if ($newStatus === ReportStatus::Confirmed && ! $disasterReport->confirmed_at) {
                $data['confirmed_at'] = now();
            } elseif ($newStatus === ReportStatus::Resolved && ! $disasterReport->resolved_at) {
                $data['resolved_at'] = now();
            }
        }

        $disasterReport->update($data);

        // Alarm responders + reporter only when the status actually changed.
        if ($disasterReport->status !== $previousStatus) {
            $alerts->statusChanged($disasterReport);
        }

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
}
