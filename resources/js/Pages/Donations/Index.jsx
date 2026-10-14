import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function DonationsIndex({ donations }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Donations</h1>}>
            <Head title="Donations" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{donations.total} total donations</p>
                    {role === 'donor' && (
                        <Link href="/donations/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            + Make Donation
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {donations.data.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No donations yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {donations.data.map(d => (
                                <div key={d.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-800">
                                                    {d.type === 'cash' ? `₱${(d.amount_cents / 100).toFixed(2)}` : 'Goods'}
                                                </span>
                                                <StatusBadge status={d.payment_status} />
                                                <StatusBadge status={d.status} />
                                            </div>
                                            {d.items && <p className="text-sm text-gray-600">{d.items}</p>}
                                            <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                                <span>By: {d.donor?.name}</span>
                                                <span>Delivery: {d.delivery_method}</span>
                                                {d.scheduled_at && <span>Scheduled: {new Date(d.scheduled_at).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        <Link href={`/donations/${d.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {donations.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {donations.links.map((link, i) => (
                            <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                                className={`px-3 py-1.5 rounded text-sm ${link.active ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50 disabled:opacity-40'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
