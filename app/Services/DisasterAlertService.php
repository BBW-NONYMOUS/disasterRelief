<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Events\DisasterReportChanged;
use App\Models\DisasterReport;
use App\Models\User;
use App\Notifications\DisasterReportUpdated;
use App\Notifications\NewDisasterReport;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

/**
 * Central place that decides who gets alarmed when a disaster report is
 * created or changes. Keeps recipient logic out of the controller so the
 * "new report" and "status changed" flows stay consistent.
 */
class DisasterAlertService
{
    /** Alarm the responders when a new report is filed. */
    public function reportCreated(DisasterReport $report): void
    {
        Notification::send(
            $this->responders($report),
            new NewDisasterReport($report),
        );

        DisasterReportChanged::dispatch($report, 'created');
    }

    /** Alarm responders + the original reporter when the report's status changes. */
    public function statusChanged(DisasterReport $report): void
    {
        $recipients = $this->responders($report);

        if ($report->reporter) {
            $recipients = $recipients->push($report->reporter);
        }

        Notification::send(
            $recipients->unique('id')->values(),
            new DisasterReportUpdated($report, 'status_changed'),
        );

        DisasterReportChanged::dispatch($report, 'status_changed');
    }

    /**
     * Officials who should be alarmed about activity on this report:
     * the barangay's admins and the purok president (if assigned).
     *
     * @return Collection<int, User>
     */
    private function responders(DisasterReport $report): Collection
    {
        $admins = User::where('role', UserRole::Admin->value)
            ->where('barangay_id', $report->barangay_id)
            ->get();

        if ($report->purok_id) {
            $president = User::where('role', UserRole::PurokPresident->value)
                ->where('purok_id', $report->purok_id)
                ->get();

            $admins = $admins->concat($president);
        }

        return $admins->filter()->unique('id')->values();
    }
}
