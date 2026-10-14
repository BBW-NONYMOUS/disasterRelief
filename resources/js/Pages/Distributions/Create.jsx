import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateDistribution({ households = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        household_id: '',
        items: '',
        quantity: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/distributions');
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">New Distribution</h1>}>
            <Head title="New Distribution" />

            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="household_id" value="Household *" />
                            <select id="household_id" value={data.household_id}
                                onChange={e => setData('household_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                <option value="">Select household</option>
                                {households.map(h => (
                                    <option key={h.id} value={h.id}>
                                        {h.head_name} — {h.address} {h.priority_flag ? '⚡ Priority' : ''}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.household_id} />
                        </div>

                        <div>
                            <InputLabel htmlFor="items" value="Items to Distribute *" />
                            <textarea id="items" value={data.items}
                                onChange={e => setData('items', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                placeholder="e.g. Rice, Canned goods, Medicine" />
                            <InputError message={errors.items} />
                        </div>

                        <div>
                            <InputLabel htmlFor="quantity" value="Quantity (total units) *" />
                            <TextInput id="quantity" type="number" min="1" value={data.quantity}
                                onChange={e => setData('quantity', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.quantity} />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/distributions" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Creating…' : 'Create Distribution'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
