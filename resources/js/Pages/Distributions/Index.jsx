import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import Pagination from '@/Components/Pagination';
import useModuleAccess from '@/Hooks/useModuleAccess';

export default function DistributionsIndex({ distributions }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const { canManage } = useModuleAccess('distributions');

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Distributions</h1>}>
            <Head title="Distributions" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{distributions.total} distributions</p>
                    {canManage && ['admin', 'super_admin', 'purok_president'].includes(role) && (
                        <ModalLink href="/distributions/create" size="xl"
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
                            + New Distribution
                        </ModalLink>
                    )}
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {distributions.data.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No distributions yet.</div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {distributions.data.map(d => (
                                <div key={d.id} className="p-4 hover:bg-accent">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-foreground">{d.household?.head_name}</span>
                                                <StatusBadge status={d.status} />
                                            </div>
                                            <p className="text-sm text-muted-foreground">{d.items}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Purok: {d.household?.purok?.name ?? '—'} · By: {d.admin?.name}
                                                {d.distributed_at && ` · ${new Date(d.distributed_at).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Link href={`/distributions/${d.id}`} className="text-primary hover:underline text-sm">View</Link>
                                            {canManage && d.status === 'waiting' && (
                                                <button
                                                    onClick={() => router.patch(`/distributions/${d.id}/transition`, { status: 'ongoing' }, { preserveScroll: true })}
                                                    className="text-status-completed hover:underline text-sm">
                                                    Start
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Pagination paginator={distributions} />
            </div>
        </AppLayout>
    );
}
