import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function InventoryIndex({ items, categories = [] }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;

    const handleDelete = (id) => {
        if (confirm('Remove this inventory item?')) {
            router.delete(`/inventory/${id}`);
        }
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Inventory</h1>}>
            <Head title="Inventory" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{items.total} items</p>
                    {['admin', 'super_admin'].includes(role) && (
                        <Link href="/inventory/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            + Add Item
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Quantity</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Expiry</th>
                                {['admin', 'super_admin'].includes(role) && (
                                    <th className="px-4 py-3"></th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.data.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-400">No inventory items.</td></tr>
                            ) : items.data.map(item => {
                                const isLow = item.quantity <= 10;
                                const isExpiring = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.category}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                                            {item.quantity}
                                            {isLow && <span className="ml-1 text-xs text-red-500">(Low)</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                                        <td className={`px-4 py-3 ${isExpiring ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
                                            {isExpiring && <span className="ml-1 text-xs">(Expiring)</span>}
                                        </td>
                                        {['admin', 'super_admin'].includes(role) && (
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 justify-end">
                                                    <Link href={`/inventory/${item.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
