import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function ShowDonation({ donation }) {
    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/donations" className="text-gray-500 hover:text-gray-700">Donations</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800">#{donation.id}</span>
            </div>
        }>
            <Head title={`Donation #${donation.id}`} />

            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Donation #{donation.id}</h2>
                        <div className="flex gap-2">
                            <StatusBadge status={donation.payment_status} />
                            <StatusBadge status={donation.status} />
                        </div>
                    </div>

                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Donor</dt>
                            <dd className="font-medium text-gray-800">{donation.donor?.name}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Type</dt>
                            <dd className="font-medium text-gray-800 capitalize">{donation.type}</dd>
                        </div>
                        {donation.type === 'cash' && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Amount</dt>
                                <dd className="font-bold text-green-700 text-base">₱{(donation.amount_cents / 100).toFixed(2)}</dd>
                            </div>
                        )}
                        {donation.items && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Items</dt>
                                <dd className="font-medium text-gray-800 max-w-xs text-right">{donation.items}</dd>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Delivery</dt>
                            <dd className="font-medium text-gray-800 capitalize">{donation.delivery_method}</dd>
                        </div>
                        {donation.scheduled_at && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Scheduled</dt>
                                <dd className="font-medium text-gray-800">{new Date(donation.scheduled_at).toLocaleString()}</dd>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Submitted</dt>
                            <dd className="font-medium text-gray-800">{new Date(donation.created_at).toLocaleDateString()}</dd>
                        </div>
                    </dl>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <Link href="/donations" className="text-blue-600 hover:underline text-sm">← Back to Donations</Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
