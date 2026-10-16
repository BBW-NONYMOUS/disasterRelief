<?php

namespace App\Enums;

enum RequestPriority: string
{
    case Critical = 'critical';
    case High = 'high';
    case Normal = 'normal';

    public function label(): string
    {
        return match($this) {
            self::Critical => 'Critical',
            self::High => 'High',
            self::Normal => 'Normal',
        };
    }

    /** Lower rank sorts first in the admin queue. */
    public function rank(): int
    {
        return match($this) {
            self::Critical => 0,
            self::High => 1,
            self::Normal => 2,
        };
    }

    public static function fromRank(int $rank): self
    {
        return match($rank) {
            0 => self::Critical,
            1 => self::High,
            default => self::Normal,
        };
    }

    public static function options(): array
    {
        return array_map(fn (self $p) => ['value' => $p->value, 'label' => $p->label()], self::cases());
    }
}
