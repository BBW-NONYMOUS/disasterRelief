<?php

namespace App\Http\Controllers;

use App\Models\Household;
use App\Models\Purok;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HouseholdController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Household::with('purok.barangay');

        if ($user->role->value === 'purok_president') {
            $query->where('purok_id', $user->purok_id);
        } elseif ($user->role->value === 'admin') {
            $query->whereHas('purok', fn ($q) => $q->where('barangay_id', $user->barangay_id));
        }

        return Inertia::render('Households/Index', [
            'households' => $query->orderBy('priority_flag', 'desc')->paginate(20),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $puroks = $user->purok_id
            ? Purok::where('id', $user->purok_id)->get(['id', 'name'])
            : Purok::where('barangay_id', $user->barangay_id)->get(['id', 'name']);

        return Inertia::render('Households/Create', ['puroks' => $puroks]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'purok_id' => 'required|exists:puroks,id',
            'head_name' => 'required|string|max:255',
            'address' => 'required|string',
            'members_count' => 'required|integer|min:1|max:50',
            'priority_flag' => 'boolean',
        ]);

        Household::create($data);

        return redirect()->route('households.index')->with('success', 'Household added.');
    }

    public function show(Household $household): Response
    {
        return Inertia::render('Households/Show', [
            'household' => $household->load(['purok.barangay', 'distributions', 'beneficiaries']),
        ]);
    }

    public function edit(Household $household): Response
    {
        return Inertia::render('Households/Edit', [
            'household' => $household,
            'puroks' => Purok::all(['id', 'name']),
        ]);
    }

    public function update(Request $request, Household $household): RedirectResponse
    {
        $data = $request->validate([
            'head_name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'members_count' => 'sometimes|integer|min:1|max:50',
            'priority_flag' => 'boolean',
            'status' => 'sometimes|in:waiting,ongoing,assistance_completed',
        ]);

        $household->update($data);

        return redirect()->route('households.index')->with('success', 'Household updated.');
    }

    public function destroy(Household $household): RedirectResponse
    {
        $household->delete();
        return redirect()->route('households.index')->with('success', 'Household removed.');
    }
}
