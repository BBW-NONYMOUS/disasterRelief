import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import StatusFilter from '@/Components/StatusFilter';
import Pagination from '@/Components/Pagination';
import { usePage } from '@inertiajs/react';
import useModuleAccess from '@/Hooks/useModuleAccess';

const STATUSES = [
    { value: 'reported', label: 'Reported' },
    { value: 'verified', label: 'Verified' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

export default function DisasterReportsIndex({ reports, filters = {} }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const { canManage } = useModuleAccess('disaster_reports');
    const canCreate = canManage && ['resident', 'purok_president'].includes(role);

    const handleDelete = (id) => {
        if (confirm('Delete this report?')) {
            router.delete(`/disaster-reports/${id}`);
        }
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Disaster Reports</h1>}>
            <Head title="Disaster Reports" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{reports.total} total reports</p>
                    {canCreate && (
                        <ModalLink href="/disaster-reports/create" size="2xl"
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                            + New Report
                        </ModalLink>
                    )}
                </div>

                {role !== 'donor' && <StatusFilter statuses={STATUSES} current={filters.status} path="/disaster-reports" />}

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {reports.data.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No reports found.</div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {reports.data.map(report => (
                                <div key={report.id} className="p-4 hover:bg-accent transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-foreground">{report.type}</span>
                                                <StatusBadge status={report.status} />
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                                <span>📍 {report.affected_area}</span>
                                                {report.barangay && <span>🏘 {report.barangay.name}</span>}
                                                {report.purok && <span>Purok: {report.purok.name}</span>}
                                                <span>By: {report.reporter?.name}</span>
                                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Link href={`/disaster-reports/${report.id}`}
                                                className="text-primary hover:underline text-sm">View</Link>
                                            {canManage && ((role === 'admin' || role === 'super_admin') || (report.reporter_id === auth.user?.id && report.status === 'reported')) && (
                                                <ModalLink href={`/disaster-reports/${report.id}/edit`} size="2xl"
                                                    className="text-muted-foreground hover:underline text-sm">Edit</ModalLink>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Pagination paginator={reports} />
            </div>
        </AppLayout>
    );
}
