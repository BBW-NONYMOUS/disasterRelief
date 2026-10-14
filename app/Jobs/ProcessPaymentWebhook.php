<?php

namespace App\Jobs;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Models\Donation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessPaymentWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public array $payload) {}

    public function handle(): void
    {
        $type = $this->payload['data']['attributes']['type'] ?? null;
        $resource = $this->payload['data']['attributes']['data'] ?? [];
        $referenceNumber = $resource['attributes']['reference_number'] ?? null;

        if (! $referenceNumber) {
            return;
        }

        $donation = Donation::find($referenceNumber);
        if (! $donation) {
            Log::warning("Webhook: donation #{$referenceNumber} not found.");
            return;
        }

        match ($type) {
            'payment.paid' => $donation->update([
                'payment_status' => PaymentStatus::Paid,
                'status' => DonationStatus::Confirmed,
            ]),
            'payment.failed' => $donation->update(['payment_status' => PaymentStatus::Failed]),
            default => null,
        };
    }
}
