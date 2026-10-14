<?php

namespace App\Services;

use App\Models\Donation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    private string $baseUrl = 'https://api.paymongo.com/v1';

    public function createCheckout(Donation $donation): ?string
    {
        $secretKey = config('services.paymongo.secret_key');

        if (! $secretKey) {
            Log::warning('PayMongo secret key not configured.');
            return null;
        }

        try {
            $response = Http::withBasicAuth($secretKey, '')
                ->post("{$this->baseUrl}/checkout_sessions", [
                    'data' => [
                        'attributes' => [
                            'line_items' => [
                                [
                                    'currency' => 'PHP',
                                    'amount' => $donation->amount_cents,
                                    'name' => 'ReliefNet Donation',
                                    'quantity' => 1,
                                ],
                            ],
                            'payment_method_types' => ['gcash', 'card', 'paymaya'],
                            'success_url' => route('donations.index') . '?status=paid',
                            'cancel_url' => route('donations.index') . '?status=cancelled',
                            'reference_number' => (string) $donation->id,
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $checkoutUrl = $response->json('data.attributes.checkout_url');
                $donation->update(['payment_reference' => $response->json('data.id')]);
                return $checkoutUrl;
            }
        } catch (\Exception $e) {
            Log::error('PayMongo checkout error: ' . $e->getMessage());
        }

        return null;
    }

    public function retrievePayment(string $paymentId): ?array
    {
        $secretKey = config('services.paymongo.secret_key');

        if (! $secretKey) {
            return null;
        }

        try {
            $response = Http::withBasicAuth($secretKey, '')
                ->get("{$this->baseUrl}/payments/{$paymentId}");

            if ($response->successful()) {
                return $response->json('data');
            }
        } catch (\Exception $e) {
            Log::error('PayMongo retrieve error: ' . $e->getMessage());
        }

        return null;
    }
}
