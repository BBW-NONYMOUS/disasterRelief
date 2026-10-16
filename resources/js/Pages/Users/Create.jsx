import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateUser({ roles = [], barangays = [], puroks = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'resident',
        phone: '',
        barangay_id: barangays.length === 1 ? barangays[0].id : '',
        purok_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/users');
    };

    const filteredPuroks = data.barangay_id
        ? puroks.filter(p => p.barangay_id == data.barangay_id)
        : puroks;

    return (
        <AppLayout description="Create an account and choose its role." header={<h1 className="text-lg font-semibold text-foreground">Add User</h1>}>
            <Head title="Add User" />
            <FormShell width="lg">
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="name" value="Full Name *" />
                        <TextInput id="name" value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <InputLabel htmlFor="email" value="Email *" />
                        <TextInput id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.email} />
                    </div>
                    <div>
                        <InputLabel htmlFor="password" value="Password *" />
                        <TextInput id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.password} />
                    </div>
                    <div>
                        <InputLabel htmlFor="role" value="Role *" />
                        <select id="role" value={data.role} onChange={e => setData('role', e.target.value)}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <InputError message={errors.role} />
                    </div>
                    <div>
                        <InputLabel htmlFor="phone" value="Phone" />
                        <TextInput id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} className="mt-1 block w-full" placeholder="09XXXXXXXXX" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="barangay_id" value="Barangay" />
                            <select id="barangay_id" value={data.barangay_id}
                                onChange={e => { setData('barangay_id', e.target.value); setData('purok_id', ''); }}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                <option value="">None</option>
                                {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="purok_id" value="Purok" />
                            <select id="purok_id" value={data.purok_id} onChange={e => setData('purok_id', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                <option value="">None</option>
                                {filteredPuroks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <InputError message={errors.purok_id} />
                        </div>
                    </div>
                    <FormActions>
                        <CancelLink href="/users" />
                        <PrimaryButton disabled={processing}>{processing ? 'Creating…' : 'Create User'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
