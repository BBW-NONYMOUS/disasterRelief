<?php

namespace App\Models;

use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportStatusHistory extends Model
{
    protected $fillable = ['disaster_report_id', 'status', 'actor_id', 'note'];

    protected $casts = [
        'status' => ReportStatus::class,
    ];

    public function disasterReport(): BelongsTo
    {
        return $this->belongsTo(DisasterReport::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
