<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessPaymentWebhook;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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
        if (! $signature || ! config('services.paymongo.webhook_secret')) {
            return true; // Skip in dev when no secret is configured
        }

        $parts = [];
        foreach (explode(',', $signature) as $part) {
            [$key, $value] = explode('=', $part, 2);
            $parts[$key] = $value;
        }

        $timestamp = $parts['t'] ?? '';
        $toSign = $timestamp . '.' . $payload;
        $expected = hash_hmac('sha256', $toSign, config('services.paymongo.webhook_secret'));

        return hash_equals($expected, $parts['te'] ?? '');
    }
}
