import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import StatusBadge from '@/Components/StatusBadge';

const STEPS = ['reported', 'verified', 'confirmed', 'resolved'];

function StatusSteps({ status }) {
    if (status === 'rejected') {
        return <p className="text-sm text-status-rejected bg-status-rejected/10 border border-status-rejected/30 rounded-lg px-3 py-2">This report was rejected. See the timeline for the reason.</p>;
    }
    const current = STEPS.indexOf(status);
    return (
        <ol className="flex items-center gap-1 text-xs" aria-label="Report progress">
            {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded-full font-medium capitalize
                        ${i < current ? 'bg-green-100 text-status-completed' : i === current ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                        aria-current={i === current ? 'step' : undefined}>
                        {step}
                    </span>
                    {i < STEPS.length - 1 && <span className="text-muted-foreground" aria-hidden="true">→</span>}
                </li>
            ))}
        </ol>
    );
}

export default function ShowDisasterReport({ report, can = {}, merge_candidates = [] }) {
    const [note, setNote] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [mergeTarget, setMergeTarget] = useState('');

    const merge = () => {
        if (!mergeTarget) {
            setError('Choose the incident this duplicate belongs to.');
            return;
        }
        setError(null);
        setBusy(true);
        router.post(`/disaster-reports/${report.id}/merge`, { target_id: mergeTarget, note }, {
            onError: (errors) => setError(errors.target_id ?? Object.values(errors)[0]),
            onFinish: () => setBusy(false),
        });
    };

    const act = (action, { requireNote = false } = {}) => {
        if (requireNote && !note.trim()) {
            setError('Please write the reason in the note field.');
            return;
        }
        setError(null);
        setBusy(true);
        router.post(`/disaster-reports/${report.id}/${action}`, { note }, {
            preserveScroll: true,
            onSuccess: () => setNote(''),
            onError: (errors) => setError(errors.note ?? Object.values(errors)[0]),
            onFinish: () => setBusy(false),
        });
    };

    const hasActions = can.verify || can.confirm || can.reject || can.resolve;
    const canMerge = can.merge && merge_candidates.length > 0;

    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/disaster-reports" className="text-muted-foreground hover:text-foreground">Reports</Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground">{report.type}</span>
            </div>
        }>
            <Head title={`Disaster Report: ${report.type}`} />

            <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{report.type}</h2>
                            <p className="text-sm text-muted-foreground mt-1">Report #{report.id}</p>
                        </div>
                        <div className="flex gap-2">
                            {report.severity && <StatusBadge status={report.severity} label={`${report.severity.charAt(0).toUpperCase()}${report.severity.slice(1)} severity`} />}
                            <StatusBadge status={report.status} />
                        </div>
                    </div>

                    <div className="mb-6 overflow-x-auto"><StatusSteps status={report.status} /></div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <span className="text-muted-foreground">Affected Area</span>
                            <p className="font-medium text-foreground">{report.affected_area}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Barangay</span>
                            <p className="font-medium text-foreground">{report.barangay?.name ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Purok</span>
                            <p className="font-medium text-foreground">{report.purok?.name ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Reported By</span>
                            <p className="font-medium text-foreground">{report.reporter?.name}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Filed On</span>
                            <p className="font-medium text-foreground">{new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                        {report.verified_at && (
                            <div>
                                <span className="text-muted-foreground">Verified</span>
                                <p className="font-medium text-foreground">
                                    {new Date(report.verified_at).toLocaleDateString()}{report.verifier ? ` by ${report.verifier.name}` : ''}
                                </p>
                            </div>
                        )}
                        {report.confirmed_at && (
                            <div>
                                <span className="text-muted-foreground">Confirmed On</span>
                                <p className="font-medium text-foreground">{new Date(report.confirmed_at).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                        <p className="text-foreground text-sm leading-relaxed">{report.description}</p>
                    </div>

                    {/* Photos */}
                    {report.photos?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Photos</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {report.photos.map(photo => (
                                    <a key={photo.id} href={`/storage/${photo.path}`} target="_blank" rel="noopener">
                                        <img
                                            src={`/storage/${photo.path}`}
                                            className="h-36 w-full object-cover rounded-lg hover:opacity-90 transition"
                                            alt="Report photo"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Workflow actions — the server decides which apply to this user and status. */}
                    {(hasActions || can.update) && (
                        <div className="mt-6 pt-4 border-t border-border/60 space-y-3">
                            {hasActions && (
                                <div>
                                    <label htmlFor="note" className="block text-sm font-medium text-foreground">
                                        Note {can.reject ? <span className="text-muted-foreground font-normal">(required when rejecting)</span> : <span className="text-muted-foreground font-normal">(optional)</span>}
                                    </label>
                                    <textarea id="note" rows={2} value={note} onChange={e => setNote(e.target.value)}
                                        className="mt-1 block w-full border-input rounded-md shadow-sm text-sm"
                                        placeholder="e.g. Checked on site with the purok tanod; 12 houses flooded." />
                                    {error && <p className="text-sm text-status-rejected mt-1">{error}</p>}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {can.verify && (
                                    <button onClick={() => act('verify')} disabled={busy}
                                        className="bg-status-verified text-white px-4 py-2 rounded-lg text-sm hover:bg-status-verified/90 disabled:opacity-50">
                                        Verify &amp; Forward to Barangay
                                    </button>
                                )}
                                {can.confirm && (
                                    <button onClick={() => act('confirm')} disabled={busy}
                                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">
                                        Confirm Incident
                                    </button>
                                )}
                                {can.resolve && (
                                    <button onClick={() => act('resolve')} disabled={busy}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                                        Mark Resolved
                                    </button>
                                )}
                                {can.reject && (
                                    <button onClick={() => act('reject', { requireNote: true })} disabled={busy}
                                        className="border border-red-300 text-status-rejected px-4 py-2 rounded-lg text-sm hover:bg-status-rejected/10 disabled:opacity-50">
                                        Reject
                                    </button>
                                )}
                                {can.update && (
                                    <ModalLink href={`/disaster-reports/${report.id}/edit`} size="2xl"
                                        className="border border-input text-foreground px-4 py-2 rounded-lg text-sm hover:bg-accent">
                                        Edit Details
                                    </ModalLink>
                                )}
                            </div>

                            {/* Merge a duplicate into the surviving incident */}
                            {canMerge && (
                                <div className="pt-3 border-t border-border/60">
                                    <label htmlFor="merge_target" className="block text-sm font-medium text-foreground">
                                        Duplicate of another incident?
                                    </label>
                                    <div className="mt-1 flex flex-col sm:flex-row gap-2">
                                        <select id="merge_target" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)}
                                            className="block w-full border-input rounded-md shadow-sm text-sm">
                                            <option value="">Choose the incident it belongs to…</option>
                                            {merge_candidates.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    #{c.id} · {c.type} — {c.affected_area} ({c.status})
                                                </option>
                                            ))}
                                        </select>
                                        <button onClick={merge} disabled={busy || !mergeTarget}
                                            className="shrink-0 border border-input text-foreground px-4 py-2 rounded-md text-sm hover:bg-accent disabled:opacity-50">
                                            Merge into incident
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Its assistance requests and donations move to the surviving incident. This cannot be undone.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* This report was folded into another incident */}
                    {report.merged_into && (
                        <div className="mt-6 p-3 rounded-lg text-sm bg-muted text-muted-foreground border border-border">
                            This report was merged into{' '}
                            <Link href={`/disaster-reports/${report.merged_into.id}`} className="text-primary hover:underline capitalize">
                                {report.merged_into.type} — {report.merged_into.affected_area}
                            </Link>.
                        </div>
                    )}
                </div>

                {/* Status timeline */}
                {report.history?.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-4">Status Timeline</h3>
                        <ol className="relative border-l border-border ml-2 space-y-5">
                            {report.history.map(entry => (
                                <li key={entry.id} className="ml-4">
                                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-primary" aria-hidden="true" />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={entry.status} />
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(entry.created_at).toLocaleString()}
                                            {entry.actor ? ` · ${entry.actor.name}` : ''}
                                        </span>
                                    </div>
                                    {entry.note && <p className="text-sm text-foreground mt-1">{entry.note}</p>}
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Assistance Requests */}
                {report.assistance_requests?.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-4">Assistance Requests ({report.assistance_requests.length})</h3>
                        <div className="space-y-3">
                            {report.assistance_requests.map(req => (
                                <div key={req.id} className="flex items-start justify-between">
                                    <div>
                                        <Link href={`/assistance-requests/${req.id}`} className="text-sm text-foreground hover:text-primary">
                                            <span className="capitalize">{req.type}</span> × {req.quantity} — {req.goods_needed}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">By {req.requester?.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <StatusBadge status={req.priority ?? req.urgency} />
                                        <StatusBadge status={req.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
