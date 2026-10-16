import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function EditInventoryItem({ item, categories = [], units = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
        category: item.category,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiry_date: item.expiry_date ? item.expiry_date.slice(0, 10) : '',
        adjustment_note: '',
    });

    // Keep a legacy free-text unit selectable for rows created before the fixed list.
    const unitOptions = units.includes(item.unit) ? units : [item.unit, ...units];
    const quantityChanged = Number(data.quantity) !== Number(item.quantity);

    const submit = (e) => {
        e.preventDefault();
        patch(`/inventory/${item.id}`);
    };

    return (
        <AppLayout description="Correct the item details or the count on hand." header={<h1 className="text-lg font-semibold text-foreground">Edit: {item.name}</h1>}>
            <Head title={`Edit ${item.name}`} />

            <FormShell width="lg">
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="category" value="Category" />
                        <select id="category" value={data.category} onChange={e => setData('category', e.target.value)}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <InputError message={errors.category} />
                    </div>
                    <div>
                        <InputLabel htmlFor="name" value="Item Name" />
                        <TextInput id="name" value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="quantity" value="Quantity on hand" />
                            <TextInput id="quantity" type="number" min="0" value={data.quantity}
                                onChange={e => setData('quantity', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.quantity} />
                        </div>
                        <div>
                            <InputLabel htmlFor="unit" value="Unit" />
                            <select id="unit" value={data.unit} onChange={e => setData('unit', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <InputError message={errors.unit} />
                        </div>
                    </div>
                    {quantityChanged && (
                        <div>
                            <InputLabel htmlFor="adjustment_note" value="Reason for count correction" />
                            <TextInput id="adjustment_note" value={data.adjustment_note} placeholder="e.g. Physical count on 14 Oct; 2 sacks spoiled"
                                onChange={e => setData('adjustment_note', e.target.value)} className="mt-1 block w-full" />
                            <p className="text-xs text-muted-foreground mt-1">
                                The difference ({Number(data.quantity) - Number(item.quantity) > 0 ? '+' : ''}{Number(data.quantity) - Number(item.quantity)}) is recorded in the stock ledger.
                            </p>
                            <InputError message={errors.adjustment_note} />
                        </div>
                    )}
                    <div>
                        <InputLabel htmlFor="expiry_date" value="Expiry Date" />
                        <TextInput id="expiry_date" type="date" value={data.expiry_date}
                            onChange={e => setData('expiry_date', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.expiry_date} />
                    </div>
                    <FormActions>
                        <CancelLink href={`/inventory/${item.id}`} />
                        <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
