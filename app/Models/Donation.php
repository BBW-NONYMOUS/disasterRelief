<?php

namespace App\Models;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Donation extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'donor_id', 'barangay_id', 'disaster_report_id', 'type', 'amount_cents', 'items', 'delivery_method',
        'scheduled_at', 'payment_status', 'payment_reference', 'status',
        'received_at', 'received_by', 'distributed_at',
    ];

    protected $casts = [
        'payment_status' => PaymentStatus::class,
        'status' => DonationStatus::class,
        'scheduled_at' => 'datetime',
        'received_at' => 'datetime',
        'distributed_at' => 'datetime',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function disasterReport(): BelongsTo
    {
        return $this->belongsTo(DisasterReport::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function donationItems(): HasMany
    {
        return $this->hasMany(DonationItem::class);
    }

    public function getAmountAttribute(): float
    {
        return $this->amount_cents / 100;
    }

    public function isGoods(): bool
    {
        return $this->type === 'goods';
    }
}
