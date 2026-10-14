<?php

namespace App\Notifications;

use App\Models\Distribution;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class DistributionStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Distribution $distribution) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'distribution_status_changed',
            'distribution_id' => $this->distribution->id,
            'status' => $this->distribution->status->value,
            'message' => "Distribution status updated to {$this->distribution->status->label()}",
            'sound' => true,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
