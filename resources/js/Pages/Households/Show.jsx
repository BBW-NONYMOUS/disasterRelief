import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function ShowHousehold({ household }) {
    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/households" className="text-gray-500 hover:text-gray-700">Households</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800">{household.head_name}</span>
            </div>
        }>
            <Head title={household.head_name} />

            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{household.head_name}</h2>
                            <p className="text-sm text-gray-500">{household.address}</p>
                        </div>
                        <div className="flex gap-2">
                            {household.priority_flag && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">⚡ Priority</span>}
                            <StatusBadge status={household.status} />
                        </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">Members</dt>
                            <dd className="font-medium text-gray-800">{household.members_count}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Purok</dt>
                            <dd className="font-medium text-gray-800">{household.purok?.name}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Barangay</dt>
                            <dd className="font-medium text-gray-800">{household.purok?.barangay?.name}</dd>
                        </div>
                    </dl>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <Link href={`/households/${household.id}/edit`}
                            className="text-blue-600 hover:underline text-sm">Edit Household</Link>
                    </div>
                </div>

                {household.distributions?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-800 mb-3">Distribution History</h3>
                        {household.distributions.map(d => (
                            <div key={d.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                                <span>{d.items}</span>
                                <StatusBadge status={d.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
