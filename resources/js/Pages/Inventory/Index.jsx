import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import useModuleAccess from '@/Hooks/useModuleAccess';

export default function InventoryIndex({ items, categories = [], low_stock_threshold = 10 }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const { canManage } = useModuleAccess('inventory');

    const handleDelete = (id) => {
        if (confirm('Remove this inventory item?')) {
            router.delete(`/inventory/${id}`);
        }
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Inventory</h1>}>
            <Head title="Inventory" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{items.total} items</p>
                    {canManage && (
                        <ModalLink href="/inventory/create"
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
                            + Add Item
                        </ModalLink>
                    )}
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                                {canManage && (
                                    <th className="px-4 py-3"></th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {items.data.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No inventory items.</td></tr>
                            ) : items.data.map(item => {
                                const isLow = item.quantity <= low_stock_threshold;
                                const isExpiring = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                return (
                                    <tr key={item.id} className="hover:bg-accent">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            <Link href={`/inventory/${item.id}`} className="hover:text-primary">{item.name}</Link>
                                            {role === 'super_admin' && item.barangay && <div className="text-xs text-muted-foreground font-normal">{item.barangay.name}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${isLow ? 'text-status-rejected' : 'text-foreground'}`}>
                                            {item.quantity}
                                            {isLow && <span className="ml-1 text-xs text-red-500">(Low)</span>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                                        <td className={`px-4 py-3 ${isExpiring ? 'text-status-ongoing font-medium' : 'text-muted-foreground'}`}>
                                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
                                            {isExpiring && <span className="ml-1 text-xs">(Expiring)</span>}
                                        </td>
                                        {canManage && (
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 justify-end">
                                                    <ModalLink href={`/inventory/${item.id}/edit`} className="text-primary hover:underline">Edit</ModalLink>
                                                    <button onClick={() => handleDelete(item.id)} className="text-status-rejected hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination paginator={items} />
            </div>
        </AppLayout>
    );
}
