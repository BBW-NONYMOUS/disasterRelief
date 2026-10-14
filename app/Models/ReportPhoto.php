<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportPhoto extends Model
{
    use HasFactory;

    protected $fillable = ['disaster_report_id', 'path'];

    public function disasterReport(): BelongsTo
    {
        return $this->belongsTo(DisasterReport::class);
    }
}
