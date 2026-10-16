<?php

namespace App\Enums;

enum AssistanceRequestStatus: string
{
    case Pending = 'pending';
    case Verified = 'verified';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Fulfilled = 'fulfilled';

    public function label(): string
    {
        return match($this) {
            self::Pending => 'Pending',
            self::Verified => 'Verified',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Fulfilled => 'Fulfilled',
        };
    }

    /**
     * Pending → Verified (Purok President tags priority) → Approved (Admin
     * finalises priority) → Fulfilled. Rejection is possible until approval.
     */
    public function canTransitionTo(self $next): bool
    {
        return match($this) {
            self::Pending => in_array($next, [self::Verified, self::Rejected], true),
            self::Verified => in_array($next, [self::Approved, self::Rejected], true),
            self::Approved => $next === self::Fulfilled,
            self::Rejected, self::Fulfilled => false,
        };
    }

    /** Statuses that still sit in someone's queue. */
    public static function open(): array
    {
        return [self::Pending->value, self::Verified->value, self::Approved->value];
    }
}
