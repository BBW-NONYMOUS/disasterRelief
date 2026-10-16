<?php

namespace App\Models;

use App\Enums\DistributionStatus;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distribution extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'barangay_id', 'household_id', 'assistance_request_id', 'admin_id', 'items', 'quantity',
        'signature_path', 'status', 'distributed_at',
    ];

    protected $casts = [
        'status' => DistributionStatus::class,
        'distributed_at' => 'datetime',
    ];

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function assistanceRequest(): BelongsTo
    {
        return $this->belongsTo(AssistanceRequest::class);
    }

    public function distributionItems(): HasMany
    {
        return $this->hasMany(DistributionItem::class);
    }

    public function beneficiaries(): HasMany
    {
        return $this->hasMany(Beneficiary::class);
    }

    public function transitionTo(DistributionStatus $next): void
    {
        if (! $this->status->canTransitionTo($next)) {
            throw new \LogicException("Cannot transition from {$this->status->value} to {$next->value}");
        }

        $this->update(['status' => $next]);
    }
}
