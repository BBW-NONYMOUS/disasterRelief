<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Donation;
use App\Models\User;

class DonationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Donation $donation): bool
    {
        return $user->role === UserRole::SuperAdmin
            || $user->role === UserRole::Admin
            || $donation->donor_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Donor;
    }

    public function update(User $user, Donation $donation): bool
    {
        return $user->role === UserRole::Admin
            || $user->role === UserRole::SuperAdmin
            || ($user->role === UserRole::Donor && $donation->donor_id === $user->id);
    }

    public function delete(User $user, Donation $donation): bool
    {
        return $user->role === UserRole::Admin
            || $user->role === UserRole::SuperAdmin
            || ($user->role === UserRole::Donor && $donation->donor_id === $user->id
                && $donation->status->value === 'pending');
    }
}
