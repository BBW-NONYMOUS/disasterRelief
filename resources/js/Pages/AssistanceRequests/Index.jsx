import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import StatusFilter from '@/Components/StatusFilter';
import Pagination from '@/Components/Pagination';
import useModuleAccess from '@/Hooks/useModuleAccess';

const STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'approved', label: 'Approved' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'rejected', label: 'Rejected' },
];

function age(iso) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
}

function DonorNeeds({ needs, requests }) {
    const { canManage: canDonate } = useModuleAccess('donations');
    return (
        <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/25 rounded-xl p-4 text-sm text-primary-dark">
                These are needs approved by barangay officials. Household details are kept private.
                {canDonate && <ModalLink href="/donations/create" size="2xl" className="ml-2 font-semibold underline">Donate now →</ModalLink>}
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60 font-semibold text-foreground">Current needs by barangay</div>
                {needs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No open needs right now.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium">Barangay</th>
                                    <th className="text-left px-4 py-2 font-medium">Need</th>
                                    <th className="text-right px-4 py-2 font-medium">People / units</th>
                                    <th className="text-right px-4 py-2 font-medium">Requests</th>
                                    <th className="text-left px-4 py-2 font-medium">Top priority</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {needs.map(n => (
                                    <tr key={`${n.barangay_id}-${n.type}`}>
                                        <td className="px-4 py-2 text-foreground">{n.barangay}</td>
                                        <td className="px-4 py-2 font-medium text-foreground">{n.type_label}</td>
                                        <td className="px-4 py-2 text-right">{n.total_quantity}</td>
                                        <td className="px-4 py-2 text-right">{n.requests}</td>
                                        <td className="px-4 py-2"><StatusBadge status={n.priority} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60 font-semibold text-foreground">Approved requests</div>
                <div className="divide-y divide-border/60">
                    {requests.data.map(r => (
                        <Link key={r.id} href={`/assistance-requests/${r.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-accent">
                            <div>
                                <p className="text-sm font-medium text-foreground">{r.type_label} × {r.quantity}</p>
                                <p className="text-xs text-muted-foreground">{r.barangay?.name}{r.purok ? ` · ${r.purok.name}` : ''}{r.disaster_report ? ` · ${r.disaster_report.type}` : ''}</p>
                            </div>
                            {r.priority && <StatusBadge status={r.priority} />}
                        </Link>
                    ))}
                    {requests.data.length === 0 && <div className="text-center py-8 text-muted-foreground">No approved requests.</div>}
                </div>
            </div>
            <Pagination paginator={requests} />
        </div>
    );
}

export default function AssistanceRequestsIndex({ requests, needs = null, filters = {} }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const { canManage } = useModuleAccess('assistance_requests');
    const isOfficial = ['admin', 'super_admin', 'purok_president'].includes(role);

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">{role === 'donor' ? 'Open Needs' : 'Assistance Requests'}</h1>}>
            <Head title="Assistance Requests" />

            {role === 'donor' ? <DonorNeeds needs={needs ?? []} requests={requests} /> : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center gap-3">
                        <p className="text-sm text-muted-foreground">
                            {requests.total} requests{isOfficial && ' · sorted by priority, then oldest first'}
                        </p>
                        {role === 'resident' && canManage && (
                            <ModalLink href="/assistance-requests/create"
                                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark shrink-0">
                                + New Request
                            </ModalLink>
                        )}
                    </div>

                    {isOfficial && <StatusFilter statuses={STATUSES} current={filters.status} path="/assistance-requests" />}

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {requests.data.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">No assistance requests.</div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {requests.data.map(req => (
                                    <Link key={req.id} href={`/assistance-requests/${req.id}`} className="block p-4 hover:bg-accent">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground">
                                                    <span className="capitalize">{req.type}</span> × {req.quantity}
                                                </p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{req.goods_needed}</p>
                                                <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-muted-foreground">
                                                    {role !== 'resident' && <span>By: {req.requester?.name}</span>}
                                                    {req.purok && <span>Purok: {req.purok.name}</span>}
                                                    {req.household && <span>Household: {req.household.head_name}</span>}
                                                    {req.disaster_report && <span>Re: {req.disaster_report.type}</span>}
                                                    <span>{age(req.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-1.5 items-end sm:items-center shrink-0">
                                                {req.priority
                                                    ? <StatusBadge status={req.priority} label={`${req.priority} priority`} />
                                                    : <StatusBadge status={req.urgency} />}
                                                <StatusBadge status={req.status} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Pagination paginator={requests} />
                </div>
            )}
        </AppLayout>
    );
}
