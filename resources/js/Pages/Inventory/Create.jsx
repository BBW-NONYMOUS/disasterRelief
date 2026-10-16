import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateInventoryItem({ categories = [], units = [], barangays = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        barangay_id: '',
        category: categories[0] ?? 'Food',
        name: '',
        quantity: '',
        unit: units[0] ?? 'pack',
        expiry_date: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/inventory');
    };

    return (
        <AppLayout description="Add relief goods to the barangay's stock." header={<h1 className="text-lg font-semibold text-foreground">Add Inventory Item</h1>}>
            <Head title="Add Inventory Item" />

            <FormShell width="lg">
                <form onSubmit={submit} className="space-y-5">
                    {barangays.length > 0 && (
                        <div>
                            <InputLabel htmlFor="barangay_id" value="Barangay *" />
                            <select id="barangay_id" value={data.barangay_id} onChange={e => setData('barangay_id', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                <option value="">Select barangay</option>
                                {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <InputError message={errors.barangay_id} />
                        </div>
                    )}

                    <div>
                        <InputLabel htmlFor="category" value="Category *" />
                        <select id="category" value={data.category} onChange={e => setData('category', e.target.value)}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                            <select id="unit" value={data.unit} onChange={e => setData('unit', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                {units.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <InputError message={errors.unit} />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="expiry_date" value="Expiry Date (optional)" />
                        <TextInput id="expiry_date" type="date" value={data.expiry_date}
                            onChange={e => setData('expiry_date', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.expiry_date} />
                    </div>

                    <p className="text-xs text-muted-foreground">If the same item (name, category and unit) already exists, the quantity is added to it.</p>

                    <FormActions>
                        <CancelLink href="/inventory" />
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Adding…' : 'Add Item'}
                        </PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
