<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/** Append-only ledger of every stock change on an inventory item. */
class StockMovement extends Model
{
    public const IN = 'in';
    public const OUT = 'out';

    public const REASON_OPENING_BALANCE = 'opening_balance';
    public const REASON_MANUAL_ENTRY = 'manual_entry';
    public const REASON_ADJUSTMENT = 'adjustment';
    public const REASON_DONATION = 'donation_received';
    public const REASON_DISTRIBUTION = 'distribution';
    public const REASON_DISTRIBUTION_CANCELLED = 'distribution_cancelled';

    protected $fillable = [
        'inventory_item_id', 'direction', 'quantity', 'balance_after', 'reason',
        'source_type', 'source_id', 'user_id', 'note',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'balance_after' => 'integer',
    ];

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
