<?php

namespace App\Enums;

enum SeverityLevel: string
{
    case Low = 'low';
    case Moderate = 'moderate';
    case High = 'high';
    case Critical = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::Low => 'Low',
            self::Moderate => 'Moderate',
            self::High => 'High',
            self::Critical => 'Critical',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Low => 'green',
            self::Moderate => 'yellow',
            self::High => 'orange',
            self::Critical => 'red',
        };
    }

    /** Whether an alarm for this severity should be treated as critical (persistent + loud). */
    public function isCritical(): bool
    {
        return $this === self::High || $this === self::Critical;
    }
}
