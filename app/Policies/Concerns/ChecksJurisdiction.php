<?php

namespace App\Policies\Concerns;

use App\Enums\UserRole;
use App\Models\User;

trait ChecksJurisdiction
{
    protected function inBarangay(User $user, mixed $barangayId): bool
    {
        return $user->barangay_id !== null && $barangayId !== null
            && (int) $user->barangay_id === (int) $barangayId;
    }

    protected function inPurok(User $user, mixed $purokId): bool
    {
        return $user->purok_id !== null && $purokId !== null
            && (int) $user->purok_id === (int) $purokId;
    }

    /** Super Admin anywhere, or an Admin of that barangay. */
    protected function isOfficialOf(User $user, mixed $barangayId): bool
    {
        return $user->role === UserRole::SuperAdmin
            || ($user->role === UserRole::Admin && $this->inBarangay($user, $barangayId));
    }

    protected function isPresidentOf(User $user, mixed $purokId): bool
    {
        return $user->role === UserRole::PurokPresident && $this->inPurok($user, $purokId);
    }

    /**
     * Whether an active Purok President covers this purok. When none does,
     * barangay officials may perform the purok-level verification step so
     * reports and requests are never stuck.
     */
    protected function purokHasPresident(mixed $purokId): bool
    {
        return $purokId !== null && User::where('role', UserRole::PurokPresident->value)
            ->where('purok_id', $purokId)
            ->where('status', 'active')
            ->exists();
    }
}
