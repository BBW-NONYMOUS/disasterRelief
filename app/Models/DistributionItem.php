<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DistributionItem extends Model
{
    protected $fillable = ['distribution_id', 'inventory_item_id', 'item_name', 'unit', 'quantity'];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function distribution(): BelongsTo
    {
        return $this->belongsTo(Distribution::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(DonationAllocation::class);
    }
}
