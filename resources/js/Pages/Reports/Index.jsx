import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ReportsIndex({ reports, kinds = [] }) {
    const { data, setData, post, processing } = useForm({
        kind: 'incident',
        date_from: '',
        date_to: '',
    });

    const generate = (e) => {
        e.preventDefault();
        post('/reports/generate');
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Reports</h1>}>
            <Head title="Reports" />

            <div className="space-y-6">
                {/* Generate */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">Generate New Report</h2>
                    <form onSubmit={generate} className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                            <select value={data.kind} onChange={e => setData('kind', e.target.value)}
                                className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option value="incident">Disaster Incident</option>
                                <option value="received">Donation Received</option>
                                <option value="distribution">Distribution (with Signature)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                            <input type="date" value={data.date_from} onChange={e => setData('date_from', e.target.value)}
                                className="border-gray-300 rounded-md shadow-sm text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                            <input type="date" value={data.date_to} onChange={e => setData('date_to', e.target.value)}
                                className="border-gray-300 rounded-md shadow-sm text-sm" />
                        </div>
                        <button type="submit" disabled={processing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                            {processing ? 'Generating…' : 'Generate PDF'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-800">Generated Reports</h2>
                    </div>
                    {reports.data.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No reports generated yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {reports.data.map(r => (
                                <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                                    <div>
                                        <span className="font-medium text-gray-800 capitalize">{r.kind} Report</span>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {r.barangay?.name ?? 'All barangays'} · By {r.generated_by?.name} · {new Date(r.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <a href={`/reports/${r.id}/download`}
                                        className="text-blue-600 hover:underline text-sm font-medium">
                                        Download PDF
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
