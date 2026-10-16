<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\InventoryItem;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Every stock change goes through here so the stock_movements ledger always
 * explains the current quantity. Quantity updates are single conditional
 * SQL statements, so two concurrent distributions cannot overdraw an item.
 */
class InventoryService
{
    /** Stock in, merging into the barangay's existing row for the same item. */
    public function addStock(
        int $barangayId,
        string $category,
        string $name,
        int $quantity,
        string $unit,
        ?string $expiry = null,
        ?Model $source = null,
        string $reason = StockMovement::REASON_DONATION,
        ?string $note = null,
    ): InventoryItem {
        return DB::transaction(function () use ($barangayId, $category, $name, $quantity, $unit, $expiry, $source, $reason, $note) {
            $item = InventoryItem::where('barangay_id', $barangayId)
                ->where('category', $category)
                ->where('name', $name)
                ->where('unit', $unit)
                ->lockForUpdate()
                ->first();

            if (! $item) {
                $item = InventoryItem::create([
                    'barangay_id' => $barangayId,
                    'category' => $category,
                    'name' => $name,
                    'quantity' => 0,
                    'unit' => $unit,
                    'expiry_date' => $expiry,
                ]);
            } elseif ($expiry && (! $item->expiry_date || $item->expiry_date->gt(Carbon::parse($expiry)))) {
                // Keep the earliest expiry so the warning surfaces the oldest stock.
                $item->update(['expiry_date' => $expiry]);
            }

            return $this->stockIn($item, $quantity, $reason, $source, $note);
        });
    }

    public function stockIn(InventoryItem $item, int $quantity, string $reason, ?Model $source = null, ?string $note = null): InventoryItem
    {
        if ($quantity <= 0) {
            return $item;
        }

        InventoryItem::whereKey($item->id)->increment('quantity', $quantity);
        $item->refresh();
        $this->record($item, StockMovement::IN, $quantity, $reason, $source, $note);

        return $item;
    }

    /**
     * @throws InsufficientStockException when the item has less than $quantity on hand.
     */
    public function deductStock(
        InventoryItem $item,
        int $quantity,
        ?Model $source = null,
        string $reason = StockMovement::REASON_DISTRIBUTION,
        ?string $note = null,
    ): InventoryItem {
        if ($quantity <= 0) {
            return $item;
        }

        $affected = InventoryItem::whereKey($item->id)
            ->where('quantity', '>=', $quantity)
            ->decrement('quantity', $quantity);

        if ($affected === 0) {
            throw new InsufficientStockException($item->fresh() ?? $item, $quantity);
        }

        $item->refresh();
        $this->record($item, StockMovement::OUT, $quantity, $reason, $source, $note);

        return $item;
    }

    /** Manual count correction; the ledger records the difference. */
    public function adjust(InventoryItem $item, int $newQuantity, ?string $note = null): InventoryItem
    {
        $item->refresh();
        $delta = $newQuantity - $item->quantity;

        if ($delta > 0) {
            return $this->stockIn($item, $delta, StockMovement::REASON_ADJUSTMENT, null, $note);
        }

        if ($delta < 0) {
            return $this->deductStock($item, -$delta, null, StockMovement::REASON_ADJUSTMENT, $note);
        }

        return $item;
    }

    public function getLowStockItems(int $barangayId, ?int $threshold = null): Collection
    {
        return InventoryItem::where('barangay_id', $barangayId)
            ->where('quantity', '<=', $threshold ?? config('reliefnet.low_stock_threshold', 10))
            ->orderBy('quantity')
            ->get();
    }

    public function getExpiringItems(int $barangayId, int $daysAhead = 30): Collection
    {
        return InventoryItem::where('barangay_id', $barangayId)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays($daysAhead))
            ->get();
    }

    private function record(InventoryItem $item, string $direction, int $quantity, string $reason, ?Model $source, ?string $note): void
    {
        StockMovement::create([
            'inventory_item_id' => $item->id,
            'direction' => $direction,
            'quantity' => $quantity,
            'balance_after' => $item->quantity,
            'reason' => $reason,
            'source_type' => $source?->getMorphClass(),
            'source_id' => $source?->getKey(),
            'user_id' => auth()->id(),
            'note' => $note,
        ]);
    }
}
