import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import { usePage } from '@inertiajs/react';

export default function DisasterReportsIndex({ reports }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const canCreate = ['resident', 'purok_president'].includes(role);

    const handleDelete = (id) => {
        if (confirm('Delete this report?')) {
            router.delete(`/disaster-reports/${id}`);
        }
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Disaster Reports</h1>}>
            <Head title="Disaster Reports" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{reports.total} total reports</p>
                    {canCreate && (
                        <Link href="/disaster-reports/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            + New Report
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {reports.data.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No reports found.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {reports.data.map(report => (
                                <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-800">{report.type}</span>
                                                <StatusBadge status={report.status} />
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                                                <span>📍 {report.affected_area}</span>
                                                {report.barangay && <span>🏘 {report.barangay.name}</span>}
                                                {report.purok && <span>Purok: {report.purok.name}</span>}
                                                <span>By: {report.reporter?.name}</span>
                                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Link href={`/disaster-reports/${report.id}`}
                                                className="text-blue-600 hover:underline text-sm">View</Link>
                                            {(role === 'admin' || role === 'super_admin' || report.reporter_id === auth.user?.id) && (
                                                <Link href={`/disaster-reports/${report.id}/edit`}
                                                    className="text-gray-600 hover:underline text-sm">Edit</Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {reports.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {reports.links.map((link, i) => (
                            <button key={i}
                                onClick={() => link.url && router.get(link.url)}
                                disabled={!link.url}
                                className={`px-3 py-1.5 rounded text-sm ${link.active ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50 disabled:opacity-40'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
