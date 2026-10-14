import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';

export default function CreateDonation() {
    const { data, setData, post, processing, errors } = useForm({
        type: 'cash',
        amount_cents: '',
        items: '',
        delivery_method: 'deliver',
        scheduled_at: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/donations');
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Make a Donation</h1>}>
            <Head title="Make Donation" />

            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel value="Donation Type" />
                            <div className="flex gap-3 mt-2">
                                {['cash', 'goods'].map(t => (
                                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="type" value={t} checked={data.type === t}
                                            onChange={() => setData('type', t)} className="text-blue-600" />
                                        <span className="text-sm font-medium capitalize">{t}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {data.type === 'cash' && (
                            <div>
                                <InputLabel htmlFor="amount" value="Amount (PHP) *" />
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₱</span>
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
                            <div>
                                <InputLabel htmlFor="items" value="Items Description *" />
                                <textarea
                                    id="items"
                                    value={data.items}
                                    onChange={e => setData('items', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                    placeholder="e.g. 50 kg rice, 20 cans sardines, 10 blankets..."
                                />
                                <InputError message={errors.items} />
                            </div>
                        )}

                        <div>
                            <InputLabel value="Delivery Method" />
                            <div className="flex gap-3 mt-2">
                                {['deliver', 'pickup'].map(m => (
                                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="delivery_method" value={m} checked={data.delivery_method === m}
                                            onChange={() => setData('delivery_method', m)} className="text-blue-600" />
                                        <span className="text-sm font-medium capitalize">{m}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="scheduled_at" value="Schedule Date (optional)" />
                            <TextInput id="scheduled_at" type="datetime-local" value={data.scheduled_at}
                                onChange={e => setData('scheduled_at', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.scheduled_at} />
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                            {data.type === 'cash'
                                ? 'You will be redirected to our secure payment gateway (GCash/Card) to complete your donation.'
                                : 'Our team will contact you to coordinate the pickup or delivery of your donated goods.'}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <a href="/donations" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </a>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Processing…' : data.type === 'cash' ? 'Proceed to Payment' : 'Submit Donation'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
