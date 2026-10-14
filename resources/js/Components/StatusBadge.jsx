const STATUS_COLORS = {
    reported: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    ongoing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-gray-100 text-gray-700',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    normal: 'bg-gray-100 text-gray-700',
    urgent: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    fulfilled: 'bg-green-100 text-green-800',
};

export default function StatusBadge({ status, label }) {
    const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
    const displayLabel = label ?? status?.charAt(0).toUpperCase() + status?.slice(1).replace(/_/g, ' ');

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {displayLabel}
        </span>
    );
}
