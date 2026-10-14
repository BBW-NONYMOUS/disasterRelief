<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\DisasterReport;
use App\Models\User;

class DisasterReportPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, DisasterReport $report): bool
    {
        return match ($user->role) {
            UserRole::SuperAdmin, UserRole::Admin => true,
            UserRole::PurokPresident => $report->purok_id === $user->purok_id
                || $report->barangay_id === $user->barangay_id,
            UserRole::Resident => $report->reporter_id === $user->id,
            UserRole::Donor => $report->status->value !== 'resolved',
        };
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Resident || $user->role === UserRole::PurokPresident;
    }

    public function update(User $user, DisasterReport $report): bool
    {
        return match ($user->role) {
            UserRole::SuperAdmin, UserRole::Admin => true,
            UserRole::PurokPresident => $report->barangay_id === $user->barangay_id,
            UserRole::Resident => $report->reporter_id === $user->id && $report->status->value === 'reported',
            default => false,
        };
    }

    public function delete(User $user, DisasterReport $report): bool
    {
        return $user->role === UserRole::SuperAdmin
            || $user->role === UserRole::Admin
            || ($user->role === UserRole::Resident && $report->reporter_id === $user->id);
    }
}
