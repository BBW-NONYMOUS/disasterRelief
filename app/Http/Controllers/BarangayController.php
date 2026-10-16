<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Services\ImageSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Super Admin: manage barangay branches. Routes are restricted to role:super_admin. */
class BarangayController extends Controller
{
    public function index(): Response
    {
        $barangays = Barangay::withCount(['puroks', 'households', 'disasterReports'])
            ->with(['users' => fn ($q) => $q->where('role', UserRole::Admin->value)->select('id', 'name', 'email', 'barangay_id', 'status')])
            ->orderBy('name')
            ->get()
            ->each->append('image_url');

        return Inertia::render('Barangays/Index', ['barangays' => $barangays]);
    }

    public function create(): Response
    {
        return Inertia::render('Barangays/Create');
    }

    public function store(Request $request, ImageSanitizer $images): RedirectResponse
    {
        $data = $this->validated($request);

        if ($request->hasFile('image')) {
            $data['image_path'] = $images->store($request->file('image'), 'barangays', 'public', 'image');
        }

        Barangay::create($data);

        return redirect()->route('barangays.index')->with('success', 'Barangay added.');
    }

    public function edit(Barangay $barangay): Response
    {
        return Inertia::render('Barangays/Edit', ['barangay' => $barangay->append('image_url')]);
    }

    public function update(Request $request, Barangay $barangay, ImageSanitizer $images): RedirectResponse
    {
        $data = $this->validated($request, $barangay);

        if ($request->hasFile('image')) {
            $data['image_path'] = $images->store($request->file('image'), 'barangays', 'public', 'image');
        } elseif ($request->boolean('remove_image')) {
            $data['image_path'] = null;
        }

        $previousImage = $barangay->image_path;
        $barangay->update($data);

        if ($previousImage && $previousImage !== $barangay->image_path) {
            Storage::disk('public')->delete($previousImage);
        }

        return redirect()->route('barangays.index')->with('success', 'Barangay updated.');
    }

    public function destroy(Barangay $barangay): RedirectResponse
    {
        // Foreign keys cascade, so deleting a populated barangay would wipe its records.
        $inUse = $barangay->puroks()->exists()
            || $barangay->users()->exists()
            || $barangay->disasterReports()->exists()
            || $barangay->inventoryItems()->exists();

        if ($inUse) {
            return back()->with('error', "{$barangay->name} still has puroks, users, reports or inventory and cannot be deleted.");
        }

        $barangay->delete();

        if ($barangay->image_path) {
            Storage::disk('public')->delete($barangay->image_path);
        }

        return redirect()->route('barangays.index')->with('success', 'Barangay deleted.');
    }

    private function validated(Request $request, ?Barangay $barangay = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:20', Rule::unique('barangays', 'code')->ignore($barangay)],
            'lgu_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'captain_name' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'hall_address' => 'nullable|string|max:255',
            'population' => 'nullable|integer|min:0|max:10000000',
            'land_area_km2' => 'nullable|numeric|min:0|max:99999',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'remove_image' => 'nullable|boolean',
        ], [], [
            'lgu_name' => 'LGU',
            'captain_name' => 'Punong Barangay',
            'contact_number' => 'hotline',
            'hall_address' => 'barangay hall address',
            'land_area_km2' => 'land area',
            'image' => 'photo',
        ]);

        unset($data['image'], $data['remove_image']);

        return $data;
    }
}
