<?php

namespace App\Enums;

enum DonationStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Delivered = 'delivered';
    case Distributed = 'distributed';

    public function label(): string
    {
        return match($this) {
            self::Pending => 'Pending',
            self::Confirmed => 'Confirmed',
            self::Delivered => 'Received',
            self::Distributed => 'Distributed',
        };
    }
}
