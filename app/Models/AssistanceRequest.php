<?php

namespace App\Models;

use App\Enums\AssistanceRequestStatus;
use App\Enums\AssistanceType;
use App\Enums\RequestPriority;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class AssistanceRequest extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'requester_id', 'disaster_report_id', 'barangay_id', 'purok_id', 'household_id',
        'type', 'quantity', 'goods_needed', 'urgency', 'priority', 'status',
        'verified_at', 'verified_by', 'approved_at', 'approved_by', 'fulfilled_at', 'remarks',
    ];

    protected $casts = [
        'status' => AssistanceRequestStatus::class,
        'type' => AssistanceType::class,
        'priority' => RequestPriority::class,
        'quantity' => 'integer',
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function disasterReport(): BelongsTo
    {
        return $this->belongsTo(DisasterReport::class);
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function purok(): BelongsTo
    {
        return $this->belongsTo(Purok::class);
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function distributions(): HasMany
    {
        return $this->hasMany(Distribution::class);
    }

    /**
     * Admin queue order: open requests first, then by priority (falling back
     * to the resident's urgency until an official tags one), then oldest first.
     */
    public function scopePrioritized(Builder $query): Builder
    {
        return $query
            ->orderByRaw("case when status in ('fulfilled', 'rejected') then 1 else 0 end")
            ->orderByRaw("case coalesce(priority, case urgency when 'critical' then 'critical' when 'urgent' then 'high' else 'normal' end)
                when 'critical' then 0 when 'high' then 1 else 2 end")
            ->orderBy('created_at')
            ->orderBy('id');
    }

    /**
     * Approved needs aggregated per barangay and type, without any household
     * or requester details — safe to show to donors.
     */
    public static function openNeeds(?int $barangayId = null): Collection
    {
        return static::query()
            ->where('status', AssistanceRequestStatus::Approved)
            ->when($barangayId, fn ($q) => $q->where('barangay_id', $barangayId))
            ->selectRaw("barangay_id, type, sum(quantity) as total_quantity, count(*) as requests,
                min(case priority when 'critical' then 0 when 'high' then 1 else 2 end) as top_rank")
            ->groupBy('barangay_id', 'type')
            ->orderBy('top_rank')
            ->orderByDesc('total_quantity')
            ->with('barangay:id,name')
            ->get()
            ->map(fn (self $row) => [
                'barangay_id' => $row->barangay_id,
                'barangay' => $row->barangay?->name ?? 'Unassigned',
                'type' => $row->type?->value,
                'type_label' => $row->type?->label(),
                'total_quantity' => (int) $row->total_quantity,
                'requests' => (int) $row->requests,
                'priority' => RequestPriority::fromRank((int) $row->top_rank)->value,
            ]);
    }
}
