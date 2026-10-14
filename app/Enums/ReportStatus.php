<?php

namespace App\Enums;

enum ReportStatus: string
{
    case Reported = 'reported';
    case Confirmed = 'confirmed';
    case Resolved = 'resolved';

    public function label(): string
    {
        return match($this) {
            self::Reported => 'Reported',
            self::Confirmed => 'Confirmed',
            self::Resolved => 'Resolved',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Reported => 'yellow',
            self::Confirmed => 'blue',
            self::Resolved => 'green',
        };
    }
}
