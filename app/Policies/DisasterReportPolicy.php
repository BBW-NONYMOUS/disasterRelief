<?php

namespace App\Policies;

use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Models\DisasterReport;
use App\Models\User;
use App\Policies\Concerns\ChecksJurisdiction;

class DisasterReportPolicy
{
    use ChecksJurisdiction;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, DisasterReport $report): bool
    {
        return match ($user->role) {
            UserRole::SuperAdmin => true,
            UserRole::Admin => $this->inBarangay($user, $report->barangay_id),
            UserRole::PurokPresident => $this->inPurok($user, $report->purok_id)
                || $this->inBarangay($user, $report->barangay_id),
            UserRole::Resident => $report->reporter_id === $user->id,
            // Donors only see incidents an official has confirmed.
            UserRole::Donor => in_array($report->status, [ReportStatus::Confirmed, ReportStatus::Resolved], true),
        };
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Resident || $user->role === UserRole::PurokPresident;
    }

    /** Editing details only; status moves through the dedicated actions below. */
    public function update(User $user, DisasterReport $report): bool
    {
        return match ($user->role) {
            UserRole::SuperAdmin, UserRole::Admin => $this->isOfficialOf($user, $report->barangay_id),
            UserRole::PurokPresident => $this->inPurok($user, $report->purok_id)
                && $report->status === ReportStatus::Reported,
            UserRole::Resident => $report->reporter_id === $user->id && $report->status === ReportStatus::Reported,
            default => false,
        };
    }

    public function delete(User $user, DisasterReport $report): bool
    {
        return $this->isOfficialOf($user, $report->barangay_id)
            || ($user->role === UserRole::Resident && $report->reporter_id === $user->id
                && $report->status === ReportStatus::Reported);
    }

    /** Purok President of the report's purok; officials stand in when the purok has none. */
    public function verify(User $user, DisasterReport $report): bool
    {
        if ($this->isPresidentOf($user, $report->purok_id)) {
            return true;
        }

        return $this->isOfficialOf($user, $report->barangay_id) && ! $this->purokHasPresident($report->purok_id);
    }

    /** Merging duplicates is part of verification — same people, same jurisdiction. */
    public function merge(User $user, DisasterReport $report): bool
    {
        return $this->isPresidentOf($user, $report->purok_id)
            || $this->isOfficialOf($user, $report->barangay_id);
    }

    public function confirm(User $user, DisasterReport $report): bool
    {
        return $this->isOfficialOf($user, $report->barangay_id);
    }

    public function resolve(User $user, DisasterReport $report): bool
    {
        return $this->isOfficialOf($user, $report->barangay_id);
    }

    public function reject(User $user, DisasterReport $report): bool
    {
        return $this->isOfficialOf($user, $report->barangay_id)
            || ($this->isPresidentOf($user, $report->purok_id) && $report->status === ReportStatus::Reported);
    }
}
