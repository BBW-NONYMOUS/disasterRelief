<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Household;
use App\Models\User;
use App\Policies\Concerns\ChecksJurisdiction;

class HouseholdPolicy
{
    use ChecksJurisdiction;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRole::SuperAdmin, UserRole::Admin, UserRole::PurokPresident], true);
    }

    public function view(User $user, Household $household): bool
    {
        return $this->isOfficialOf($user, $household->purok?->barangay_id)
            || $this->isPresidentOf($user, $household->purok_id);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, Household $household): bool
    {
        return $this->view($user, $household);
    }

    public function delete(User $user, Household $household): bool
    {
        return $this->isOfficialOf($user, $household->purok?->barangay_id);
    }

    /** Only the household's own Purok President vouches for it on the ground. */
    public function verify(User $user, Household $household): bool
    {
        return $this->isPresidentOf($user, $household->purok_id);
    }
}
