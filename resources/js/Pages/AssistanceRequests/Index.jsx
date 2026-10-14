import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function AssistanceRequestsIndex({ requests }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Assistance Requests</h1>}>
            <Head title="Assistance Requests" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{requests.total} requests</p>
                    {role === 'resident' && (
                        <Link href="/assistance-requests/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            + New Request
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {requests.data.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No assistance requests.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {requests.data.map(req => (
                                <div key={req.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 line-clamp-2">{req.goods_needed}</p>
                                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                                <span>By: {req.requester?.name}</span>
                                                {req.disaster_report && <span>Re: {req.disaster_report.type}</span>}
                                                <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center shrink-0">
                                            <StatusBadge status={req.urgency} />
                                            <StatusBadge status={req.status} />
                                            {['admin', 'super_admin', 'purok_president'].includes(role) && req.status === 'pending' && (
                                                <div className="flex gap-1">
                                                    <button onClick={() => router.patch(`/assistance-requests/${req.id}`, { status: 'approved' })}
                                                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                                                        Approve
                                                    </button>
                                                    <button onClick={() => router.patch(`/assistance-requests/${req.id}`, { status: 'rejected' })}
                                                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
