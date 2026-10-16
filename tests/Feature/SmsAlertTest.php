<?php

namespace Tests\Feature;

use App\Enums\ReportStatus;
use App\Jobs\SendDisasterSmsAlerts;
use App\Models\DisasterReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** relief.md objective 9 / event "incident.confirmed": SMS for residents without mobile data. */
class SmsAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirming_an_incident_queues_sms_alerts(): void
    {
        Bus::fake([SendDisasterSmsAlerts::class]);
        ['barangay' => $barangay, 'purok' => $purok, 'admin' => $admin, 'resident' => $resident] = $this->community();

        $report = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Verified,
        ]);

        $this->actingAs($admin)->post("/disaster-reports/{$report->id}/confirm")->assertSessionHas('success');

        Bus::assertDispatched(SendDisasterSmsAlerts::class, fn ($job) => $job->report->is($report));
    }

    public function test_only_opted_in_residents_of_the_affected_purok_are_texted(): void
    {
        config(['services.semaphore.key' => 'test-key']);
        Http::fake(['api.semaphore.co/*' => Http::response(['status' => 'ok'])]);

        ['barangay' => $barangay, 'purok' => $purok, 'resident' => $resident] = $this->community();
        $resident->update(['phone' => '09171234567', 'prefers_sms' => true]);

        // Opted out, no phone, and out-of-barangay residents are skipped.
        User::factory()->create(['barangay_id' => $barangay->id, 'purok_id' => $purok->id, 'phone' => '09170000001', 'prefers_sms' => false]);
        User::factory()->create(['barangay_id' => $barangay->id, 'purok_id' => $purok->id, 'phone' => null, 'prefers_sms' => true]);
        $outside = User::factory()->create(['phone' => '09170000002', 'prefers_sms' => true]);

        $report = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Confirmed,
        ]);

        (new SendDisasterSmsAlerts($report))->handle(app(\App\Services\SmsService::class));

        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request['number'] === '09171234567'
            && str_contains($request['message'], 'RELIEFNET ALERT'));
    }

    public function test_sms_is_skipped_safely_when_no_api_key_is_configured(): void
    {
        config(['services.semaphore.key' => null]);
        Http::fake();

        ['barangay' => $barangay, 'purok' => $purok, 'resident' => $resident] = $this->community();
        $resident->update(['phone' => '09171234567', 'prefers_sms' => true]);

        $report = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Confirmed,
        ]);

        (new SendDisasterSmsAlerts($report))->handle(app(\App\Services\SmsService::class));

        Http::assertNothingSent();
    }
}
