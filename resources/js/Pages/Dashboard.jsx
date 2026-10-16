import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import DisasterMap from '@/Components/DisasterMap';
import useModuleAccess from '@/Hooks/useModuleAccess';

function StatCard({ label, value, color = 'blue' }) {
    const colors = {
        blue: 'bg-primary/10 text-primary border-primary/25',
        green: 'bg-status-completed/10 text-status-completed border-status-completed/30',
        yellow: 'bg-status-ongoing/10 text-status-ongoing border-status-ongoing/40',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        red: 'bg-status-rejected/10 text-status-rejected border-status-rejected/30',
    };
    return (
        <div className={`min-w-0 border rounded-xl p-5 ${colors[color]}`}>
            <div className="text-2xl sm:text-3xl font-bold break-words">{value ?? 0}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{label}</div>
        </div>
    );
}

function statColor(key) {
    if (key.includes('pending') || key.includes('waiting') || key.includes('to_verify') || key.includes('unverified') || key.includes('pledged')) return 'yellow';
    if (key.includes('open_requests')) return 'red';
    if (key.includes('total')) return 'blue';
    return 'green';
}

// Stat columns per card count, so every row is full: 6 → 3×2, 9 → 3×3, 8 → 4×2.
const STAT_COLUMNS = {
    1: '',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
    6: 'sm:grid-cols-3',
    8: 'sm:grid-cols-2 lg:grid-cols-4',
    9: 'sm:grid-cols-3',
};

/** One line of a dashboard list: text truncates, badges keep their size. */
function ListRow({ href, badges, children }) {
    const className = 'flex items-center justify-between gap-3 py-2.5 border-b border-border/60 last:border-0';
    const content = (
        <>
            <div className="min-w-0 flex-1 text-sm">{children}</div>
            <div className="flex shrink-0 gap-1.5">{badges}</div>
        </>
    );

    return href
        ? <Link href={href} className={`${className} hover:text-primary`}>{content}</Link>
        : <div className={className}>{content}</div>;
}

function ReportRow({ report }) {
    const meta = [report.reporter?.name, report.barangay?.name].filter(Boolean).join(' · ');

    return (
        <ListRow badges={<StatusBadge status={report.status} />}>
            <Link href={`/disaster-reports/${report.id}`} className="block truncate font-medium text-foreground hover:text-primary">
                {report.type} — {report.affected_area}
            </Link>
            {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
        </ListRow>
    );
}

function Panel({ title, href, linkLabel = 'View all →', children }) {
    return (
        <div className="flex min-w-0 flex-col bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-semibold text-foreground">{title}</h2>
                {href && <Link href={href} className="shrink-0 text-sm text-primary hover:underline">{linkLabel}</Link>}
            </div>
            {children}
        </div>
    );
}

const peso = (cents) => `₱${(cents / 100).toFixed(2)}`;

export default function Dashboard({
    stats = {}, recent_reports = [], my_reports = [], my_requests = [], my_donations = [], active_reports = [],
    recent_distributions = [], recent_donations = [], map_reports = [], map_barangay_ids = [], map_statuses = null,
    priority_requests = [], low_stock_items = [], low_stock_threshold = 10, open_needs = [],
}) {
    const { canManage: canDonate } = useModuleAccess('donations');
    const statEntries = Object.entries(stats);
    const reports = [...recent_reports, ...my_reports, ...active_reports];

    // Panels in the order each role acts on them, the report list last so it is the one that spans a
    // full row when the count is odd. Empty panels are left out so the grid stays balanced.
    const panels = [
        priority_requests.length > 0 && (
            <Panel key="priority" title="Priority Queue — Assistance Requests" href="/assistance-requests">
                <div>
                    {priority_requests.map(r => (
                        <ListRow key={r.id} href={`/assistance-requests/${r.id}`}
                            badges={<><StatusBadge status={r.priority ?? r.urgency} /><StatusBadge status={r.status} /></>}>
                            <p className="truncate">
                                <span className="font-medium capitalize">{r.type}</span> × {r.quantity}
                                <span className="text-xs text-muted-foreground ml-2">{r.purok?.name ?? r.barangay?.name}</span>
                            </p>
                        </ListRow>
                    ))}
                </div>
            </Panel>
        ),
        low_stock_items.length > 0 && (
            <Panel key="low-stock" title={`Low Stock (≤ ${low_stock_threshold})`} href="/inventory" linkLabel="Inventory →">
                <div>
                    {low_stock_items.map(item => (
                        <ListRow key={item.id} href={`/inventory/${item.id}`}
                            badges={
                                <span className={`text-sm font-medium ${item.quantity === 0 ? 'text-status-rejected' : 'text-status-ongoing'}`}>
                                    {item.quantity} {item.unit}
                                </span>
                            }>
                            <p className="truncate text-foreground">{item.name}</p>
                        </ListRow>
                    ))}
                </div>
            </Panel>
        ),
        open_needs.length > 0 && (
            <Panel key="needs" title="Current Needs" href="/assistance-requests" linkLabel="All needs →">
                <div className="flex-1">
                    {open_needs.map(n => (
                        <ListRow key={`${n.barangay_id}-${n.type}`} badges={<StatusBadge status={n.priority} />}>
                            <p className="truncate">
                                <span className="font-medium">{n.type_label}</span>{' '}
                                <span className="text-muted-foreground">· {n.barangay} · {n.total_quantity}</span>
                            </p>
                        </ListRow>
                    ))}
                </div>
                {canDonate && (
                    <ModalLink href="/donations/create" size="2xl" className="mt-4 self-start bg-cta text-cta-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-cta/90">
                        Donate now
                    </ModalLink>
                )}
            </Panel>
        ),
        my_requests.length > 0 && (
            <Panel key="my-requests" title="My Assistance Requests" href="/assistance-requests">
                <div>
                    {my_requests.map(r => (
                        <ListRow key={r.id} href={`/assistance-requests/${r.id}`} badges={<StatusBadge status={r.status} />}>
                            <p className="truncate text-foreground"><span className="capitalize">{r.type}</span> — {r.goods_needed}</p>
                        </ListRow>
                    ))}
                </div>
            </Panel>
        ),
        my_donations.length > 0 && (
            <Panel key="my-donations" title="My Donations" href="/donations">
                <div>
                    {my_donations.map(d => (
                        <ListRow key={d.id} href={`/donations/${d.id}`} badges={<StatusBadge status={d.status} />}>
                            <p className="truncate">
                                <span className="font-medium">{d.type === 'cash' ? peso(d.amount_cents) : d.items}</span>
                                <span className="text-muted-foreground ml-2">via {d.delivery_method}</span>
                            </p>
                        </ListRow>
                    ))}
                </div>
            </Panel>
        ),
        recent_donations.length > 0 && (
            <Panel key="recent-donations" title="Recent Donations" href="/donations">
                <div>
                    {recent_donations.map(d => (
                        <ListRow key={d.id} href={`/donations/${d.id}`} badges={<StatusBadge status={d.status} />}>
                            <p className="truncate">
                                <span className="font-medium">{d.type === 'cash' ? peso(d.amount_cents) : d.items}</span>
                                <span className="text-muted-foreground ml-2">{d.donor?.name}</span>
                            </p>
                        </ListRow>
                    ))}
                </div>
            </Panel>
        ),
        recent_distributions.length > 0 && (
            <Panel key="recent-distributions" title="Recent Distributions" href="/distributions">
                <div>
                    {recent_distributions.map(d => (
                        <ListRow key={d.id} href={`/distributions/${d.id}`} badges={<StatusBadge status={d.status} />}>
                            <p className="truncate">
                                <span className="font-medium">{d.household?.head_name}</span>
                                <span className="text-muted-foreground ml-2">{d.items}</span>
                            </p>
                        </ListRow>
                    ))}
                </div>
            </Panel>
        ),
        reports.length > 0 && (
            <Panel key="reports"
                title={recent_reports.length > 0 ? 'Recent Disaster Reports' : my_reports.length > 0 ? 'My Reports' : 'Active Disasters'}
                href="/disaster-reports">
                <div>
                    {reports.map(r => <ReportRow key={r.id} report={r} />)}
                </div>
            </Panel>
        ),
    ].filter(Boolean);

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Dashboard</h1>}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Stats: an odd last card spans the row on phones */}
                {statEntries.length > 0 && (
                    <div className={`grid gap-4 ${statEntries.length > 1 ? 'grid-cols-2 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1' : 'grid-cols-1'} ${STAT_COLUMNS[statEntries.length] ?? 'sm:grid-cols-3 lg:grid-cols-4'}`}>
                        {statEntries.map(([key, val]) => (
                            <StatCard
                                key={key}
                                label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                value={val}
                                color={statColor(key)}
                            />
                        ))}
                    </div>
                )}

                {/* Live situation map */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h2 className="font-semibold text-foreground">Live Disaster Map</h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive" /> Critical/High</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" /> Confirmed</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-status-verified" /> Verified</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-status-ongoing" /> Moderate</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-status-reported" /> Reported</span>
                        </div>
                    </div>
                    <DisasterMap reports={map_reports} barangayIds={map_barangay_ids} statuses={map_statuses} />
                    {map_reports.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">No pinned active disasters yet. New reports with a location will appear here live.</p>
                    )}
                </div>

                {/* Two panels per row on large screens; an odd last panel takes the full width */}
                {panels.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
                        {panels}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
