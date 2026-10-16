<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\InventoryItem;
use App\Models\User;
use App\Policies\Concerns\ChecksJurisdiction;

class InventoryItemPolicy
{
    use ChecksJurisdiction;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRole::SuperAdmin, UserRole::Admin], true);
    }

    public function view(User $user, InventoryItem $item): bool
    {
        return $this->isOfficialOf($user, $item->barangay_id);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, InventoryItem $item): bool
    {
        return $this->isOfficialOf($user, $item->barangay_id);
    }

    public function delete(User $user, InventoryItem $item): bool
    {
        return $this->isOfficialOf($user, $item->barangay_id);
    }
}
