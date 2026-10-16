<?php

namespace App\Models;

use App\Enums\ReportStatus;
use App\Enums\SeverityLevel;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DisasterReport extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'reporter_id', 'barangay_id', 'purok_id', 'type', 'description',
        'affected_area', 'latitude', 'longitude', 'severity',
        'status', 'verified_at', 'verified_by', 'confirmed_at', 'resolved_at', 'rejected_at',
        'merged_into_id', 'merged_at',
    ];

    protected $casts = [
        'status' => ReportStatus::class,
        'severity' => SeverityLevel::class,
        'latitude' => 'float',
        'longitude' => 'float',
        'verified_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'resolved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'merged_at' => 'datetime',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function purok(): BelongsTo
    {
        return $this->belongsTo(Purok::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ReportPhoto::class);
    }

    public function assistanceRequests(): HasMany
    {
        return $this->hasMany(AssistanceRequest::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(ReportStatusHistory::class)->oldest()->orderBy('id');
    }

    /** The surviving incident this duplicate was folded into. */
    public function mergedInto(): BelongsTo
    {
        return $this->belongsTo(self::class, 'merged_into_id');
    }

    /** Duplicate reports that were merged into this incident. */
    public function duplicates(): HasMany
    {
        return $this->hasMany(self::class, 'merged_into_id');
    }
}
