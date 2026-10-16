import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import Pagination from '@/Components/Pagination';
import VerifiedBadge, { HOUSEHOLD_STATUS_LABELS } from '@/Components/VerifiedBadge';
import useModuleAccess from '@/Hooks/useModuleAccess';

export default function HouseholdsIndex({ households }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const purokId = auth?.user?.purok_id;
    const { canManage } = useModuleAccess('households');

    const verify = (h) => {
        if (confirm(`Confirm that you have checked ${h.head_name}'s household on the ground?`)) {
            router.post(`/households/${h.id}/verify`, {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Households</h1>}>
            <Head title="Households" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{households.total} households</p>
                    {canManage && ['admin', 'super_admin', 'purok_president'].includes(role) && (
                        <ModalLink href="/households/create"
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
                            + Add Household
                        </ModalLink>
                    )}
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {households.data.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No households registered.</div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {households.data.map(h => (
                                <div key={h.id} className="p-4 hover:bg-accent">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-foreground">{h.head_name}</span>
                                                {h.priority_flag && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                                        ⚡ Priority
                                                    </span>
                                                )}
                                                <StatusBadge status={h.status} label={HOUSEHOLD_STATUS_LABELS[h.status]} />
                                                <VerifiedBadge household={h} />
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">{h.address}</p>
                                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                                <span>Members: {h.members_count}</span>
                                                <span>Purok: {h.purok?.name ?? '—'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center shrink-0">
                                            {canManage && role === 'purok_president' && !h.verified_at && h.purok_id === purokId && (
                                                <button onClick={() => verify(h)}
                                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                                                    Verify
                                                </button>
                                            )}
                                            <Link href={`/households/${h.id}`} className="text-primary hover:underline text-sm">View</Link>
                                            {canManage && <ModalLink href={`/households/${h.id}/edit`} className="text-muted-foreground hover:underline text-sm">Edit</ModalLink>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Pagination paginator={households} />
            </div>
        </AppLayout>
    );
}
