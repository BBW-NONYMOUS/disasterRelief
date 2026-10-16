<?php

namespace App\Notifications;

use App\Models\Donation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class DonationUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Donation $donation,
        public string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'donation_updated',
            'donation_id' => $this->donation->id,
            'status' => $this->donation->status->value,
            'message' => $this->message,
            'url' => route('donations.show', $this->donation, false),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable) + ['sound' => true]);
    }
}
