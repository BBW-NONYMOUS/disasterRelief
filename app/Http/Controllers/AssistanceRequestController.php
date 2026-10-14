<?php

namespace App\Http\Controllers;

use App\Models\AssistanceRequest;
use App\Models\DisasterReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssistanceRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = AssistanceRequest::with(['requester', 'disasterReport']);

        if ($user->role->value === 'resident') {
            $query->where('requester_id', $user->id);
        }

        return Inertia::render('AssistanceRequests/Index', [
            'requests' => $query->latest()->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('AssistanceRequests/Create', [
            'disaster_reports' => DisasterReport::where('status', 'confirmed')
                ->get(['id', 'type', 'affected_area']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'disaster_report_id' => 'nullable|exists:disaster_reports,id',
            'goods_needed' => 'required|string',
            'urgency' => 'required|in:normal,urgent,critical',
        ]);

        AssistanceRequest::create([
            'requester_id' => $request->user()->id,
            ...$data,
        ]);

        return redirect()->route('assistance-requests.index')
            ->with('success', 'Assistance request submitted.');
    }

    public function show(AssistanceRequest $assistanceRequest): Response
    {
        $this->authorize('view', $assistanceRequest);

        return Inertia::render('AssistanceRequests/Show', [
            'request' => $assistanceRequest->load(['requester', 'disasterReport']),
        ]);
    }

    public function update(Request $request, AssistanceRequest $assistanceRequest): RedirectResponse
    {
        $this->authorize('update', $assistanceRequest);

        $data = $request->validate([
            'status' => 'required|in:pending,approved,rejected,fulfilled',
        ]);

        $assistanceRequest->update($data);

        return redirect()->back()->with('success', 'Request updated.');
    }

    public function destroy(AssistanceRequest $assistanceRequest): RedirectResponse
    {
        $this->authorize('delete', $assistanceRequest);
        $assistanceRequest->delete();

        return redirect()->route('assistance-requests.index')
            ->with('success', 'Request deleted.');
    }
}
