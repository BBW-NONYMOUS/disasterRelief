<?php

namespace App\Policies;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Donation;
use App\Models\User;
use App\Policies\Concerns\ChecksJurisdiction;

class DonationPolicy
{
    use ChecksJurisdiction;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRole::SuperAdmin, UserRole::Admin, UserRole::Donor], true);
    }

    public function view(User $user, Donation $donation): bool
    {
        return $this->handles($user, $donation) || $donation->donor_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Donor;
    }

    /** Record goods hand-over / cash utilisation for the receiving barangay. */
    public function receive(User $user, Donation $donation): bool
    {
        return $this->handles($user, $donation);
    }

    /** Only untouched pledges can be withdrawn; anything paid or received is a record. */
    public function delete(User $user, Donation $donation): bool
    {
        if ($donation->status !== DonationStatus::Pending || $donation->payment_status === PaymentStatus::Paid) {
            return false;
        }

        return $this->handles($user, $donation) || $donation->donor_id === $user->id;
    }

    /** Admins handle donations addressed to their barangay, or unaddressed legacy ones. */
    private function handles(User $user, Donation $donation): bool
    {
        return $user->role === UserRole::SuperAdmin
            || ($user->role === UserRole::Admin
                && ($donation->barangay_id === null || $this->inBarangay($user, $donation->barangay_id)));
    }
}
