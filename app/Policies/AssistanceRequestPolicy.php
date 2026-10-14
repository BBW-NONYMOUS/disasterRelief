<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AssistanceRequest;
use App\Models\User;

class AssistanceRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AssistanceRequest $request): bool
    {
        return $user->role === UserRole::SuperAdmin
            || $user->role === UserRole::Admin
            || $user->role === UserRole::PurokPresident
            || $request->requester_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Resident;
    }

    public function update(User $user, AssistanceRequest $request): bool
    {
        return $user->role === UserRole::Admin
            || $user->role === UserRole::SuperAdmin
            || $user->role === UserRole::PurokPresident;
    }

    public function delete(User $user, AssistanceRequest $request): bool
    {
        return $user->role === UserRole::Admin
            || $user->role === UserRole::SuperAdmin
            || $request->requester_id === $user->id;
    }
}
