<?php

namespace App\Enums;

enum DistributionStatus: string
{
    case Waiting = 'waiting';
    case Ongoing = 'ongoing';
    case Completed = 'completed';

    public function label(): string
    {
        return match($this) {
            self::Waiting => 'Waiting',
            self::Ongoing => 'Ongoing',
            self::Completed => 'Completed',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Waiting => 'yellow',
            self::Ongoing => 'blue',
            self::Completed => 'green',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return match($this) {
            self::Waiting => $next === self::Ongoing,
            self::Ongoing => $next === self::Completed,
            self::Completed => false,
        };
    }
}
