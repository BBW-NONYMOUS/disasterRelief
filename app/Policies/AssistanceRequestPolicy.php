<?php

namespace App\Policies;

use App\Enums\AssistanceRequestStatus;
use App\Enums\UserRole;
use App\Models\AssistanceRequest;
use App\Models\User;
use App\Policies\Concerns\ChecksJurisdiction;

class AssistanceRequestPolicy
{
    use ChecksJurisdiction;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AssistanceRequest $request): bool
    {
        return match ($user->role) {
            UserRole::SuperAdmin => true,
            UserRole::Admin => $this->inBarangay($user, $request->barangay_id),
            UserRole::PurokPresident => $this->inPurok($user, $request->purok_id),
            UserRole::Resident => $request->requester_id === $user->id,
            // Donors see approved needs only, with household details stripped by the controller.
            UserRole::Donor => $request->status === AssistanceRequestStatus::Approved,
        };
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Resident;
    }

    public function verify(User $user, AssistanceRequest $request): bool
    {
        if ($this->isPresidentOf($user, $request->purok_id)) {
            return true;
        }

        return $this->isOfficialOf($user, $request->barangay_id) && ! $this->purokHasPresident($request->purok_id);
    }

    public function approve(User $user, AssistanceRequest $request): bool
    {
        return $this->isOfficialOf($user, $request->barangay_id);
    }

    public function reject(User $user, AssistanceRequest $request): bool
    {
        return $this->isOfficialOf($user, $request->barangay_id)
            || ($this->isPresidentOf($user, $request->purok_id) && $request->status === AssistanceRequestStatus::Pending);
    }

    public function fulfill(User $user, AssistanceRequest $request): bool
    {
        return $this->isOfficialOf($user, $request->barangay_id);
    }

    public function delete(User $user, AssistanceRequest $request): bool
    {
        return $this->isOfficialOf($user, $request->barangay_id)
            || ($request->requester_id === $user->id && $request->status === AssistanceRequestStatus::Pending);
    }
}
