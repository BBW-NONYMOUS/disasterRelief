<?php

namespace App\Models;

use App\Enums\ReportStatus;
use App\Enums\SeverityLevel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DisasterReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_id', 'barangay_id', 'purok_id', 'type', 'description',
        'affected_area', 'latitude', 'longitude', 'severity',
        'status', 'confirmed_at', 'resolved_at',
    ];

    protected $casts = [
        'status' => ReportStatus::class,
        'severity' => SeverityLevel::class,
        'latitude' => 'float',
        'longitude' => 'float',
        'confirmed_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
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
}
