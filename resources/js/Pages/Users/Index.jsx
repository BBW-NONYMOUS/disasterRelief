import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    purok_president: 'Purok President',
    resident: 'Resident',
    donor: 'Donor',
};

export default function UsersIndex({ users, roles }) {
    const { auth } = usePage().props;

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">User Management</h1>}>
            <Head title="Users" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{users.total} users</p>
                    <Link href="/users/create"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                        + Add User
                    </Link>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Barangay</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.data.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            {ROLE_LABELS[u.role] ?? u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{u.barangay?.name ?? '—'}</td>
                                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 justify-end">
                                            <Link href={`/users/${u.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                            {u.id !== auth?.user?.id && u.status === 'active' && (
                                                <button
                                                    onClick={() => { if (confirm('Deactivate this user?')) router.delete(`/users/${u.id}`); }}
                                                    className="text-red-600 hover:underline">
                                                    Deactivate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
