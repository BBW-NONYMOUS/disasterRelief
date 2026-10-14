import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function DistributionsIndex({ distributions }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Distributions</h1>}>
            <Head title="Distributions" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{distributions.total} distributions</p>
                    {['admin', 'super_admin'].includes(role) && (
                        <Link href="/distributions/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            + New Distribution
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {distributions.data.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No distributions yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {distributions.data.map(d => (
                                <div key={d.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-800">{d.household?.head_name}</span>
                                                <StatusBadge status={d.status} />
                                            </div>
                                            <p className="text-sm text-gray-600">{d.items} × {d.quantity}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Purok: {d.household?.purok?.name ?? '—'} · By: {d.admin?.name}
                                                {d.distributed_at && ` · ${new Date(d.distributed_at).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Link href={`/distributions/${d.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                                            {['admin', 'super_admin'].includes(role) && d.status !== 'completed' && (
                                                <button
                                                    onClick={() => router.patch(`/distributions/${d.id}/transition`, {
                                                        status: d.status === 'waiting' ? 'ongoing' : 'completed'
                                                    })}
                                                    className="text-green-600 hover:underline text-sm">
                                                    {d.status === 'waiting' ? 'Start' : 'Complete'}
                                                </button>
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
