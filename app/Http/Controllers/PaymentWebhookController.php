<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPaymentWebhook;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request): Response
    {
        $signature = $request->header('Paymongo-Signature');

        if (! $this->verifySignature($request->getContent(), $signature)) {
            abort(403, 'Invalid signature.');
        }

        ProcessPaymentWebhook::dispatch($request->all());

        return response('OK', 200);
    }

    private function verifySignature(string $payload, ?string $signature): bool
    {
        $secret = config('services.paymongo.webhook_secret');

        if (! $secret) {
            // A missing env var must never turn into "accept forged payment.paid events".
            if (app()->isProduction()) {
                Log::critical('PayMongo webhook rejected: PAYMONGO_WEBHOOK_SECRET is not configured.');

                return false;
            }

            Log::warning('PayMongo webhook accepted WITHOUT signature verification (no secret configured, non-production).');

            return true;
        }

        if (! $signature) {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signature) as $part) {
            if (str_contains($part, '=')) {
                [$key, $value] = explode('=', $part, 2);
                $parts[trim($key)] = trim($value);
            }
        }

        if (empty($parts['t'])) {
            return false;
        }

        $expected = hash_hmac('sha256', $parts['t'].'.'.$payload, $secret);

        // PayMongo signs test-mode events in "te" and live-mode events in "li".
        foreach (['li', 'te'] as $key) {
            if (! empty($parts[$key]) && hash_equals($expected, $parts[$key])) {
                return true;
            }
        }

        return false;
    }
}
