<?php

namespace Tests\Feature;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Models\Donation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/** S3 / S4: signed, amount-checked, idempotent payment webhooks. */
class PaymentWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'whsk_test_secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.paymongo.webhook_secret' => self::SECRET]);
    }

    public function test_signed_event_with_matching_amount_marks_the_donation_paid(): void
    {
        $donation = Donation::factory()->create(['amount_cents' => 50000, 'payment_reference' => 'cs_test_1']);

        $this->sendWebhook($this->event($donation, 50000))->assertOk();

        $donation->refresh();
        $this->assertSame(PaymentStatus::Paid, $donation->payment_status);
        $this->assertSame(DonationStatus::Confirmed, $donation->status);
        $this->assertSame(1, $donation->donor->notifications()->count());
    }

    public function test_bad_signature_is_rejected(): void
    {
        $donation = Donation::factory()->create(['amount_cents' => 50000]);

        $this->sendWebhook($this->event($donation, 50000), 'forged-secret')->assertForbidden();
        $this->assertSame(PaymentStatus::Pending, $donation->fresh()->payment_status);
    }

    public function test_missing_signature_is_rejected(): void
    {
        $donation = Donation::factory()->create(['amount_cents' => 50000]);

        $this->call('POST', '/webhooks/payment', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($this->event($donation, 50000)))
            ->assertForbidden();
    }

    public function test_unsigned_events_are_rejected_in_production_when_no_secret_is_configured(): void
    {
        config(['services.paymongo.webhook_secret' => null]);
        $this->app->detectEnvironment(fn () => 'production');
        $donation = Donation::factory()->create(['amount_cents' => 50000]);

        $this->call('POST', '/webhooks/payment', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($this->event($donation, 50000)))
            ->assertForbidden();
        $this->assertSame(PaymentStatus::Pending, $donation->fresh()->payment_status);
    }

    public function test_amount_or_currency_mismatch_is_ignored(): void
    {
        $donation = Donation::factory()->create(['amount_cents' => 50000, 'payment_reference' => 'cs_test_1']);

        $this->sendWebhook($this->event($donation, 100))->assertOk();
        $this->sendWebhook($this->event($donation, 50000, currency: 'USD'))->assertOk();

        $this->assertSame(PaymentStatus::Pending, $donation->fresh()->payment_status);
    }

    public function test_events_for_a_different_checkout_session_are_ignored(): void
    {
        $donation = Donation::factory()->create(['amount_cents' => 50000, 'payment_reference' => 'cs_real']);

        $this->sendWebhook($this->event($donation, 50000, sessionId: 'cs_someone_else'))->assertOk();

        $this->assertSame(PaymentStatus::Pending, $donation->fresh()->payment_status);
    }

    public function test_redelivered_and_late_failure_events_do_not_change_a_paid_donation(): void
    {
        $donation = Donation::factory()->create(['amount_cents' => 50000, 'payment_reference' => 'cs_test_1']);

        $this->sendWebhook($this->event($donation, 50000))->assertOk();
        $this->sendWebhook($this->event($donation, 50000))->assertOk();
        $this->sendWebhook($this->event($donation, 50000, type: 'payment.failed'))->assertOk();

        $this->assertSame(PaymentStatus::Paid, $donation->fresh()->payment_status);
        $this->assertSame(1, $donation->donor->notifications()->count());
    }

    private function event(Donation $donation, int $amount, string $type = 'checkout_session.payment.paid', string $currency = 'PHP', string $sessionId = 'cs_test_1'): array
    {
        return [
            'data' => [
                'id' => 'evt_'.uniqid(),
                'type' => 'event',
                'attributes' => [
                    'type' => $type,
                    'livemode' => false,
                    'data' => [
                        'id' => $sessionId,
                        'type' => 'checkout_session',
                        'attributes' => [
                            'reference_number' => (string) $donation->id,
                            'payments' => [
                                ['id' => 'pay_1', 'type' => 'payment', 'attributes' => ['amount' => $amount, 'currency' => $currency, 'status' => 'paid']],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    private function sendWebhook(array $payload, string $secret = self::SECRET): TestResponse
    {
        $body = json_encode($payload);
        $timestamp = time();
        $signature = "t={$timestamp},te=".hash_hmac('sha256', "{$timestamp}.{$body}", $secret).',li=';

        return $this->call('POST', '/webhooks/payment', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_PAYMONGO_SIGNATURE' => $signature,
        ], $body);
    }
}
