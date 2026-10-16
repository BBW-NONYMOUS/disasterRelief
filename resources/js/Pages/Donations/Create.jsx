import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions } from '@/Components/FormLayout';
import { useModalPage } from '@/Components/ModalLink';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';

export default function CreateDonation({ barangays = [], categories = [], units = [], needs = [], active_reports = [] }) {
    const modal = useModalPage();
    const blankItem = () => ({ name: '', category: categories[0] ?? 'Food', quantity: 1, unit: units[0] ?? 'pack' });

    const { data, setData, post, processing, errors } = useForm({
        barangay_id: barangays.length === 1 ? barangays[0].id : '',
        disaster_report_id: '',
        type: 'cash',
        amount_cents: '',
        items: [blankItem()],
        delivery_method: 'deliver',
        scheduled_at: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/donations');
    };

    const setItem = (index, field, value) => {
        setData('items', data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };
    const addItem = () => setData('items', [...data.items, blankItem()]);
    const removeItem = (index) => setData('items', data.items.filter((_, i) => i !== index));

    const barangayNeeds = needs.filter(n => !data.barangay_id || String(n.barangay_id) === String(data.barangay_id));
    const barangayReports = active_reports.filter(r => String(r.barangay_id) === String(data.barangay_id));

    const needsPanel = (
        <aside className={modal ? 'rounded-lg bg-muted/50 p-4' : 'bg-card rounded-xl border border-border p-5 h-fit'}>
            <h2 className={modal ? 'text-sm font-semibold text-foreground mb-2' : 'font-semibold text-foreground mb-3'}>Current needs</h2>
            {barangayNeeds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved needs{data.barangay_id ? ' for this barangay' : ''} right now.</p>
            ) : (
                <ul className="space-y-2">
                    {barangayNeeds.slice(0, 8).map(n => (
                        <li key={`${n.barangay_id}-${n.type}`} className="flex items-center justify-between text-sm">
                            <span>
                                <span className="font-medium text-foreground">{n.type_label}</span>
                                <span className="text-muted-foreground"> · {n.barangay} · {n.total_quantity}</span>
                            </span>
                            <StatusBadge status={n.priority} />
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );

    return (
        <AppLayout description="Give cash or goods to a barangay. You can follow where your donation goes." header={<h1 className="text-lg font-semibold text-foreground">Make a Donation</h1>}>
            <Head title="Make Donation" />

            <div className={modal ? 'space-y-5' : 'max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4'}>
                {modal && needsPanel}
                <div className={modal ? undefined : 'lg:col-span-2 bg-card rounded-xl border border-border p-6'}>
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="barangay_id" value="Donate to Barangay *" />
                            <select id="barangay_id" value={data.barangay_id}
                                onChange={e => { setData(d => ({ ...d, barangay_id: e.target.value, disaster_report_id: '' })); }}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                <option value="">Select barangay</option>
                                {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <InputError message={errors.barangay_id} />
                        </div>

                        {barangayReports.length > 0 && (
                            <div>
                                <InputLabel htmlFor="disaster_report_id" value="For Disaster Incident (optional)" />
                                <select id="disaster_report_id" value={data.disaster_report_id}
                                    onChange={e => setData('disaster_report_id', e.target.value)}
                                    className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                    <option value="">General donation — any need in this barangay</option>
                                    {barangayReports.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.type} — {r.affected_area}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Your donation will be tagged to this incident so you can follow its relief effort.
                                </p>
                                <InputError message={errors.disaster_report_id} />
                            </div>
                        )}

                        <fieldset>
                            <legend className="block text-sm font-medium text-foreground">Donation Type</legend>
                            <div className="flex gap-3 mt-2">
                                {['cash', 'goods'].map(t => (
                                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="type" value={t} checked={data.type === t}
                                            onChange={() => setData('type', t)} className="text-primary" />
                                        <span className="text-sm font-medium capitalize">{t}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {data.type === 'cash' && (
                            <div>
                                <InputLabel htmlFor="amount" value="Amount (PHP) *" />
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₱</span>
                                    <TextInput
                                        id="amount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={data.amount_cents ? (data.amount_cents / 100).toString() : ''}
                                        onChange={e => setData('amount_cents', Math.round(parseFloat(e.target.value || 0) * 100))}
                                        className="pl-7 block w-full"
                                        placeholder="0.00"
                                    />
                                </div>
                                <InputError message={errors.amount_cents} />
                            </div>
                        )}

                        {data.type === 'goods' && (
                            <fieldset className="space-y-3">
                                <legend className="block text-sm font-medium text-foreground">Items *</legend>
                                {data.items.map((item, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-start border border-border/60 rounded-lg p-2">
                                        <div className="col-span-12 sm:col-span-4">
                                            <label className="sr-only" htmlFor={`item-name-${i}`}>Item name</label>
                                            <TextInput id={`item-name-${i}`} value={item.name} placeholder="e.g. Rice"
                                                onChange={e => setItem(i, 'name', e.target.value)} className="block w-full text-sm" />
                                            <InputError message={errors[`items.${i}.name`]} />
                                        </div>
                                        <div className="col-span-6 sm:col-span-3">
                                            <label className="sr-only" htmlFor={`item-category-${i}`}>Category</label>
                                            <select id={`item-category-${i}`} value={item.category} onChange={e => setItem(i, 'category', e.target.value)}
                                                className="block w-full border-input rounded-md shadow-sm text-sm">
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3 sm:col-span-2">
                                            <label className="sr-only" htmlFor={`item-qty-${i}`}>Quantity</label>
                                            <TextInput id={`item-qty-${i}`} type="number" min="1" value={item.quantity}
                                                onChange={e => setItem(i, 'quantity', e.target.value)} className="block w-full text-sm" />
                                            <InputError message={errors[`items.${i}.quantity`]} />
                                        </div>
                                        <div className="col-span-3 sm:col-span-2">
                                            <label className="sr-only" htmlFor={`item-unit-${i}`}>Unit</label>
                                            <select id={`item-unit-${i}`} value={item.unit} onChange={e => setItem(i, 'unit', e.target.value)}
                                                className="block w-full border-input rounded-md shadow-sm text-sm">
                                                {units.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-12 sm:col-span-1 flex justify-end">
                                            {data.items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(i)}
                                                    className="text-sm text-status-rejected hover:underline py-2" aria-label={`Remove item ${i + 1}`}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addItem} className="text-sm text-primary hover:underline">+ Add another item</button>
                                <InputError message={errors.items} />
                            </fieldset>
                        )}

                        <fieldset>
                            <legend className="block text-sm font-medium text-foreground">Delivery Method</legend>
                            <div className="flex gap-3 mt-2">
                                {[['deliver', 'I will deliver'], ['pickup', 'Please pick up']].map(([m, label]) => (
                                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="delivery_method" value={m} checked={data.delivery_method === m}
                                            onChange={() => setData('delivery_method', m)} className="text-primary" />
                                        <span className="text-sm font-medium">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div>
                            <InputLabel htmlFor="scheduled_at" value="Schedule Date (optional)" />
                            <TextInput id="scheduled_at" type="datetime-local" value={data.scheduled_at}
                                onChange={e => setData('scheduled_at', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.scheduled_at} />
                        </div>

                        <div className="bg-primary/10 rounded-lg p-4 text-sm text-primary">
                            {data.type === 'cash'
                                ? 'You will be redirected to our secure payment gateway (GCash, Maya or card) to complete your donation.'
                                : 'The barangay will confirm the goods when they arrive; you can then follow them all the way to the households that receive them.'}
                        </div>

                        <FormActions>
                            <CancelLink href="/donations" />
                            <PrimaryButton disabled={processing} className="bg-cta text-cta-foreground hover:bg-cta/90 active:bg-cta/80">
                                {processing ? 'Processing…' : data.type === 'cash' ? 'Proceed to Payment' : 'Submit Donation'}
                            </PrimaryButton>
                        </FormActions>
                    </form>
                </div>
                {!modal && needsPanel}
            </div>
        </AppLayout>
    );
}
