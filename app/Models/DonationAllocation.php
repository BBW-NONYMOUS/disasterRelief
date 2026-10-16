<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DonationAllocation extends Model
{
    protected $fillable = ['donation_item_id', 'distribution_item_id', 'quantity'];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function donationItem(): BelongsTo
    {
        return $this->belongsTo(DonationItem::class);
    }

    public function distributionItem(): BelongsTo
    {
        return $this->belongsTo(DistributionItem::class);
    }
}
