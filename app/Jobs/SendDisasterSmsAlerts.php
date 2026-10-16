<?php

namespace App\Jobs;

use App\Enums\UserRole;
use App\Models\DisasterReport;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * relief.md event "incident.confirmed": SMS the residents of the affected
 * purok (or whole barangay when the report has no purok). Opt-in only —
 * every text costs money — and queued so the confirm action stays fast.
 */
class SendDisasterSmsAlerts implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public DisasterReport $report) {}

    public function handle(SmsService $sms): void
    {
        $report = $this->report;

        $recipients = User::where('barangay_id', $report->barangay_id)
            ->when($report->purok_id, fn ($q) => $q->where('purok_id', $report->purok_id))
            ->where('role', UserRole::Resident->value)
            ->where('status', 'active')
            ->where('prefers_sms', true)
            ->whereNotNull('phone')
            ->get(['id', 'phone']);

        $area = $report->affected_area ?: ($report->purok?->name ?? $report->barangay?->name ?? 'your area');
        $message = "RELIEFNET ALERT: {$report->type} confirmed in {$area}. "
            . 'Follow barangay instructions. Reply via the app if you need assistance.';

        foreach ($recipients as $recipient) {
            $sms->send($recipient->phone, $message);
        }
    }
}
