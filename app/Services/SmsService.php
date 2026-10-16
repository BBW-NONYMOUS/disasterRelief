<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SMS alerts via Semaphore (semaphore.co) — relief.md objective 9.
 *
 * Without an API key the service logs instead of sending, so the whole
 * alert pipeline can be developed and demoed at zero cost.
 */
class SmsService
{
    private const ENDPOINT = 'https://api.semaphore.co/api/v4/messages';

    public function isConfigured(): bool
    {
        return (bool) config('services.semaphore.key');
    }

    public function send(string $phone, string $message): bool
    {
        if (! $this->isConfigured()) {
            Log::info('SMS skipped (SEMAPHORE_API_KEY not set).', ['to' => $phone, 'message' => $message]);

            return false;
        }

        try {
            $response = Http::asForm()->post(self::ENDPOINT, [
                'apikey' => config('services.semaphore.key'),
                'number' => $phone,
                'message' => $message,
                'sendername' => config('services.semaphore.sender_name'),
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::warning('Semaphore rejected an SMS.', ['to' => $phone, 'status' => $response->status(), 'body' => $response->body()]);
        } catch (\Exception $e) {
            Log::error('SMS send failed: ' . $e->getMessage(), ['to' => $phone]);
        }

        return false;
    }
}
