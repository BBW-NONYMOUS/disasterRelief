<?php

namespace App\Events;

use App\Models\DisasterReport;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast to the barangay's disaster feed so the live situation map can
 * add/update a marker without a page reload. Separate from the per-user
 * notification (which drives the personal alarm bell).
 */
class DisasterReportChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  string  $event  "created" | "status_changed"
     */
    public function __construct(
        public DisasterReport $report,
        public string $event,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('disasters.barangay.'.$this->report->barangay_id);
    }

    public function broadcastAs(): string
    {
        return 'disaster.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'event' => $this->event,
            'id' => $this->report->id,
            'type' => $this->report->type,
            'affected_area' => $this->report->affected_area,
            'status' => $this->report->status->value,
            'severity' => $this->report->severity?->value,
            'critical' => (bool) $this->report->severity?->isCritical(),
            'latitude' => $this->report->latitude,
            'longitude' => $this->report->longitude,
            'barangay_id' => $this->report->barangay_id,
        ];
    }
}
