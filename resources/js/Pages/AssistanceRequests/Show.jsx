import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import StatusBadge from '@/Components/StatusBadge';
import useModuleAccess from '@/Hooks/useModuleAccess';

function Field({ label, children }) {
    return (
        <div>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">{children}</dd>
        </div>
    );
}

function DonorView({ request }) {
    const { canManage: canDonate } = useModuleAccess('donations');
    return (
        <div className="max-w-lg mx-auto bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-foreground">{request.type_label} × {request.quantity}</h2>
                {request.priority && <StatusBadge status={request.priority} label={`${request.priority} priority`} />}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Barangay">{request.barangay?.name ?? '—'}</Field>
                <Field label="Purok">{request.purok?.name ?? '—'}</Field>
                {request.disaster_report && <Field label="Disaster">{request.disaster_report.type}</Field>}
                {request.approved_at && <Field label="Approved">{new Date(request.approved_at).toLocaleDateString()}</Field>}
            </dl>
            <p className="text-xs text-muted-foreground">Household details are private. Donations to this barangay are distributed to approved requests by priority.</p>
            <div className="flex gap-3">
                {canDonate && <ModalLink href="/donations/create" size="2xl" className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark">Donate to this barangay</ModalLink>}
                <Link href="/assistance-requests" className="px-4 py-2 text-sm text-muted-foreground hover:underline">← Back</Link>
            </div>
        </div>
    );
}

export default function ShowAssistanceRequest({ request, donor_view = false, households = [], priorities = [], can = {} }) {
    const [priority, setPriority] = useState(request.priority ?? (request.urgency === 'critical' ? 'critical' : request.urgency === 'urgent' ? 'high' : 'normal'));
    const [householdId, setHouseholdId] = useState(request.household_id ?? '');
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    if (donor_view) {
        return (
            <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Open Need #{request.id}</h1>}>
                <Head title={`Need #${request.id}`} />
                <DonorView request={request} />
            </AppLayout>
        );
    }

    const post = (action, payload) => {
        setBusy(true);
        router.post(`/assistance-requests/${request.id}/${action}`, payload, {
            preserveScroll: true,
            onSuccess: () => { setNote(''); setErrors({}); },
            onError: setErrors,
            onFinish: () => setBusy(false),
        });
    };

    const hasActions = can.verify || can.approve || can.reject || can.fulfill;

    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/assistance-requests" className="text-muted-foreground hover:text-foreground">Requests</Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground">#{request.id}</span>
            </div>
        }>
            <Head title={`Assistance Request #${request.id}`} />
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex justify-between items-start gap-3 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground"><span className="capitalize">{request.type}</span> × {request.quantity}</h2>
                            <p className="text-sm text-muted-foreground">Request #{request.id} · filed {new Date(request.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {request.priority && <StatusBadge status={request.priority} label={`${request.priority} priority`} />}
                            <StatusBadge status={request.status} />
                        </div>
                    </div>

                    <p className="text-sm text-foreground mb-5">{request.goods_needed}</p>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <Field label="Requester">{request.requester?.name}{request.requester?.phone ? ` · ${request.requester.phone}` : ''}</Field>
                        <Field label="Resident's urgency"><span className="capitalize">{request.urgency}</span></Field>
                        <Field label="Barangay / Purok">{request.barangay?.name ?? '—'} / {request.purok?.name ?? '—'}</Field>
                        <Field label="Household">
                            {request.household
                                ? <>{request.household.head_name}{request.household.verified_at ? ' ✓' : ''}</>
                                : <span className="text-muted-foreground font-normal">Not linked yet</span>}
                        </Field>
                        {request.disaster_report && (
                            <Field label="Related disaster">
                                <Link href={`/disaster-reports/${request.disaster_report.id}`} className="text-primary hover:underline">
                                    {request.disaster_report.type} — {request.disaster_report.affected_area}
                                </Link>
                            </Field>
                        )}
                        {request.verified_at && <Field label="Verified">{new Date(request.verified_at).toLocaleDateString()} by {request.verifier?.name ?? '—'}</Field>}
                        {request.approved_at && <Field label="Approved">{new Date(request.approved_at).toLocaleDateString()} by {request.approver?.name ?? '—'}</Field>}
                        {request.fulfilled_at && <Field label="Fulfilled">{new Date(request.fulfilled_at).toLocaleDateString()}</Field>}
                    </dl>

                    {request.remarks && (
                        <div className={`mt-4 rounded-lg p-3 text-sm ${request.status === 'rejected' ? 'bg-status-rejected/10 text-status-rejected' : 'bg-muted/50 text-foreground'}`}>
                            <span className="font-medium">Remarks:</span> {request.remarks}
                        </div>
                    )}
                </div>

                {hasActions && (
                    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                        <h3 className="font-semibold text-foreground">
                            {can.verify ? 'Verify request' : can.approve ? 'Approve request' : 'Update request'}
                        </h3>

                        {(can.verify || can.approve) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-foreground">
                                        {can.approve ? 'Final priority' : 'Priority'}
                                    </label>
                                    <select id="priority" value={priority} onChange={e => setPriority(e.target.value)}
                                        className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                        {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                    {errors.priority && <p className="text-sm text-status-rejected mt-1">{errors.priority}</p>}
                                </div>
                                {can.verify && (
                                    <div>
                                        <label htmlFor="household_id" className="block text-sm font-medium text-foreground">Link household</label>
                                        <select id="household_id" value={householdId} onChange={e => setHouseholdId(e.target.value)}
                                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                            <option value="">— Not registered —</option>
                                            {households.map(h => (
                                                <option key={h.id} value={h.id}>{h.head_name} — {h.address}{h.verified_at ? ' ✓' : ''}</option>
                                            ))}
                                        </select>
                                        {errors.household_id && <p className="text-sm text-status-rejected mt-1">{errors.household_id}</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-foreground">
                                Note <span className="text-muted-foreground font-normal">{can.reject ? '(required to reject)' : '(optional)'}</span>
                            </label>
                            <textarea id="note" rows={2} value={note} onChange={e => setNote(e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm" />
                            {(errors.note || errors.remarks) && <p className="text-sm text-status-rejected mt-1">{errors.note || errors.remarks}</p>}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {can.verify && (
                                <button disabled={busy} onClick={() => post('verify', { priority, household_id: householdId || null, note })}
                                    className="bg-status-verified text-white px-4 py-2 rounded-lg text-sm hover:bg-status-verified/90 disabled:opacity-50">
                                    Verify &amp; Forward
                                </button>
                            )}
                            {can.approve && (
                                <button disabled={busy} onClick={() => post('approve', { priority, note })}
                                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">
                                    Approve
                                </button>
                            )}
                            {can.fulfill && (
                                <button disabled={busy} onClick={() => post('fulfill', { note })}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                                    Mark Fulfilled
                                </button>
                            )}
                            {can.reject && (
                                <button disabled={busy} onClick={() => post('reject', { remarks: note })}
                                    className="border border-red-300 text-status-rejected px-4 py-2 rounded-lg text-sm hover:bg-status-rejected/10 disabled:opacity-50">
                                    Reject
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {(can.distribute || request.distributions?.length > 0) && (
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">Distributions</h3>
                            {can.distribute && (
                                <ModalLink href={`/distributions/create?assistance_request_id=${request.id}`} size="xl"
                                    className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark">
                                    + Distribute relief
                                </ModalLink>
                            )}
                        </div>
                        {request.distributions?.length > 0 ? request.distributions.map(d => (
                            <Link key={d.id} href={`/distributions/${d.id}`} className="flex justify-between py-2 border-b border-border/60 last:border-0 text-sm hover:text-primary">
                                <span>{d.items}</span>
                                <StatusBadge status={d.status} />
                            </Link>
                        )) : <p className="text-sm text-muted-foreground">No distribution yet.</p>}
                    </div>
                )}

                <Link href="/assistance-requests" className="inline-block text-primary hover:underline text-sm">← Back</Link>
            </div>
        </AppLayout>
    );
}
