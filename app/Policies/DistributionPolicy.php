<?php

namespace App\Policies;

use App\Enums\DistributionStatus;
use App\Enums\UserRole;
use App\Models\Distribution;
use App\Models\User;
use App\Policies\Concerns\ChecksJurisdiction;

class DistributionPolicy
{
    use ChecksJurisdiction;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRole::SuperAdmin, UserRole::Admin, UserRole::PurokPresident], true);
    }

    public function view(User $user, Distribution $distribution): bool
    {
        return $this->isOfficialOf($user, $distribution->barangay_id)
            || $this->isPresidentOf($user, $distribution->household?->purok_id);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    /** Signature capture and status changes; completed hand-overs are final. */
    public function update(User $user, Distribution $distribution): bool
    {
        return $distribution->status !== DistributionStatus::Completed && $this->view($user, $distribution);
    }

    /** Cancelling returns the goods to stock, so only before the hand-over starts. */
    public function delete(User $user, Distribution $distribution): bool
    {
        return $distribution->status === DistributionStatus::Waiting && $this->view($user, $distribution);
    }
}
