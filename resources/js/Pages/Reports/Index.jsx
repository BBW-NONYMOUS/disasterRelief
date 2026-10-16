import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import Pagination from '@/Components/Pagination';
import useModuleAccess from '@/Hooks/useModuleAccess';

const KIND_LABELS = {
    incident: 'Disaster Incident',
    received: 'Donation Received',
    distribution: 'Donation Distribution',
};

export default function ReportsIndex({ reports, barangays = [], signatory_defaults = {} }) {
    const { canManage } = useModuleAccess('reports');
    const { data, setData, post, processing, errors } = useForm({
        kind: 'incident',
        date_from: '',
        date_to: '',
        barangay_ids: [],
        prepared_by_name: signatory_defaults.prepared_by_name ?? '',
        prepared_by_position: signatory_defaults.prepared_by_position ?? '',
        noted_by_name: '',
        noted_by_position: 'Punong Barangay',
    });

    const toggleBarangay = (id) => {
        setData('barangay_ids', data.barangay_ids.includes(id)
            ? data.barangay_ids.filter(b => b !== id)
            : [...data.barangay_ids, id]);
    };

    const generate = (e) => {
        e.preventDefault();
        post('/reports/generate', { preserveScroll: true });
    };

    const inputClass = 'mt-1 block w-full border-input rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary';

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Reports</h1>}>
            <Head title="Reports" />

            <div className="space-y-6">
                {/* Generate */}
                {canManage && (
                <form onSubmit={generate} className="bg-card rounded-xl border border-border p-6 space-y-5">
                    <h2 className="font-semibold text-foreground">Generate New Report</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="kind" className="block text-sm font-medium text-foreground">Report Type</label>
                            <select id="kind" value={data.kind} onChange={e => setData('kind', e.target.value)} className={inputClass}>
                                <option value="incident">Disaster Incident</option>
                                <option value="received">Donation Received</option>
                                <option value="distribution">Distribution (with Signature)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="date_from" className="block text-sm font-medium text-foreground">Date From</label>
                            <input id="date_from" type="date" value={data.date_from} onChange={e => setData('date_from', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="date_to" className="block text-sm font-medium text-foreground">Date To</label>
                            <input id="date_to" type="date" value={data.date_to} onChange={e => setData('date_to', e.target.value)} className={inputClass} />
                            <InputError message={errors.date_to} />
                        </div>
                    </div>

                    {barangays.length > 0 && (
                        <fieldset>
                            <legend className="block text-sm font-medium text-foreground">Barangays</legend>
                            <p className="text-xs text-muted-foreground">Leave all unchecked for a consolidated report across every barangay. Multiple barangays get per-barangay subtotals.</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {barangays.map(b => (
                                    <label key={b.id} className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm cursor-pointer
                                        ${data.barangay_ids.includes(b.id) ? 'border-primary bg-primary/10' : 'border-border'}`}>
                                        <input type="checkbox" checked={data.barangay_ids.includes(b.id)} onChange={() => toggleBarangay(b.id)}
                                            className="rounded border-input text-primary" />
                                        {b.name}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.barangay_ids} />
                        </fieldset>
                    )}

                    <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <legend className="sr-only">Signatories</legend>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Prepared by</p>
                            <label className="sr-only" htmlFor="prepared_by_name">Prepared by — name</label>
                            <input id="prepared_by_name" value={data.prepared_by_name} onChange={e => setData('prepared_by_name', e.target.value)}
                                placeholder="Full name" className={inputClass} />
                            <label className="sr-only" htmlFor="prepared_by_position">Prepared by — position</label>
                            <input id="prepared_by_position" value={data.prepared_by_position} onChange={e => setData('prepared_by_position', e.target.value)}
                                placeholder="Position" className={inputClass} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Noted by</p>
                            <label className="sr-only" htmlFor="noted_by_name">Noted by — name</label>
                            <input id="noted_by_name" value={data.noted_by_name} onChange={e => setData('noted_by_name', e.target.value)}
                                placeholder="e.g. Hon. Juan Dela Cruz" className={inputClass} />
                            <label className="sr-only" htmlFor="noted_by_position">Noted by — position</label>
                            <input id="noted_by_position" value={data.noted_by_position} onChange={e => setData('noted_by_position', e.target.value)}
                                placeholder="Position" className={inputClass} />
                        </div>
                    </fieldset>

                    <button type="submit" disabled={processing}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
                        {processing ? 'Generating…' : 'Generate PDF'}
                    </button>
                </form>
                )}

                {/* List */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="font-semibold text-foreground">Generated Reports</h2>
                    </div>
                    {reports.data.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No reports generated yet.</div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {reports.data.map(r => (
                                <div key={r.id} className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-accent">
                                    <div>
                                        <span className="font-medium text-foreground">{KIND_LABELS[r.kind] ?? r.kind} Report</span>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {r.scope_label}
                                            {(r.meta?.date_from || r.meta?.date_to) && ` · ${r.meta.date_from ?? 'start'} to ${r.meta.date_to ?? 'present'}`}
                                            {' '}· By {r.generated_by?.name} · {new Date(r.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <a href={`/reports/${r.id}/download`}
                                        className="text-primary hover:underline text-sm font-medium shrink-0">
                                        Download PDF
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Pagination paginator={reports} />
            </div>
        </AppLayout>
    );
}
