import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const LEVEL_STYLES = {
    full: 'bg-status-completed/10 text-status-completed border-green-300',
    view: 'bg-status-ongoing/10 text-status-ongoing border-amber-300',
    none: 'bg-status-rejected/10 text-status-rejected border-red-300',
};

function LevelLabel({ level, label }) {
    return (
        <span className={`inline-flex items-center gap-1 border rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ${LEVEL_STYLES[level]}`}>
            {label} <span aria-hidden="true">🔒</span>
        </span>
    );
}

export default function AccessControlIndex({ modules = [], levels = [], matrix = [] }) {
    const [pending, setPending] = useState(null);
    const levelLabel = Object.fromEntries(levels.map(l => [l.value, l.label]));

    const change = (row, module, level) => {
        if (level === 'none' && !confirm(`Set ${module.label} to No Access for every ${row.label}? They lose access immediately.`)) return;
        const key = `${row.role}.${module.key}`;
        setPending(key);
        router.put('/access-control', { role: row.role, module: module.key, level }, {
            preserveScroll: true,
            onFinish: () => setPending(null),
        });
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Access Control</h1>}>
            <Head title="Access Control" />

            <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-5 text-sm text-muted-foreground space-y-3">
                    <p>Set the access level each of the 5 roles has to every module. Changes apply on the user's next page load and are recorded in the audit log.</p>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className={`border rounded-lg px-3 py-2 ${LEVEL_STYLES.full}`}>
                            <dt className="font-semibold">Full Access</dt>
                            <dd className="text-xs">Open, create, edit, approve and delete, as the role normally can.</dd>
                        </div>
                        <div className={`border rounded-lg px-3 py-2 ${LEVEL_STYLES.view}`}>
                            <dt className="font-semibold">View Only</dt>
                            <dd className="text-xs">Open and read the module's pages; every action button is disabled.</dd>
                        </div>
                        <div className={`border rounded-lg px-3 py-2 ${LEVEL_STYLES.none}`}>
                            <dt className="font-semibold">No Access</dt>
                            <dd className="text-xs">Module hidden from the menu and blocked.</dd>
                        </div>
                    </dl>
                    <p className="text-xs text-muted-foreground">
                        A dash (—) means the role never had that module. The Super Admin always keeps Full Access.
                        To block one person instead of a whole role, use <strong>Restrict access</strong> in User Management.
                    </p>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-muted/50">Role</th>
                                {modules.map(m => (
                                    <th key={m.key} scope="col" className="px-3 py-3 font-medium text-muted-foreground text-center whitespace-nowrap">{m.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {matrix.map(row => {
                                const cells = modules.filter(m => row.modules[m.key]?.applicable).map(m => row.modules[m.key].level);
                                const summary = ['full', 'view', 'none']
                                    .map(l => [l, cells.filter(c => c === l).length])
                                    .filter(([, n]) => n > 0)
                                    .map(([l, n]) => `${n} ${levelLabel[l]}`)
                                    .join(' · ');
                                return (
                                    <tr key={row.role}>
                                        <th scope="row" className="text-left px-4 py-3 sticky left-0 bg-card align-top">
                                            <div className="font-medium text-foreground whitespace-nowrap">{row.label}</div>
                                            <div className="text-xs font-normal text-muted-foreground whitespace-nowrap">{row.locked ? 'Always Full Access' : summary}</div>
                                        </th>
                                        {modules.map(m => {
                                            const cell = row.modules[m.key];
                                            const key = `${row.role}.${m.key}`;
                                            if (!cell?.applicable) {
                                                return <td key={m.key} className="px-3 py-3 text-center"><span className="text-muted-foreground" aria-label="Not applicable">—</span></td>;
                                            }
                                            return (
                                                <td key={m.key} className="px-3 py-3 text-center">
                                                    {row.locked ? (
                                                        <LevelLabel level="full" label={levelLabel.full} />
                                                    ) : (
                                                        <select
                                                            value={cell.level}
                                                            disabled={pending === key}
                                                            onChange={e => change(row, m, e.target.value)}
                                                            aria-label={`${m.label} access for ${row.label}`}
                                                            className={`border rounded-md pl-2 pr-7 py-1 text-xs font-medium focus:ring-2 focus:ring-primary disabled:opacity-50 ${LEVEL_STYLES[cell.level]}`}>
                                                            {m.levels.map(l => <option key={l} value={l}>{levelLabel[l]}</option>)}
                                                        </select>
                                                    )}
                                                </td>
                                            );
                                        })}
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
