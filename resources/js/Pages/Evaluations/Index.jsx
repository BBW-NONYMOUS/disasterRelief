import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

const LEVELS = [5, 4, 3, 2, 1];

function MeanBar({ mean }) {
    if (mean == null) return <span className="text-muted-foreground">—</span>;
    return (
        <div className="flex items-center gap-2 min-w-[8rem]">
            <div className="flex-1 h-2 rounded-full bg-muted" aria-hidden="true">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(mean / 5) * 100}%` }} />
            </div>
            <span className="font-semibold tabular-nums">{mean.toFixed(2)}</span>
        </div>
    );
}

export default function EvaluationsIndex({ summary = [], overall = {}, roles = [], comments = [] }) {
    const labelFor = Object.fromEntries(summary.map(s => [s.key, s.label]));
    const roleLabel = Object.fromEntries(roles.map(r => [r.value, r.label]));

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Evaluation Results</h1>}>
            <Head title="Evaluation Results" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-card border border-border rounded-xl px-5 py-4">
                            <div className="text-xs text-muted-foreground">Overall weighted mean</div>
                            <div className="text-2xl font-bold text-foreground tabular-nums">{overall.mean != null ? overall.mean.toFixed(2) : '—'}</div>
                            <div className="text-sm text-primary">{overall.interpretation ?? 'No responses yet'}</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl px-5 py-4">
                            <div className="text-xs text-muted-foreground">Respondents</div>
                            <div className="text-2xl font-bold text-foreground tabular-nums">{overall.respondents ?? 0}</div>
                        </div>
                    </div>
                    <a href="/evaluations/export" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
                        Export CSV
                    </a>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium">Criterion</th>
                                <th className="text-right px-4 py-3 font-medium">n</th>
                                <th className="text-left px-4 py-3 font-medium">Mean (1–5)</th>
                                <th className="text-left px-4 py-3 font-medium">Interpretation</th>
                                {LEVELS.map(l => <th key={l} className="text-right px-2 py-3 font-medium">{l}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {summary.map(s => (
                                <tr key={s.key}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{s.label}</div>
                                        <div className="text-xs text-muted-foreground max-w-xs">{s.statement}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">{s.n}</td>
                                    <td className="px-4 py-3"><MeanBar mean={s.mean} /></td>
                                    <td className="px-4 py-3 text-foreground">{s.interpretation ?? '—'}</td>
                                    {LEVELS.map(l => <td key={l} className="px-2 py-3 text-right tabular-nums text-muted-foreground">{s.distribution?.[l] ?? 0}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="px-4 py-2 text-xs text-muted-foreground border-t border-border/60">
                        Scale: 4.21–5.00 Strongly Agree · 3.41–4.20 Agree · 2.61–3.40 Neutral · 1.81–2.60 Disagree · 1.00–1.80 Strongly Disagree.
                    </p>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-x-auto">
                    <div className="px-4 py-3 border-b border-border/60 font-semibold text-foreground">Mean by respondent role</div>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="text-left px-4 py-2 font-medium">Criterion</th>
                                {roles.map(r => <th key={r.value} className="text-right px-4 py-2 font-medium">{r.label}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {summary.map(s => (
                                <tr key={s.key}>
                                    <td className="px-4 py-2 text-foreground">{s.label}</td>
                                    {roles.map(r => (
                                        <td key={r.value} className="px-4 py-2 text-right tabular-nums">
                                            {s.by_role?.[r.value] != null ? s.by_role[r.value].toFixed(2) : '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {comments.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-5">
                        <h2 className="font-semibold text-foreground mb-3">Recent comments</h2>
                        <ul className="divide-y divide-border/60">
                            {comments.map(c => (
                                <li key={c.id} className="py-2 text-sm">
                                    <p className="text-foreground">“{c.comment}”</p>
                                    <p className="text-xs text-muted-foreground">{labelFor[c.criterion] ?? c.criterion} · scored {c.score} · {roleLabel[c.role] ?? c.role}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
