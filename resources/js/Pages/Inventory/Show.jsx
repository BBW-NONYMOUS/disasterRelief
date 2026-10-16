import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link } from '@inertiajs/react';
import useModuleAccess from '@/Hooks/useModuleAccess';

const REASONS = {
    opening_balance: 'Opening balance',
    manual_entry: 'Manual stock-in',
    adjustment: 'Count correction',
    donation_received: 'Donation received',
    distribution: 'Distributed',
    distribution_cancelled: 'Distribution cancelled',
};

const SOURCE_LINKS = {
    'App\\Models\\Donation': id => ({ href: `/donations/${id}`, label: `Donation #${id}` }),
    'App\\Models\\Distribution': id => ({ href: `/distributions/${id}`, label: `Distribution #${id}` }),
};

export default function ShowInventoryItem({ item, movements = [] }) {
    const { canManage } = useModuleAccess('inventory');
    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/inventory" className="text-muted-foreground hover:text-foreground">Inventory</Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground">{item.name}</span>
            </div>
        }>
            <Head title={item.name} />
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-card rounded-xl border border-border p-6">
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{item.category}</dd></div>
                        <div><dt className="text-muted-foreground">On hand</dt><dd className="font-bold text-lg">{item.quantity} {item.unit}</dd></div>
                        <div><dt className="text-muted-foreground">Earliest expiry</dt><dd className="font-medium">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}</dd></div>
                        <div><dt className="text-muted-foreground">Barangay</dt><dd className="font-medium">{item.barangay?.name ?? '—'}</dd></div>
                    </dl>
                    <div className="mt-4 pt-4 border-t border-border/60 flex gap-3">
                        {canManage && <ModalLink href={`/inventory/${item.id}/edit`} className="text-primary hover:underline text-sm">Edit / Correct count</ModalLink>}
                        <Link href="/inventory" className="text-muted-foreground hover:underline text-sm">← Back</Link>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border/60">
                        <h2 className="font-semibold text-foreground">Stock ledger</h2>
                        <p className="text-xs text-muted-foreground">Every stock-in and stock-out, newest first.</p>
                    </div>
                    {movements.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">No movements recorded.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-medium">When</th>
                                        <th className="text-left px-4 py-2 font-medium">Reason</th>
                                        <th className="text-right px-4 py-2 font-medium">Change</th>
                                        <th className="text-right px-4 py-2 font-medium">Balance</th>
                                        <th className="text-left px-4 py-2 font-medium">By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {movements.map(m => {
                                        const source = m.source_type && SOURCE_LINKS[m.source_type]?.(m.source_id);
                                        return (
                                            <tr key={m.id}>
                                                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</td>
                                                <td className="px-4 py-2">
                                                    {REASONS[m.reason] ?? m.reason}
                                                    {source && <> · <Link href={source.href} className="text-primary hover:underline">{source.label}</Link></>}
                                                    {m.note && <div className="text-xs text-muted-foreground">{m.note}</div>}
                                                </td>
                                                <td className={`px-4 py-2 text-right font-medium ${m.direction === 'in' ? 'text-status-completed' : 'text-status-rejected'}`}>
                                                    {m.direction === 'in' ? '+' : '−'}{m.quantity}
                                                </td>
                                                <td className="px-4 py-2 text-right">{m.balance_after}</td>
                                                <td className="px-4 py-2 text-muted-foreground">{m.user?.name ?? 'System'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
