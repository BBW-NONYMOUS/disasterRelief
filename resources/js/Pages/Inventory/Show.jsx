import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function ShowInventoryItem({ item }) {
    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">{item.name}</h1>}>
            <Head title={item.name} />
            <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 p-6">
                <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Category</dt><dd className="font-medium">{item.category}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium">{item.name}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Quantity</dt><dd className="font-medium">{item.quantity} {item.unit}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Expiry</dt><dd className="font-medium">{item.expiry_date ?? '—'}</dd></div>
                </dl>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <Link href={`/inventory/${item.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                    <Link href="/inventory" className="text-gray-500 hover:underline text-sm">← Back</Link>
                </div>
            </div>
        </AppLayout>
    );
}
