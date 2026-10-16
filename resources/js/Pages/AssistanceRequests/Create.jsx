import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateAssistanceRequest({ disaster_reports = [], barangays = [], puroks = [], types = [], defaults = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        barangay_id: defaults.barangay_id ?? '',
        purok_id: defaults.purok_id ?? '',
        disaster_report_id: '',
        type: types[0]?.value ?? 'food',
        quantity: 1,
        goods_needed: '',
        urgency: 'normal',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/assistance-requests');
    };

    const barangayPuroks = puroks.filter(p => String(p.barangay_id) === String(data.barangay_id));
    const barangayReports = disaster_reports.filter(r => !data.barangay_id || String(r.barangay_id) === String(data.barangay_id));

    return (
        <AppLayout description="Tell your barangay what your household needs. Your purok president verifies it first." header={<h1 className="text-lg font-semibold text-foreground">Request Assistance</h1>}>
            <Head title="Request Assistance" />

            <FormShell width="lg">
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="barangay_id" value="Barangay *" />
                            <select id="barangay_id" value={data.barangay_id}
                                onChange={e => setData(d => ({ ...d, barangay_id: e.target.value, purok_id: '', disaster_report_id: '' }))}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                <option value="">Select barangay</option>
                                {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <InputError message={errors.barangay_id} />
                        </div>
                        <div>
                            <InputLabel htmlFor="purok_id" value="Purok" />
                            <select id="purok_id" value={data.purok_id} onChange={e => setData('purok_id', e.target.value)}
                                disabled={!data.barangay_id}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm disabled:bg-muted/50">
                                <option value="">Not sure</option>
                                {barangayPuroks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <InputError message={errors.purok_id} />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-3">Your purok president verifies the request before the barangay approves it.</p>

                    <div>
                        <InputLabel htmlFor="disaster_report_id" value="Related Disaster (optional)" />
                        <select id="disaster_report_id" value={data.disaster_report_id}
                            onChange={e => setData('disaster_report_id', e.target.value)}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                            <option value="">None</option>
                            {barangayReports.map(r => (
                                <option key={r.id} value={r.id}>{r.type} — {r.affected_area}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="type" value="Type of Assistance *" />
                            <select id="type" value={data.type} onChange={e => setData('type', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <InputError message={errors.type} />
                        </div>
                        <div>
                            <InputLabel htmlFor="quantity" value="People / units *" />
                            <TextInput id="quantity" type="number" min="1" value={data.quantity}
                                onChange={e => setData('quantity', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.quantity} />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="urgency" value="How urgent is it?" />
                        <select id="urgency" value={data.urgency} onChange={e => setData('urgency', e.target.value)}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical — life-threatening</option>
                        </select>
                        <InputError message={errors.urgency} />
                    </div>

                    <div>
                        <InputLabel htmlFor="goods_needed" value="Details *" />
                        <textarea id="goods_needed" value={data.goods_needed}
                            onChange={e => setData('goods_needed', e.target.value)}
                            rows={4}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm"
                            placeholder="e.g. Rice and drinking water for 5 family members; our stock was flooded." />
                        <InputError message={errors.goods_needed} />
                    </div>

                    <FormActions>
                        <CancelLink href="/assistance-requests" />
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Submitting…' : 'Submit Request'}
                        </PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
