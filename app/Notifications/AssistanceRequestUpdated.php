<?php

namespace App\Notifications;

use App\Models\AssistanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AssistanceRequestUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public AssistanceRequest $assistanceRequest,
        public string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'assistance_request_updated',
            'assistance_request_id' => $this->assistanceRequest->id,
            'status' => $this->assistanceRequest->status->value,
            'message' => $this->message,
            'url' => route('assistance-requests.show', $this->assistanceRequest, false),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable) + ['sound' => true]);
    }
}
