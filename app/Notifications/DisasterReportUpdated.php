<?php

namespace App\Notifications;

use App\Models\DisasterReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class DisasterReportUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  string  $event  What changed, e.g. "status_changed".
     */
    public function __construct(
        public DisasterReport $report,
        public string $event = 'status_changed',
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return $this->payload();
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->payload() + ['sound' => true]);
    }

    private function payload(): array
    {
        $status = $this->report->status;

        return [
            'type' => 'disaster_report_updated',
            'event' => $this->event,
            'report_id' => $this->report->id,
            'report_type' => $this->report->type,
            'affected_area' => $this->report->affected_area,
            'status' => $status->value,
            'severity' => $this->report->severity?->value,
            'critical' => (bool) $this->report->severity?->isCritical(),
            'latitude' => $this->report->latitude,
            'longitude' => $this->report->longitude,
            'message' => "{$this->report->type} report for {$this->report->affected_area} is now {$status->label()}",
        ];
    }
}
