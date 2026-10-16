import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';

const EVENT_COLORS = {
    created: 'bg-green-100 text-status-completed',
    updated: 'bg-primary/15 text-primary-dark',
    deleted: 'bg-red-100 text-status-rejected',
};

function format(value) {
    if (value === null || value === undefined || value === '') return '∅';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function Changes({ properties }) {
    const attributes = properties?.attributes ?? {};
    const old = properties?.old ?? {};
    const keys = Object.keys(attributes).length ? Object.keys(attributes) : Object.keys(old);

    return (
        <ul className="text-xs text-muted-foreground space-y-0.5">
            {keys.slice(0, 8).map(key => (
                <li key={key} className="break-all">
                    <span className="font-medium text-foreground">{key}</span>:{' '}
                    {key in old && key in attributes
                        ? <><span className="line-through text-muted-foreground">{format(old[key])}</span> → {format(attributes[key])}</>
                        : format(attributes[key] ?? old[key])}
                </li>
            ))}
            {keys.length > 8 && <li className="text-muted-foreground">+{keys.length - 8} more fields</li>}
        </ul>
    );
}

export default function ActivityLogsIndex({ logs, subjects = [], filters = {} }) {
    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Audit Log</h1>}>
            <Head title="Audit Log" />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Every create, update and delete on reports, requests, donations, distributions, inventory, households and users.</p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="subject" className="text-sm text-muted-foreground">Record type</label>
                        <select id="subject" value={filters.subject ?? ''}
                            onChange={e => router.get('/activity-logs', e.target.value ? { subject: e.target.value } : {}, { preserveState: true })}
                            className="border-input rounded-md shadow-sm text-sm">
                            <option value="">All</option>
                            {subjects.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium">When</th>
                                <th className="text-left px-4 py-3 font-medium">Who</th>
                                <th className="text-left px-4 py-3 font-medium">Action</th>
                                <th className="text-left px-4 py-3 font-medium">Record</th>
                                <th className="text-left px-4 py-3 font-medium">Changes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 align-top">
                            {logs.data.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No activity recorded yet.</td></tr>
                            ) : logs.data.map(log => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-foreground">{log.causer?.name ?? 'System'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_COLORS[log.event] ?? 'bg-muted text-foreground'}`}>{log.event}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{log.subject_label}</td>
                                    <td className="px-4 py-3"><Changes properties={log.properties} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination paginator={logs} />
            </div>
        </AppLayout>
    );
}
