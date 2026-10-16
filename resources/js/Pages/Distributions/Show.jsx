import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import SignaturePad from '@/Components/SignaturePad';
import { useState } from 'react';

export default function ShowDistribution({ distribution, signature_url = null, can = {} }) {
    const [signatureFile, setSignatureFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const submitSignature = () => {
        if (!signatureFile) return;
        setSaving(true);
        const form = new FormData();
        form.append('signature', signatureFile);
        form.append('_method', 'PATCH');
        router.post(`/distributions/${distribution.id}`, form, {
            onFinish: () => setSaving(false),
        });
    };

    const transition = (status) => router.patch(`/distributions/${distribution.id}/transition`, { status }, { preserveScroll: true });

    const cancel = () => {
        if (confirm('Cancel this distribution and return its items to inventory?')) {
            router.delete(`/distributions/${distribution.id}`);
        }
    };

    const lines = distribution.distribution_items ?? [];

    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/distributions" className="text-muted-foreground hover:text-foreground">Distributions</Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground">#{distribution.id}</span>
            </div>
        }>
            <Head title={`Distribution #${distribution.id}`} />

            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">Distribution #{distribution.id}</h2>
                        <StatusBadge status={distribution.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                            <span className="text-muted-foreground">Household</span>
                            <p className="font-medium">
                                <Link href={`/households/${distribution.household?.id}`} className="hover:text-primary">{distribution.household?.head_name}</Link>
                            </p>
                            <p className="text-muted-foreground text-xs">{distribution.household?.address}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Purok</span>
                            <p className="font-medium">{distribution.household?.purok?.name ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Managed By</span>
                            <p className="font-medium">{distribution.admin?.name}</p>
                        </div>
                        {distribution.assistance_request && (
                            <div>
                                <span className="text-muted-foreground">Fulfils request</span>
                                <p className="font-medium">
                                    <Link href={`/assistance-requests/${distribution.assistance_request.id}`} className="text-primary hover:underline capitalize">
                                        #{distribution.assistance_request.id} {distribution.assistance_request.type}
                                    </Link>{' '}
                                    <StatusBadge status={distribution.assistance_request.status} />
                                </p>
                            </div>
                        )}
                        {distribution.distributed_at && (
                            <div>
                                <span className="text-muted-foreground">Distributed At</span>
                                <p className="font-medium">{new Date(distribution.distributed_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Items</h3>
                        {lines.length > 0 ? (
                            <ul className="divide-y divide-border/60 border border-border/60 rounded-lg text-sm">
                                {lines.map(l => (
                                    <li key={l.id} className="flex justify-between px-3 py-2">
                                        <span>{l.item_name}</span>
                                        <span className="font-medium">{l.quantity} {l.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm">{distribution.items} × {distribution.quantity}</p>
                        )}
                    </div>

                    {/* Signature */}
                    {signature_url ? (
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Recipient Signature</h3>
                            <img src={signature_url} className="max-h-24 border border-border rounded bg-card" alt="Recipient signature" />
                        </div>
                    ) : (
                        can.update && distribution.status === 'ongoing' && (
                            <div>
                                <h3 className="text-sm font-medium text-foreground mb-2">Capture Recipient Signature</h3>
                                <SignaturePad onSave={setSignatureFile} />
                                {signatureFile && (
                                    <button onClick={submitSignature} disabled={saving}
                                        className="mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">
                                        {saving ? 'Saving…' : 'Save Signature & Record Beneficiary'}
                                    </button>
                                )}
                            </div>
                        )
                    )}

                    {/* Status transitions */}
                    {(can.update || can.delete) && (
                        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-border/60">
                            {can.update && distribution.status === 'waiting' && (
                                <button onClick={() => transition('ongoing')}
                                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark">
                                    Start Distribution
                                </button>
                            )}
                            {can.update && distribution.status === 'ongoing' && (
                                <button onClick={() => transition('completed')} disabled={!signature_url}
                                    title={signature_url ? undefined : 'Capture the recipient\'s signature first'}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-40">
                                    Mark Complete
                                </button>
                            )}
                            {can.update && distribution.status === 'ongoing' && !signature_url && (
                                <span className="text-xs text-muted-foreground">Capture the recipient's signature to complete.</span>
                            )}
                            {can.delete && (
                                <button onClick={cancel}
                                    className="border border-red-300 text-status-rejected px-4 py-2 rounded-lg text-sm hover:bg-status-rejected/10">
                                    Cancel &amp; Return Stock
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Beneficiaries */}
                {distribution.beneficiaries?.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-4">Beneficiary Records</h3>
                        {distribution.beneficiaries.map(b => (
                            <div key={b.id} className="flex justify-between text-sm py-2 border-b border-border/60 last:border-0">
                                <span className="text-foreground">{b.household?.head_name}: {b.items_received}</span>
                                <span className="text-muted-foreground">{b.received_at ? new Date(b.received_at).toLocaleDateString() : '—'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
