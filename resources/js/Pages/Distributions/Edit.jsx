import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function EditDistribution({ distribution, households = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
        items: distribution.items,
        quantity: distribution.quantity,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/distributions/${distribution.id}`);
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Edit Distribution #{distribution.id}</h1>}>
            <Head title="Edit Distribution" />
            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="items" value="Items" />
                            <textarea id="items" value={data.items} onChange={e => setData('items', e.target.value)}
                                rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
                            <InputError message={errors.items} />
                        </div>
                        <div>
                            <InputLabel htmlFor="quantity" value="Quantity" />
                            <TextInput id="quantity" type="number" min="1" value={data.quantity}
                                onChange={e => setData('quantity', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.quantity} />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Link href={`/distributions/${distribution.id}`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</Link>
                            <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
