<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = InventoryItem::query();

        if ($user->barangay_id) {
            $query->where('barangay_id', $user->barangay_id);
        }

        return Inertia::render('Inventory/Index', [
            'items' => $query->orderBy('category')->paginate(20),
            'categories' => InventoryItem::when($user->barangay_id, fn ($q) => $q->where('barangay_id', $user->barangay_id))
                ->distinct()->pluck('category'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Inventory/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'category' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'expiry_date' => 'nullable|date',
        ]);

        InventoryItem::create([
            'barangay_id' => $request->user()->barangay_id,
            ...$data,
        ]);

        return redirect()->route('inventory.index')->with('success', 'Item added to inventory.');
    }

    public function show(InventoryItem $inventory): Response
    {
        return Inertia::render('Inventory/Show', ['item' => $inventory]);
    }

    public function edit(InventoryItem $inventory): Response
    {
        return Inertia::render('Inventory/Edit', ['item' => $inventory]);
    }

    public function update(Request $request, InventoryItem $inventory): RedirectResponse
    {
        $data = $request->validate([
            'category' => 'sometimes|string|max:100',
            'name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|integer|min:0',
            'unit' => 'sometimes|string|max:50',
            'expiry_date' => 'nullable|date',
        ]);

        $inventory->update($data);

        return redirect()->route('inventory.index')->with('success', 'Item updated.');
    }

    public function destroy(InventoryItem $inventory): RedirectResponse
    {
        $inventory->delete();
        return redirect()->route('inventory.index')->with('success', 'Item removed.');
    }
}
