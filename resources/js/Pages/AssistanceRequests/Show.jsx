import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function ShowAssistanceRequest({ request }) {
    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/assistance-requests" className="text-gray-500 hover:text-gray-700">Requests</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800">#{request.id}</span>
            </div>
        }>
            <Head title={`Assistance Request #${request.id}`} />
            <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Request #{request.id}</h2>
                    <div className="flex gap-2">
                        <StatusBadge status={request.urgency} />
                        <StatusBadge status={request.status} />
                    </div>
                </div>
                <dl className="space-y-3 text-sm">
                    <div><dt className="text-gray-500">Requester</dt><dd className="font-medium">{request.requester?.name}</dd></div>
                    <div><dt className="text-gray-500">Goods Needed</dt><dd className="font-medium">{request.goods_needed}</dd></div>
                    {request.disaster_report && (
                        <div><dt className="text-gray-500">Related to</dt>
                            <dd><Link href={`/disaster-reports/${request.disaster_report.id}`} className="text-blue-600 hover:underline">
                                {request.disaster_report.type} — {request.disaster_report.affected_area}
                            </Link></dd>
                        </div>
                    )}
                    <div><dt className="text-gray-500">Filed</dt><dd className="font-medium">{new Date(request.created_at).toLocaleDateString()}</dd></div>
                </dl>
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link href="/assistance-requests" className="text-blue-600 hover:underline text-sm">← Back</Link>
                </div>
            </div>
        </AppLayout>
    );
}
