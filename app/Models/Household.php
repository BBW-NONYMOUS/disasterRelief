<?php

namespace App\Models;

use App\Enums\HouseholdStatus;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Household extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'purok_id', 'head_name', 'address', 'members_count', 'priority_flag', 'status',
        'verified_at', 'verified_by',
    ];

    protected $casts = [
        'priority_flag' => 'boolean',
        'status' => HouseholdStatus::class,
        'verified_at' => 'datetime',
    ];

    public function purok(): BelongsTo
    {
        return $this->belongsTo(Purok::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function distributions(): HasMany
    {
        return $this->hasMany(Distribution::class);
    }

    public function beneficiaries(): HasMany
    {
        return $this->hasMany(Beneficiary::class);
    }

    public function assistanceRequests(): HasMany
    {
        return $this->hasMany(AssistanceRequest::class);
    }
}
