import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function ShowDisasterReport({ report }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    const handleConfirm = () => {
        router.patch(`/disaster-reports/${report.id}`, { status: 'confirmed' });
    };

    const handleResolve = () => {
        router.patch(`/disaster-reports/${report.id}`, { status: 'resolved' });
    };

    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/disaster-reports" className="text-gray-500 hover:text-gray-700">Reports</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800">{report.type}</span>
            </div>
        }>
            <Head title={`Disaster Report: ${report.type}`} />

            <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{report.type}</h2>
                            <p className="text-sm text-gray-500 mt-1">Report #{report.id}</p>
                        </div>
                        <StatusBadge status={report.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <span className="text-gray-500">Affected Area</span>
                            <p className="font-medium text-gray-800">{report.affected_area}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Barangay</span>
                            <p className="font-medium text-gray-800">{report.barangay?.name ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Purok</span>
                            <p className="font-medium text-gray-800">{report.purok?.name ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Reported By</span>
                            <p className="font-medium text-gray-800">{report.reporter?.name}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Filed On</span>
                            <p className="font-medium text-gray-800">{new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                        {report.confirmed_at && (
                            <div>
                                <span className="text-gray-500">Confirmed On</span>
                                <p className="font-medium text-gray-800">{new Date(report.confirmed_at).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">{report.description}</p>
                    </div>

                    {/* Photos */}
                    {report.photos?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Photos</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {report.photos.map(photo => (
                                    <a key={photo.id} href={`/storage/${photo.path}`} target="_blank" rel="noopener">
                                        <img
                                            src={`/storage/${photo.path}`}
                                            className="h-36 w-full object-cover rounded-lg hover:opacity-90 transition"
                                            alt="Report photo"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin actions */}
                    {['admin', 'super_admin'].includes(role) && report.status !== 'resolved' && (
                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                            {report.status === 'reported' && (
                                <button onClick={handleConfirm}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                                    Confirm Report
                                </button>
                            )}
                            {report.status === 'confirmed' && (
                                <button onClick={handleResolve}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                                    Mark Resolved
                                </button>
                            )}
                            <Link href={`/disaster-reports/${report.id}/edit`}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                                Edit
                            </Link>
                        </div>
                    )}
                </div>

                {/* Assistance Requests */}
                {report.assistance_requests?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Assistance Requests ({report.assistance_requests.length})</h3>
                        <div className="space-y-3">
                            {report.assistance_requests.map(req => (
                                <div key={req.id} className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">{req.goods_needed}</p>
                                        <p className="text-xs text-gray-400">By {req.requester?.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <StatusBadge status={req.urgency} />
                                        <StatusBadge status={req.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
