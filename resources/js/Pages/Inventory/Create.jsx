import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

const CATEGORIES = ['Food', 'Medicine', 'Clothing', 'Shelter', 'Water', 'Hygiene', 'Other'];

export default function CreateInventoryItem() {
    const { data, setData, post, processing, errors } = useForm({
        category: 'Food',
        name: '',
        quantity: '',
        unit: '',
        expiry_date: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/inventory');
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Add Inventory Item</h1>}>
            <Head title="Add Inventory Item" />

            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="category" value="Category *" />
                            <select id="category" value={data.category} onChange={e => setData('category', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <InputError message={errors.category} />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Item Name *" />
                            <TextInput id="name" value={data.name} onChange={e => setData('name', e.target.value)}
                                className="mt-1 block w-full" placeholder="e.g. Rice, Sardines, Paracetamol" />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="quantity" value="Quantity *" />
                                <TextInput id="quantity" type="number" min="0" value={data.quantity}
                                    onChange={e => setData('quantity', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.quantity} />
                            </div>
                            <div>
                                <InputLabel htmlFor="unit" value="Unit *" />
                                <TextInput id="unit" value={data.unit} onChange={e => setData('unit', e.target.value)}
                                    className="mt-1 block w-full" placeholder="e.g. kg, pcs, boxes" />
                                <InputError message={errors.unit} />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="expiry_date" value="Expiry Date (optional)" />
                            <TextInput id="expiry_date" type="date" value={data.expiry_date}
                                onChange={e => setData('expiry_date', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.expiry_date} />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/inventory" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Adding…' : 'Add Item'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
