<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistanceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id', 'disaster_report_id', 'goods_needed', 'urgency', 'status',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function disasterReport(): BelongsTo
    {
        return $this->belongsTo(DisasterReport::class);
    }
}
