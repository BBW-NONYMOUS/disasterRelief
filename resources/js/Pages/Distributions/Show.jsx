import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import SignaturePad from '@/Components/SignaturePad';
import { useState } from 'react';

export default function ShowDistribution({ distribution }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const [signatureFile, setSignatureFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleSignatureSave = (file) => {
        setSignatureFile(file);
    };

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

    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/distributions" className="text-gray-500 hover:text-gray-700">Distributions</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800">#{distribution.id}</span>
            </div>
        }>
            <Head title={`Distribution #${distribution.id}`} />

            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Distribution #{distribution.id}</h2>
                        <StatusBadge status={distribution.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                            <span className="text-gray-500">Household</span>
                            <p className="font-medium">{distribution.household?.head_name}</p>
                            <p className="text-gray-400 text-xs">{distribution.household?.address}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Purok</span>
                            <p className="font-medium">{distribution.household?.purok?.name ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Items</span>
                            <p className="font-medium">{distribution.items}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Quantity</span>
                            <p className="font-medium">{distribution.quantity}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Managed By</span>
                            <p className="font-medium">{distribution.admin?.name}</p>
                        </div>
                        {distribution.distributed_at && (
                            <div>
                                <span className="text-gray-500">Distributed At</span>
                                <p className="font-medium">{new Date(distribution.distributed_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {/* Signature */}
                    {distribution.signature_path ? (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Recipient Signature</h3>
                            <img src={`/storage/${distribution.signature_path}`} className="max-h-24 border border-gray-200 rounded" alt="Signature" />
                        </div>
                    ) : (
                        ['admin', 'super_admin'].includes(role) && distribution.status === 'ongoing' && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Capture Recipient Signature</h3>
                                <SignaturePad onSave={handleSignatureSave} />
                                {signatureFile && (
                                    <button onClick={submitSignature} disabled={saving}
                                        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                                        {saving ? 'Saving…' : 'Save Signature & Record Beneficiary'}
                                    </button>
                                )}
                            </div>
                        )
                    )}

                    {/* Status transitions */}
                    {['admin', 'super_admin'].includes(role) && distribution.status !== 'completed' && (
                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                            {distribution.status === 'waiting' && (
                                <button onClick={() => router.patch(`/distributions/${distribution.id}/transition`, { status: 'ongoing' })}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                                    Start Distribution
                                </button>
                            )}
                            {distribution.status === 'ongoing' && (
                                <button onClick={() => router.patch(`/distributions/${distribution.id}/transition`, { status: 'completed' })}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                                    Mark Complete
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Beneficiaries */}
                {distribution.beneficiaries?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Beneficiary Records</h3>
                        {distribution.beneficiaries.map(b => (
                            <div key={b.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-700">{b.items_received}</span>
                                <span className="text-gray-400">{b.received_at ? new Date(b.received_at).toLocaleDateString() : '—'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
