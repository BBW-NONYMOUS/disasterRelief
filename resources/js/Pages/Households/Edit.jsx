import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function EditHousehold({ household, statuses = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
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
        <AppLayout description="Update this household's details." header={<h1 className="text-lg font-semibold text-foreground">Edit: {household.head_name}</h1>}>
            <Head title="Edit Household" />
            <FormShell width="lg">
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="head_name" value="Head of Household" />
                        <TextInput id="head_name" value={data.head_name} onChange={e => setData('head_name', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.head_name} />
                    </div>
                    <div>
                        <InputLabel htmlFor="address" value="Address" />
                        <textarea id="address" value={data.address} onChange={e => setData('address', e.target.value)}
                            rows={2} className="mt-1 block w-full border-input rounded-md shadow-sm text-sm" />
                    </div>
                    <div>
                        <InputLabel htmlFor="members_count" value="Number of Members" />
                        <TextInput id="members_count" type="number" min="1" value={data.members_count}
                            onChange={e => setData('members_count', e.target.value)} className="mt-1 block w-full" />
                    </div>
                    <div>
                        <InputLabel htmlFor="status" value="Assistance Status" />
                        <select id="status" value={data.status} onChange={e => setData('status', e.target.value)}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                            {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <InputError message={errors.status} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.priority_flag}
                            onChange={e => setData('priority_flag', e.target.checked)}
                            className="rounded border-input text-primary" />
                        <span className="text-sm font-medium text-foreground">Priority Household</span>
                    </label>
                    <FormActions>
                        <CancelLink href="/households" />
                        <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
