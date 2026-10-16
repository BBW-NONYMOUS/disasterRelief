import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, usePage, router } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import StatusFilter from '@/Components/StatusFilter';
import Pagination from '@/Components/Pagination';
import useModuleAccess from '@/Hooks/useModuleAccess';

const STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Paid' },
    { value: 'delivered', label: 'Received' },
    { value: 'distributed', label: 'Distributed' },
];

export default function DonationsIndex({ donations, filters = {} }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const { canManage } = useModuleAccess('donations');

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Donations</h1>}>
            <Head title="Donations" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{donations.total} total donations</p>
                    {role === 'donor' && canManage && (
                        <ModalLink href="/donations/create" size="2xl"
                            className="bg-cta text-cta-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-cta/90">
                            + Make Donation
                        </ModalLink>
                    )}
                </div>

                <StatusFilter statuses={STATUSES} current={filters.status} path="/donations" />

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {donations.data.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No donations yet.</div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {donations.data.map(d => (
                                <div key={d.id} className="p-4 hover:bg-accent">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-foreground">
                                                    {d.type === 'cash' ? `₱${(d.amount_cents / 100).toFixed(2)}` : 'Goods'}
                                                </span>
                                                {d.type === 'cash' && <StatusBadge status={d.payment_status} />}
                                                <StatusBadge status={d.status} />
                                            </div>
                                            {d.items && <p className="text-sm text-muted-foreground">{d.items}</p>}
                                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                                <span>By: {d.donor?.name}</span>
                                                {d.barangay && <span>To: {d.barangay.name}</span>}
                                                <span>Delivery: {d.delivery_method}</span>
                                                {d.scheduled_at && <span>Scheduled: {new Date(d.scheduled_at).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        <Link href={`/donations/${d.id}`} className="text-primary hover:underline text-sm">View</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Pagination paginator={donations} />
            </div>
        </AppLayout>
    );
}
