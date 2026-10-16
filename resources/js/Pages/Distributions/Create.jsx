import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateDistribution({ households = [], inventory = [], requests = [], preselected = {} }) {
    const initialRequest = requests.find(r => r.id === preselected.assistance_request_id);

    const { data, setData, post, processing, errors } = useForm({
        household_id: initialRequest?.household_id ?? '',
        assistance_request_id: initialRequest?.id ?? '',
        items: [{ inventory_item_id: '', quantity: 1 }],
    });

    const household = households.find(h => String(h.id) === String(data.household_id));
    const barangayId = household?.purok?.barangay_id;

    const stock = useMemo(
        () => inventory.filter(i => i.barangay_id === barangayId),
        [inventory, barangayId],
    );

    // Approved requests for this household, or unlinked ones in the same purok.
    const householdRequests = requests.filter(r => household && r.barangay_id === barangayId
        && (r.household_id === household.id || (!r.household_id && r.purok_id === household.purok_id)));

    const setLine = (index, field, value) => {
        setData('items', data.items.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
    };

    const chooseHousehold = (id) => {
        const next = households.find(h => String(h.id) === String(id));
        const current = requests.find(r => String(r.id) === String(data.assistance_request_id));
        const keepRequest = next && current && current.barangay_id === next.purok?.barangay_id
            && (current.household_id === next.id || (!current.household_id && current.purok_id === next.purok_id));
        setData(d => ({
            ...d,
            household_id: id,
            assistance_request_id: keepRequest ? d.assistance_request_id : '',
            items: [{ inventory_item_id: '', quantity: 1 }],
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        post('/distributions');
    };

    return (
        <AppLayout description="Choose a household and the relief items to hand out." header={<h1 className="text-lg font-semibold text-foreground">New Distribution</h1>}>
            <Head title="New Distribution" />

            <FormShell width="2xl">
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="household_id" value="Household *" />
                        <select id="household_id" value={data.household_id}
                            onChange={e => chooseHousehold(e.target.value)}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                            <option value="">Select household</option>
                            {households.map(h => (
                                <option key={h.id} value={h.id}>
                                    {h.priority_flag ? '⚡ ' : ''}{h.head_name} — {h.purok?.name}{h.verified_at ? ' ✓' : ' (unverified)'}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">⚡ priority household · ✓ verified by the purok president</p>
                        <InputError message={errors.household_id} />
                    </div>

                    {household && (
                        <div>
                            <InputLabel htmlFor="assistance_request_id" value="Fulfils assistance request (optional)" />
                            <select id="assistance_request_id" value={data.assistance_request_id}
                                onChange={e => setData('assistance_request_id', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                <option value="">None</option>
                                {householdRequests.map(r => (
                                    <option key={r.id} value={r.id}>
                                        #{r.id} {r.type} × {r.quantity}{r.priority ? ` — ${r.priority}` : ''}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.assistance_request_id} />
                        </div>
                    )}

                    {household && (
                        <fieldset className="space-y-3">
                            <legend className="block text-sm font-medium text-foreground">Items from inventory *</legend>
                            {stock.length === 0 && (
                                <p className="text-sm text-orange-700 bg-orange-50 rounded-lg p-3">
                                    This barangay has no stock on hand. Receive donations or add inventory first.
                                </p>
                            )}
                            {data.items.map((line, i) => {
                                const item = stock.find(s => String(s.id) === String(line.inventory_item_id));
                                return (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-start">
                                        <div className="col-span-7">
                                            <label className="sr-only" htmlFor={`line-item-${i}`}>Item</label>
                                            <select id={`line-item-${i}`} value={line.inventory_item_id}
                                                onChange={e => setLine(i, 'inventory_item_id', e.target.value)}
                                                className="block w-full border-input rounded-md shadow-sm text-sm">
                                                <option value="">Select item</option>
                                                {stock.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.quantity} {s.unit} left)</option>
                                                ))}
                                            </select>
                                            <InputError message={errors[`items.${i}.inventory_item_id`]} />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="sr-only" htmlFor={`line-qty-${i}`}>Quantity</label>
                                            <TextInput id={`line-qty-${i}`} type="number" min="1" max={item?.quantity}
                                                value={line.quantity} onChange={e => setLine(i, 'quantity', e.target.value)}
                                                className="block w-full text-sm" />
                                            <InputError message={errors[`items.${i}.quantity`]} />
                                        </div>
                                        <div className="col-span-2 flex items-center h-9 text-xs text-muted-foreground">
                                            {item?.unit}
                                            {data.items.length > 1 && (
                                                <button type="button" onClick={() => setData('items', data.items.filter((_, j) => j !== i))}
                                                    className="ml-auto text-status-rejected hover:underline" aria-label={`Remove line ${i + 1}`}>✕</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {stock.length > 0 && (
                                <button type="button" onClick={() => setData('items', [...data.items, { inventory_item_id: '', quantity: 1 }])}
                                    className="text-sm text-primary hover:underline">+ Add item</button>
                            )}
                            <InputError message={errors.items} />
                        </fieldset>
                    )}

                    <p className="text-xs text-muted-foreground">Stock is reserved from inventory as soon as the distribution is created. Cancelling it before it starts returns the items.</p>

                    <FormActions>
                        <CancelLink href="/distributions" />
                        <PrimaryButton disabled={processing || !household}>
                            {processing ? 'Creating…' : 'Create Distribution'}
                        </PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
