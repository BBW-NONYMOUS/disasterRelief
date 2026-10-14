import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function HouseholdsIndex({ households }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Households</h1>}>
            <Head title="Households" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{households.total} households</p>
                    {['admin', 'super_admin', 'purok_president'].includes(role) && (
                        <Link href="/households/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            + Add Household
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {households.data.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No households registered.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {households.data.map(h => (
                                <div key={h.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800">{h.head_name}</span>
                                                {h.priority_flag && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                                        ⚡ Priority
                                                    </span>
                                                )}
                                                <StatusBadge status={h.status} />
                                            </div>
                                            <p className="text-sm text-gray-500 mt-0.5">{h.address}</p>
                                            <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                                <span>Members: {h.members_count}</span>
                                                <span>Purok: {h.purok?.name ?? '—'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/households/${h.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                                            {['admin', 'super_admin', 'purok_president'].includes(role) && (
                                                <Link href={`/households/${h.id}/edit`} className="text-gray-600 hover:underline text-sm">Edit</Link>
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
