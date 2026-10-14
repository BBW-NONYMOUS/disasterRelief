import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateAssistanceRequest({ disaster_reports = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        disaster_report_id: '',
        goods_needed: '',
        urgency: 'normal',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/assistance-requests');
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Request Assistance</h1>}>
            <Head title="Request Assistance" />

            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="disaster_report_id" value="Related Disaster Report (optional)" />
                            <select id="disaster_report_id" value={data.disaster_report_id}
                                onChange={e => setData('disaster_report_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                <option value="">None</option>
                                {disaster_reports.map(r => (
                                    <option key={r.id} value={r.id}>{r.type} — {r.affected_area}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <InputLabel htmlFor="urgency" value="Urgency Level" />
                            <select id="urgency" value={data.urgency} onChange={e => setData('urgency', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgent</option>
                                <option value="critical">Critical</option>
                            </select>
                            <InputError message={errors.urgency} />
                        </div>

                        <div>
                            <InputLabel htmlFor="goods_needed" value="Goods / Assistance Needed *" />
                            <textarea id="goods_needed" value={data.goods_needed}
                                onChange={e => setData('goods_needed', e.target.value)}
                                rows={4}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                placeholder="Describe what assistance or goods are needed..." />
                            <InputError message={errors.goods_needed} />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/assistance-requests" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Submitting…' : 'Submit Request'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
