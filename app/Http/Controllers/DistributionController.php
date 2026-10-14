<?php

namespace App\Http\Controllers;

use App\Enums\DistributionStatus;
use App\Models\Beneficiary;
use App\Models\Distribution;
use App\Models\Household;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DistributionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Distribution::with(['household.purok', 'admin']);

        if ($user->barangay_id) {
            $query->where('barangay_id', $user->barangay_id);
        }

        return Inertia::render('Distributions/Index', [
            'distributions' => $query->latest()->paginate(15),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $households = Household::whereHas('purok', fn ($q) => $q->where('barangay_id', $user->barangay_id))
            ->orderBy('priority_flag', 'desc')
            ->get(['id', 'head_name', 'address', 'priority_flag']);

        return Inertia::render('Distributions/Create', ['households' => $households]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'household_id' => 'required|exists:households,id',
            'items' => 'required|string',
            'quantity' => 'required|integer|min:1',
        ]);

        Distribution::create([
            'barangay_id' => $request->user()->barangay_id,
            'admin_id' => $request->user()->id,
            'status' => DistributionStatus::Waiting,
            ...$data,
        ]);

        return redirect()->route('distributions.index')->with('success', 'Distribution created.');
    }

    public function show(Distribution $distribution): Response
    {
        return Inertia::render('Distributions/Show', [
            'distribution' => $distribution->load(['household.purok', 'admin', 'beneficiaries.household']),
        ]);
    }

    public function edit(Distribution $distribution): Response
    {
        return Inertia::render('Distributions/Edit', [
            'distribution' => $distribution,
            'households' => Household::all(['id', 'head_name']),
        ]);
    }

    public function update(Request $request, Distribution $distribution): RedirectResponse
    {
        $data = $request->validate([
            'items' => 'sometimes|string',
            'quantity' => 'sometimes|integer|min:1',
        ]);

        // Handle signature upload
        if ($request->hasFile('signature')) {
            $path = $request->file('signature')->store('signatures', 'public');
            $data['signature_path'] = $path;

            // Record beneficiary
            Beneficiary::create([
                'distribution_id' => $distribution->id,
                'household_id' => $distribution->household_id,
                'items_received' => $distribution->items,
                'received_at' => now(),
            ]);
        }

        $distribution->update($data);

        return redirect()->route('distributions.show', $distribution)->with('success', 'Distribution updated.');
    }

    public function transition(Request $request, Distribution $distribution): RedirectResponse
    {
        $data = $request->validate([
            'status' => 'required|in:ongoing,completed',
        ]);

        $newStatus = DistributionStatus::from($data['status']);

        try {
            $distribution->transitionTo($newStatus);
            if ($newStatus === DistributionStatus::Completed) {
                $distribution->update(['distributed_at' => now()]);
            }
        } catch (\LogicException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', "Status changed to {$newStatus->label()}.");
    }

    public function destroy(Distribution $distribution): RedirectResponse
    {
        if ($distribution->signature_path) {
            Storage::disk('public')->delete($distribution->signature_path);
        }
        $distribution->delete();

        return redirect()->route('distributions.index')->with('success', 'Distribution removed.');
    }
}
