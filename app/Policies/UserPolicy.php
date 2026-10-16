<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Policies\Concerns\ChecksJurisdiction;

/**
 * Super Admins manage every account. Admins manage community accounts
 * (Purok Presidents, Residents, Donors) in their own barangay, plus their
 * own profile — never other Admins or Super Admins. Only the Super Admin
 * can restrict (suspend) or restore an account.
 */
class UserPolicy
{
    use ChecksJurisdiction;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRole::SuperAdmin, UserRole::Admin], true);
    }

    public function view(User $user, User $target): bool
    {
        return $user->role === UserRole::SuperAdmin
            || $user->is($target)
            || ($user->role === UserRole::Admin && $this->inBarangay($user, $target->barangay_id)
                && $target->role !== UserRole::SuperAdmin);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, User $target): bool
    {
        return $user->role === UserRole::SuperAdmin
            || ($user->role === UserRole::Admin && ($user->is($target) || $this->manages($user, $target)));
    }

    /** Suspending or restoring access is reserved to the Super Admin, never on themselves. */
    public function restrict(User $user, User $target): bool
    {
        return $user->role === UserRole::SuperAdmin && ! $user->is($target);
    }

    private function manages(User $admin, User $target): bool
    {
        return $admin->role === UserRole::Admin
            && $this->inBarangay($admin, $target->barangay_id)
            && in_array($target->role, UserRole::assignableBy(UserRole::Admin), true);
    }
}
