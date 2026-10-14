<?php

namespace App\Models;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Donation extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id', 'type', 'amount_cents', 'items', 'delivery_method',
        'scheduled_at', 'payment_status', 'payment_reference', 'status',
    ];

    protected $casts = [
        'payment_status' => PaymentStatus::class,
        'status' => DonationStatus::class,
        'scheduled_at' => 'datetime',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function getAmountAttribute(): float
    {
        return $this->amount_cents / 100;
    }
}
