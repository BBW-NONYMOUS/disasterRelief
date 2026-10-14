<?php

namespace App\Notifications;

use App\Models\DisasterReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewDisasterReport extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public DisasterReport $report) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'new_disaster_report',
            'report_id' => $this->report->id,
            'report_type' => $this->report->type,
            'affected_area' => $this->report->affected_area,
            'reporter_name' => $this->report->reporter->name,
            'message' => "New {$this->report->type} report filed for {$this->report->affected_area}",
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'new_disaster_report',
            'report_id' => $this->report->id,
            'message' => "New {$this->report->type} report filed for {$this->report->affected_area}",
            'sound' => true,
        ]);
    }
}
