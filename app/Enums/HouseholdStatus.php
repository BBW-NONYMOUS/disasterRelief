<?php

namespace App\Enums;

/** Assistance status of a household; values match DistributionStatus. */
enum HouseholdStatus: string
{
    case Waiting = 'waiting';
    case Ongoing = 'ongoing';
    case Completed = 'completed';

    public function label(): string
    {
        return match($this) {
            self::Waiting => 'Assistance waiting',
            self::Ongoing => 'Ongoing',
            self::Completed => 'Assistance completed',
        };
    }

    public static function options(): array
    {
        return array_map(fn (self $s) => ['value' => $s->value, 'label' => $s->label()], self::cases());
    }
}
