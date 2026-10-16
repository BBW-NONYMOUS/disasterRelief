import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';

const GOODS_STEPS = [['pending', 'Pledged'], ['delivered', 'Received'], ['distributed', 'Distributed']];
const CASH_STEPS = [['pending', 'Pledged'], ['confirmed', 'Paid'], ['distributed', 'Distributed']];

function Progress({ type, status }) {
    const steps = type === 'goods' ? GOODS_STEPS : CASH_STEPS;
    const normalized = type === 'goods' && status === 'confirmed' ? 'pending' : status;
    const current = steps.findIndex(([s]) => s === normalized);
    return (
        <ol className="flex items-center gap-1 text-xs" aria-label="Donation progress">
            {steps.map(([s, label], i) => (
                <li key={s} className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded-full font-medium
                        ${i < current ? 'bg-green-100 text-status-completed' : i === current ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                        aria-current={i === current ? 'step' : undefined}>
                        {label}
                    </span>
                    {i < steps.length - 1 && <span className="text-muted-foreground" aria-hidden="true">→</span>}
                </li>
            ))}
        </ol>
    );
}

function ReceiveForm({ donation, items }) {
    const { data, setData, post, processing, errors } = useForm({
        items: Object.fromEntries(items.map(i => [i.id, { received_quantity: i.quantity, expiry_date: '' }])),
    });

    const set = (id, field, value) => setData('items', { ...data.items, [id]: { ...data.items[id], [field]: value } });

    return (
        <form onSubmit={e => { e.preventDefault(); post(`/donations/${donation.id}/receive`, { preserveScroll: true }); }}
            className="bg-card rounded-xl border border-teal-200 p-6 space-y-4">
            <div>
                <h3 className="font-semibold text-foreground">Receive goods into inventory</h3>
                <p className="text-sm text-muted-foreground">Enter what actually arrived. Each item is added to {donation.barangay?.name ?? 'your barangay'}'s inventory.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-muted-foreground">
                        <tr>
                            <th className="text-left py-2 font-medium">Item</th>
                            <th className="text-right py-2 font-medium">Pledged</th>
                            <th className="text-left py-2 pl-3 font-medium">Received</th>
                            <th className="text-left py-2 pl-3 font-medium">Expiry (optional)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="py-2">{item.name} <span className="text-muted-foreground">({item.category})</span></td>
                                <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                                <td className="py-2 pl-3">
                                    <label className="sr-only" htmlFor={`recv-${item.id}`}>Received quantity of {item.name}</label>
                                    <input id={`recv-${item.id}`} type="number" min="0" value={data.items[item.id].received_quantity}
                                        onChange={e => set(item.id, 'received_quantity', e.target.value)}
                                        className="w-24 border-input rounded-md shadow-sm text-sm" />
                                    {errors[`items.${item.id}.received_quantity`] && <p className="text-xs text-status-rejected">{errors[`items.${item.id}.received_quantity`]}</p>}
                                </td>
                                <td className="py-2 pl-3">
                                    <label className="sr-only" htmlFor={`exp-${item.id}`}>Expiry date of {item.name}</label>
                                    <input id={`exp-${item.id}`} type="date" value={data.items[item.id].expiry_date}
                                        onChange={e => set(item.id, 'expiry_date', e.target.value)}
                                        className="border-input rounded-md shadow-sm text-sm" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button type="submit" disabled={processing}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50">
                {processing ? 'Saving…' : 'Confirm Receipt & Add to Inventory'}
            </button>
        </form>
    );
}

export default function ShowDonation({ donation, donation_items = [], can = {} }) {
    const isGoods = donation.type === 'goods';
    const allocations = donation_items.flatMap(item => item.allocations.map(a => ({ ...a, item })));

    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/donations" className="text-muted-foreground hover:text-foreground">Donations</Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground">#{donation.id}</span>
            </div>
        }>
            <Head title={`Donation #${donation.id}`} />

            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">Donation #{donation.id}</h2>
                        <div className="flex gap-2">
                            {!isGoods && <StatusBadge status={donation.payment_status} />}
                            <StatusBadge status={donation.status} />
                        </div>
                    </div>

                    <div className="mb-5 overflow-x-auto"><Progress type={donation.type} status={donation.status} /></div>

                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Donor</dt><dd className="font-medium text-foreground">{donation.donor?.name}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Barangay</dt><dd className="font-medium text-foreground">{donation.barangay?.name ?? '—'}</dd></div>
                        {donation.disaster_report && (
                            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Incident</dt>
                                <dd className="font-medium text-right">
                                    <Link href={`/disaster-reports/${donation.disaster_report.id}`} className="text-primary hover:underline capitalize">
                                        {donation.disaster_report.type} — {donation.disaster_report.affected_area}
                                    </Link>
                                </dd>
                            </div>
                        )}
                        <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd className="font-medium text-foreground capitalize">{donation.type}</dd></div>
                        {!isGoods && (
                            <div className="flex justify-between"><dt className="text-muted-foreground">Amount</dt><dd className="font-bold text-status-completed text-base">₱{(donation.amount_cents / 100).toFixed(2)}</dd></div>
                        )}
                        {isGoods && donation_items.length === 0 && donation.items && (
                            <div className="flex justify-between"><dt className="text-muted-foreground">Items</dt><dd className="font-medium text-foreground max-w-xs text-right">{donation.items}</dd></div>
                        )}
                        <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="font-medium text-foreground capitalize">{donation.delivery_method}</dd></div>
                        {donation.scheduled_at && (
                            <div className="flex justify-between"><dt className="text-muted-foreground">Scheduled</dt><dd className="font-medium text-foreground">{new Date(donation.scheduled_at).toLocaleString()}</dd></div>
                        )}
                        <div className="flex justify-between"><dt className="text-muted-foreground">Submitted</dt><dd className="font-medium text-foreground">{new Date(donation.created_at).toLocaleDateString()}</dd></div>
                        {donation.received_at && (
                            <div className="flex justify-between"><dt className="text-muted-foreground">Received</dt><dd className="font-medium text-foreground">{new Date(donation.received_at).toLocaleDateString()}{donation.receiver ? ` by ${donation.receiver.name}` : ''}</dd></div>
                        )}
                        {donation.distributed_at && (
                            <div className="flex justify-between"><dt className="text-muted-foreground">Fully distributed</dt><dd className="font-medium text-foreground">{new Date(donation.distributed_at).toLocaleDateString()}</dd></div>
                        )}
                    </dl>

                    {(can.mark_distributed || can.delete) && (
                        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border/60">
                            {can.mark_distributed && (
                                <button onClick={() => { if (confirm('Mark this cash donation as used for distribution?')) router.post(`/donations/${donation.id}/mark-distributed`); }}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                                    Mark as Distributed
                                </button>
                            )}
                            {can.delete && (
                                <button onClick={() => { if (confirm('Withdraw this pledge?')) router.delete(`/donations/${donation.id}`); }}
                                    className="border border-red-300 text-status-rejected px-4 py-2 rounded-lg text-sm hover:bg-status-rejected/10">
                                    Withdraw Pledge
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {isGoods && donation_items.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-3">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-muted-foreground">
                                    <tr>
                                        <th className="text-left py-2 font-medium">Item</th>
                                        <th className="text-right py-2 font-medium">Pledged</th>
                                        <th className="text-right py-2 font-medium">Received</th>
                                        <th className="text-right py-2 font-medium">Distributed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {donation_items.map(item => (
                                        <tr key={item.id}>
                                            <td className="py-2">{item.name} <span className="text-muted-foreground">({item.category})</span></td>
                                            <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                                            <td className="py-2 text-right">{item.received_quantity ?? '—'}</td>
                                            <td className="py-2 text-right">{item.received_quantity != null ? `${item.distributed_quantity} / ${item.received_quantity}` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {can.receive && <ReceiveForm donation={donation} items={donation_items} />}

                {allocations.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-1">Where your goods went</h3>
                        <p className="text-xs text-muted-foreground mb-3">Each line is a signed hand-over to an affected household.</p>
                        <ul className="divide-y divide-border/60 text-sm">
                            {allocations.map(a => (
                                <li key={a.id} className="py-2 flex justify-between gap-3">
                                    <span>
                                        {a.quantity} {a.item.unit} {a.item.name}
                                        <span className="text-muted-foreground"> → {a.household ?? 'a household'}{a.purok ? ` in ${a.purok}` : ''}</span>
                                    </span>
                                    <span className="text-muted-foreground shrink-0">
                                        {a.distribution_id
                                            ? <Link href={`/distributions/${a.distribution_id}`} className="text-primary hover:underline">{a.distributed_at ? new Date(a.distributed_at).toLocaleDateString() : 'View'}</Link>
                                            : (a.distributed_at ? new Date(a.distributed_at).toLocaleDateString() : '')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Link href="/donations" className="inline-block text-primary hover:underline text-sm">← Back to Donations</Link>
            </div>
        </AppLayout>
    );
}
