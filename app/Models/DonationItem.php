<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DonationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'donation_id', 'inventory_item_id', 'category', 'name', 'unit',
        'quantity', 'received_quantity', 'distributed_quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'received_quantity' => 'integer',
        'distributed_quantity' => 'integer',
    ];

    public function donation(): BelongsTo
    {
        return $this->belongsTo(Donation::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(DonationAllocation::class);
    }

    public function isFullyDistributed(): bool
    {
        return $this->received_quantity !== null && $this->distributed_quantity >= $this->received_quantity;
    }
}
