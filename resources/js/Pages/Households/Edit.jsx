import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function EditHousehold({ household, puroks = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
        purok_id: household.purok_id,
        head_name: household.head_name,
        address: household.address,
        members_count: household.members_count,
        priority_flag: household.priority_flag,
        status: household.status,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/households/${household.id}`);
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Edit: {household.head_name}</h1>}>
            <Head title="Edit Household" />
            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="head_name" value="Head of Household" />
                            <TextInput id="head_name" value={data.head_name} onChange={e => setData('head_name', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.head_name} />
                        </div>
                        <div>
                            <InputLabel htmlFor="address" value="Address" />
                            <textarea id="address" value={data.address} onChange={e => setData('address', e.target.value)}
                                rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
                        </div>
                        <div>
                            <InputLabel htmlFor="members_count" value="Number of Members" />
                            <TextInput id="members_count" type="number" min="1" value={data.members_count}
                                onChange={e => setData('members_count', e.target.value)} className="mt-1 block w-full" />
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value="Assistance Status" />
                            <select id="status" value={data.status} onChange={e => setData('status', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                <option value="waiting">Waiting</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="assistance_completed">Assistance Completed</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.priority_flag}
                                onChange={e => setData('priority_flag', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Priority Household</span>
                        </label>
                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/households" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</Link>
                            <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
