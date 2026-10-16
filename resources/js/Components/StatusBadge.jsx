import { Badge } from '@/Components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle2,
    CircleDashed,
    Clock,
    Merge,
    XCircle,
} from 'lucide-react';

/*
| relief.md §4 — one status vocabulary for the whole system.
| Every status maps to one of five token families, and the color is
| always paired with an icon + the status word (never color alone).
|
|   reported  (gray)  — new, unverified
|   verified  (blue)  — verified / confirmed / approved
|   ongoing   (amber) — waiting, prioritized, in progress
|   completed (green) — completed, distributed, paid
|   rejected  (red)   — rejected, failed, emergency severity
*/
const STATUS_VARIANTS = {
    reported: 'reported',
    pending: 'reported',
    normal: 'reported',
    refunded: 'reported',
    merged: 'reported',

    verified: 'verified',
    confirmed: 'verified',
    approved: 'verified',

    waiting: 'ongoing',
    ongoing: 'ongoing',
    moderate: 'ongoing',
    scheduled: 'ongoing',

    resolved: 'completed',
    completed: 'completed',
    paid: 'completed',
    active: 'completed',
    fulfilled: 'completed',
    delivered: 'completed',
    distributed: 'completed',
    low: 'completed',

    rejected: 'rejected',
    declined: 'rejected',
    failed: 'rejected',
    inactive: 'rejected',
    urgent: 'rejected',
    high: 'rejected',
    critical: 'rejected',
};

const VARIANT_ICONS = {
    reported: CircleDashed,
    verified: BadgeCheck,
    ongoing: Clock,
    completed: CheckCircle2,
    rejected: XCircle,
};

// Severities read as warnings, not process failures.
const STATUS_ICONS = {
    urgent: AlertTriangle,
    high: AlertTriangle,
    critical: AlertTriangle,
    merged: Merge,
};

const STATUS_LABELS = {
    delivered: 'Received',
    waiting: 'Waiting',
};

export default function StatusBadge({ status, label }) {
    const { t } = useTranslation();
    const variant = STATUS_VARIANTS[status] ?? 'reported';
    const Icon = STATUS_ICONS[status] ?? VARIANT_ICONS[variant];
    const displayLabel = label ?? STATUS_LABELS[status]
        ?? (status?.charAt(0).toUpperCase() + status?.slice(1).replace(/_/g, ' '));

    return (
        <Badge variant={variant}>
            <Icon aria-hidden="true" />
            {t(displayLabel)}
        </Badge>
    );
}
