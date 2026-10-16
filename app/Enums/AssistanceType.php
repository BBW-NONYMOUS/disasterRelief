<?php

namespace App\Enums;

enum AssistanceType: string
{
    case Food = 'food';
    case Water = 'water';
    case Medicine = 'medicine';
    case Shelter = 'shelter';
    case Evacuation = 'evacuation';
    case Other = 'other';

    public function label(): string
    {
        return match($this) {
            self::Food => 'Food',
            self::Water => 'Water',
            self::Medicine => 'Medicine',
            self::Shelter => 'Shelter',
            self::Evacuation => 'Evacuation',
            self::Other => 'Other',
        };
    }

    public static function options(): array
    {
        return array_map(fn (self $t) => ['value' => $t->value, 'label' => $t->label()], self::cases());
    }
}
