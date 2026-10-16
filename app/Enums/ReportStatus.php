<?php

namespace App\Enums;

enum ReportStatus: string
{
    case Reported = 'reported';
    case Verified = 'verified';
    case Confirmed = 'confirmed';
    case Resolved = 'resolved';
    case Rejected = 'rejected';
    case Merged = 'merged';

    public function label(): string
    {
        return match($this) {
            self::Reported => 'Reported',
            self::Verified => 'Verified',
            self::Confirmed => 'Confirmed',
            self::Resolved => 'Resolved',
            self::Rejected => 'Rejected',
            self::Merged => 'Merged',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Reported => 'yellow',
            self::Verified => 'indigo',
            self::Confirmed => 'blue',
            self::Resolved => 'green',
            self::Rejected => 'red',
            self::Merged => 'gray',
        };
    }

    /**
     * Reported → Verified (Purok President) → Confirmed (Admin) → Resolved.
     * Either official can reject before confirmation; duplicates can be
     * merged into another incident until the barangay confirms them.
     */
    public function canTransitionTo(self $next): bool
    {
        return match($this) {
            self::Reported => in_array($next, [self::Verified, self::Rejected, self::Merged], true),
            self::Verified => in_array($next, [self::Confirmed, self::Rejected, self::Merged], true),
            self::Confirmed => $next === self::Resolved,
            self::Resolved, self::Rejected, self::Merged => false,
        };
    }

    /** Statuses of incidents that still need attention (shown on the live map). */
    public static function active(): array
    {
        return [self::Reported->value, self::Verified->value, self::Confirmed->value];
    }
}
