<?php

namespace App\Services;

use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Events\DisasterReportChanged;
use App\Jobs\SendDisasterSmsAlerts;
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

        // relief.md event "incident.confirmed": SMS residents in the affected
        // purok who opted in (those without mobile data still get warned).
        if ($report->status === ReportStatus::Confirmed) {
            SendDisasterSmsAlerts::dispatch($report);
        }

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
        return $this->officialsFor($report->barangay_id, $report->purok_id);
    }

    /**
     * Active admins of the barangay plus the purok president, if any.
     *
     * @return Collection<int, User>
     */
    public function officialsFor(?int $barangayId, ?int $purokId): Collection
    {
        $admins = User::where('role', UserRole::Admin->value)
            ->where('barangay_id', $barangayId)
            ->where('status', 'active')
            ->get();

        if ($purokId) {
            $president = User::where('role', UserRole::PurokPresident->value)
                ->where('purok_id', $purokId)
                ->where('status', 'active')
                ->get();

            $admins = $admins->concat($president);
        }

        return $admins->filter()->unique('id')->values();
    }
}
