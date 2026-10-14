import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

export default function ShowUser({ userRecord }) {
    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">User: {userRecord.name}</h1>}>
            <Head title={userRecord.name} />
            <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{userRecord.name}</h2>
                    <StatusBadge status={userRecord.status} />
                </div>
                <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium">{userRecord.email}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd className="font-medium capitalize">{userRecord.role?.replace(/_/g, ' ')}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium">{userRecord.phone ?? '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Barangay</dt><dd className="font-medium">{userRecord.barangay?.name ?? '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Purok</dt><dd className="font-medium">{userRecord.purok?.name ?? '—'}</dd></div>
                </dl>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <Link href={`/users/${userRecord.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                    <Link href="/users" className="text-gray-500 hover:underline text-sm">← Back</Link>
                </div>
            </div>
        </AppLayout>
    );
}
