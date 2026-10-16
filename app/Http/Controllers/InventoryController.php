<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Exceptions\InsufficientStockException;
use App\Models\Barangay;
use App\Models\DistributionItem;
use App\Models\DonationItem;
use App\Models\InventoryItem;
use App\Models\StockMovement;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', InventoryItem::class);

        $user = $request->user();
        $query = InventoryItem::with('barangay:id,name');

        if ($user->barangay_id) {
            $query->where('barangay_id', $user->barangay_id);
        }

        return Inertia::render('Inventory/Index', [
            'items' => $query->orderBy('category')->orderBy('name')->paginate(20),
            'categories' => InventoryItem::when($user->barangay_id, fn ($q) => $q->where('barangay_id', $user->barangay_id))
                ->distinct()->pluck('category'),
            'low_stock_threshold' => config('reliefnet.low_stock_threshold'),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', InventoryItem::class);

        return Inertia::render('Inventory/Create', $this->formOptions($request) + [
            'barangays' => $request->user()->barangay_id ? [] : Barangay::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        $user = $request->user();
        $data = $request->validate([
            'barangay_id' => [Rule::requiredIf(! $user->barangay_id), 'nullable', 'exists:barangays,id'],
            'category' => ['required', Rule::in(config('reliefnet.categories'))],
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'unit' => ['required', Rule::in(config('reliefnet.units'))],
            'expiry_date' => 'nullable|date',
        ]);

        // Merges into an existing row for the same item instead of duplicating it.
        $this->inventoryService->addStock(
            $user->barangay_id ?? (int) $data['barangay_id'],
            $data['category'],
            trim($data['name']),
            (int) $data['quantity'],
            $data['unit'],
            $data['expiry_date'] ?? null,
            null,
            StockMovement::REASON_MANUAL_ENTRY,
        );

        return redirect()->route('inventory.index')->with('success', 'Item added to inventory.');
    }

    public function show(InventoryItem $inventory): Response
    {
        $this->authorize('view', $inventory);

        return Inertia::render('Inventory/Show', [
            'item' => $inventory->load('barangay:id,name'),
            'movements' => $inventory->movements()->with('user:id,name')->latest()->latest('id')->limit(100)->get(),
        ]);
    }

    public function edit(Request $request, InventoryItem $inventory): Response
    {
        $this->authorize('update', $inventory);

        return Inertia::render('Inventory/Edit', ['item' => $inventory] + $this->formOptions($request));
    }

    public function update(Request $request, InventoryItem $inventory): RedirectResponse
    {
        $this->authorize('update', $inventory);

        $data = $request->validate([
            'category' => ['sometimes', Rule::in(config('reliefnet.categories'))],
            'name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|integer|min:0',
            // Legacy free-text units stay valid for rows created before the fixed list.
            'unit' => ['sometimes', Rule::in([...config('reliefnet.units'), $inventory->unit])],
            'expiry_date' => 'nullable|date',
            'adjustment_note' => 'nullable|string|max:255',
        ]);

        try {
            DB::transaction(function () use ($inventory, $data) {
                $inventory->update(collect($data)->except(['quantity', 'adjustment_note'])->all());

                if (array_key_exists('quantity', $data)) {
                    $this->inventoryService->adjust($inventory, (int) $data['quantity'], $data['adjustment_note'] ?? 'Manual count correction');
                }
            });
        } catch (InsufficientStockException $e) {
            // Stock moved between loading the form and saving it.
            throw ValidationException::withMessages(['quantity' => 'Stock changed while you were editing. Reload and try again.']);
        }

        return redirect()->route('inventory.show', $inventory)->with('success', 'Item updated.');
    }

    public function destroy(InventoryItem $inventory): RedirectResponse
    {
        $this->authorize('delete', $inventory);

        $referenced = DistributionItem::where('inventory_item_id', $inventory->id)->exists()
            || DonationItem::where('inventory_item_id', $inventory->id)->exists();

        if ($referenced) {
            return back()->with('error', 'This item is linked to donations or distributions and cannot be deleted. Adjust its quantity to 0 instead.');
        }

        $inventory->delete();
        return redirect()->route('inventory.index')->with('success', 'Item removed.');
    }

    private function formOptions(Request $request): array
    {
        return [
            'categories' => config('reliefnet.categories'),
            'units' => config('reliefnet.units'),
            'is_super_admin' => $request->user()->role === UserRole::SuperAdmin,
        ];
    }
}
