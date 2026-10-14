<?php

namespace App\Services;

use App\Models\InventoryItem;

class InventoryService
{
    public function addStock(int $barangayId, string $category, string $name, int $quantity, string $unit, ?string $expiry = null): InventoryItem
    {
        $item = InventoryItem::where('barangay_id', $barangayId)
            ->where('category', $category)
            ->where('name', $name)
            ->where('unit', $unit)
            ->first();

        if ($item) {
            $item->increment('quantity', $quantity);
            return $item;
        }

        return InventoryItem::create([
            'barangay_id' => $barangayId,
            'category' => $category,
            'name' => $name,
            'quantity' => $quantity,
            'unit' => $unit,
            'expiry_date' => $expiry,
        ]);
    }

    public function deductStock(InventoryItem $item, int $quantity): bool
    {
        if ($item->quantity < $quantity) {
            return false;
        }

        $item->decrement('quantity', $quantity);
        return true;
    }

    public function getLowStockItems(int $barangayId, int $threshold = 10): \Illuminate\Database\Eloquent\Collection
    {
        return InventoryItem::where('barangay_id', $barangayId)
            ->where('quantity', '<=', $threshold)
            ->get();
    }

    public function getExpiringItems(int $barangayId, int $daysAhead = 30): \Illuminate\Database\Eloquent\Collection
    {
        return InventoryItem::where('barangay_id', $barangayId)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays($daysAhead))
            ->get();
    }
}
