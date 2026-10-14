import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateHousehold({ puroks = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        purok_id: puroks[0]?.id ?? '',
        head_name: '',
        address: '',
        members_count: 1,
        priority_flag: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/households');
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Add Household</h1>}>
            <Head title="Add Household" />
            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="purok_id" value="Purok *" />
                            <select id="purok_id" value={data.purok_id} onChange={e => setData('purok_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                {puroks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <InputError message={errors.purok_id} />
                        </div>
                        <div>
                            <InputLabel htmlFor="head_name" value="Head of Household *" />
                            <TextInput id="head_name" value={data.head_name} onChange={e => setData('head_name', e.target.value)}
                                className="mt-1 block w-full" />
                            <InputError message={errors.head_name} />
                        </div>
                        <div>
                            <InputLabel htmlFor="address" value="Address *" />
                            <textarea id="address" value={data.address} onChange={e => setData('address', e.target.value)}
                                rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
                            <InputError message={errors.address} />
                        </div>
                        <div>
                            <InputLabel htmlFor="members_count" value="Number of Members *" />
                            <TextInput id="members_count" type="number" min="1" max="50" value={data.members_count}
                                onChange={e => setData('members_count', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.members_count} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.priority_flag}
                                onChange={e => setData('priority_flag', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Mark as Priority Household</span>
                        </label>
                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/households" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</Link>
                            <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Add Household'}</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
