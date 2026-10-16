<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case PurokPresident = 'purok_president';
    case Resident = 'resident';
    case Donor = 'donor';

    public function label(): string
    {
        return match($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Community Administrator',
            self::PurokPresident => 'Purok President',
            self::Resident => 'Resident',
            self::Donor => 'Donor',
        };
    }

    /** Roles an actor may hand out: admins manage only community-level accounts. */
    public static function assignableBy(self $actor): array
    {
        return match($actor) {
            self::SuperAdmin => self::cases(),
            self::Admin => [self::PurokPresident, self::Resident, self::Donor],
            default => [],
        };
    }

    public static function options(array $roles): array
    {
        return array_map(fn (self $r) => ['value' => $r->value, 'label' => $r->label()], $roles);
    }
}
