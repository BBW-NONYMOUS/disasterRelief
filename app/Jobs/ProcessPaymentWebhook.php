<?php

namespace App\Jobs;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Models\Donation;
use App\Notifications\DonationUpdated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessPaymentWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const PAID_EVENTS = ['payment.paid', 'checkout_session.payment.paid'];

    public function __construct(public array $payload) {}

    public function handle(): void
    {
        $type = $this->payload['data']['attributes']['type'] ?? null;
        $resource = $this->payload['data']['attributes']['data'] ?? [];
        $referenceNumber = $resource['attributes']['reference_number'] ?? null;

        if (! $referenceNumber || ! in_array($type, [...self::PAID_EVENTS, 'payment.failed'], true)) {
            return;
        }

        $paid = DB::transaction(function () use ($type, $resource, $referenceNumber) {
            $donation = Donation::lockForUpdate()->find($referenceNumber);
            if (! $donation) {
                Log::warning("Webhook: donation #{$referenceNumber} not found.");

                return null;
            }

            // Idempotent: PayMongo retries deliveries, and a paid donation is final.
            if ($donation->payment_status === PaymentStatus::Paid) {
                return null;
            }

            if ($type === 'payment.failed') {
                $donation->update(['payment_status' => PaymentStatus::Failed]);

                return null;
            }

            if (! $this->matchesDonation($donation, $resource)) {
                return null;
            }

            $donation->update([
                'payment_status' => PaymentStatus::Paid,
                'status' => DonationStatus::Confirmed,
            ]);

            return $donation;
        });

        $paid?->donor?->notify(new DonationUpdated($paid, "Payment received for your ₱".number_format($paid->amount_cents / 100, 2).' donation. Thank you!'));
    }

    /** The event must be for this checkout and carry exactly the pledged amount in PHP. */
    private function matchesDonation(Donation $donation, array $resource): bool
    {
        [$amount, $currency] = $this->amountOf($resource);

        if ($donation->type !== 'cash' || $amount !== (int) $donation->amount_cents || strtoupper((string) $currency) !== 'PHP') {
            Log::warning('Webhook: payment does not match donation; ignored.', [
                'donation_id' => $donation->id,
                'expected_cents' => $donation->amount_cents,
                'received_cents' => $amount,
                'currency' => $currency,
            ]);

            return false;
        }

        $isCheckout = ($resource['type'] ?? null) === 'checkout_session';
        if ($isCheckout && $donation->payment_reference && ($resource['id'] ?? null) !== $donation->payment_reference) {
            Log::warning('Webhook: checkout session does not match donation; ignored.', [
                'donation_id' => $donation->id,
                'expected_session' => $donation->payment_reference,
                'received_session' => $resource['id'] ?? null,
            ]);

            return false;
        }

        return true;
    }

    /** @return array{0: int, 1: ?string} amount in centavos and currency */
    private function amountOf(array $resource): array
    {
        $attributes = $resource['attributes'] ?? [];

        if (($resource['type'] ?? null) === 'checkout_session') {
            $payments = $attributes['payments'] ?? [];
            if ($payments) {
                return [
                    array_sum(array_map(fn ($p) => (int) ($p['attributes']['amount'] ?? 0), $payments)),
                    $payments[0]['attributes']['currency'] ?? null,
                ];
            }

            $lines = $attributes['line_items'] ?? [];

            return [
                array_sum(array_map(fn ($l) => (int) ($l['amount'] ?? 0) * (int) ($l['quantity'] ?? 1), $lines)),
                $lines[0]['currency'] ?? null,
            ];
        }

        return [(int) ($attributes['amount'] ?? -1), $attributes['currency'] ?? null];
    }
}
