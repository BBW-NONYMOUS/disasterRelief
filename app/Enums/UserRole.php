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
}
