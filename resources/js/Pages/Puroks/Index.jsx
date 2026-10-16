import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router } from '@inertiajs/react';

export default function PuroksIndex({ puroks = [], barangays = [], filters = {} }) {
    const filter = (barangayId) => router.get('/puroks', barangayId ? { barangay_id: barangayId } : {}, { preserveState: true });

    const destroy = (p) => {
        if (confirm(`Delete ${p.name}? This only works for a purok with no households, reports or residents.`)) {
            router.delete(`/puroks/${p.id}`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Puroks</h1>}>
            <Head title="Puroks" />

            <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="filter" className="text-sm text-muted-foreground">Barangay</label>
                        <select id="filter" value={filters.barangay_id ?? ''} onChange={e => filter(e.target.value)}
                            className="border-input rounded-md shadow-sm text-sm">
                            <option value="">All barangays</option>
                            {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <ModalLink href={`/puroks/create${filters.barangay_id ? `?barangay_id=${filters.barangay_id}` : ''}`}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
                        + Add Purok
                    </ModalLink>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium">Purok</th>
                                <th className="text-left px-4 py-3 font-medium">Barangay</th>
                                <th className="text-left px-4 py-3 font-medium">President</th>
                                <th className="text-right px-4 py-3 font-medium">Households</th>
                                <th className="text-right px-4 py-3 font-medium">Reports</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {puroks.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No puroks yet.</td></tr>
                            ) : puroks.map(p => (
                                <tr key={p.id} className="hover:bg-accent">
                                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.barangay?.name}</td>
                                    <td className="px-4 py-3">
                                        {p.president
                                            ? <span className="text-foreground">{p.president.name}</span>
                                            : <span className="text-status-ongoing">Unassigned</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">{p.households_count}</td>
                                    <td className="px-4 py-3 text-right">{p.disaster_reports_count}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-3 justify-end">
                                            <ModalLink href={`/puroks/${p.id}/edit`} className="text-primary hover:underline">Edit</ModalLink>
                                            <button onClick={() => destroy(p)} className="text-status-rejected hover:underline">Delete</button>
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
