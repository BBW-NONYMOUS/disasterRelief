import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin: 'Community Administrator',
    purok_president: 'Purok President',
    resident: 'Resident',
    donor: 'Donor',
};

export default function EditUser({ userRecord, roles = [], barangays = [], puroks = [], is_self = false }) {
    // The current role stays selectable even if this editor may not assign it.
    const roleOptions = roles.some(r => r.value === userRecord.role)
        ? roles
        : [{ value: userRecord.role, label: ROLE_LABELS[userRecord.role] ?? userRecord.role }, ...roles];

    const { data, setData, patch, processing, errors } = useForm({
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        phone: userRecord.phone ?? '',
        barangay_id: userRecord.barangay_id ?? '',
        purok_id: userRecord.purok_id ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/users/${userRecord.id}`);
    };

    const filteredPuroks = data.barangay_id ? puroks.filter(p => p.barangay_id == data.barangay_id) : puroks;

    return (
        <AppLayout description="Update this account's details and role." header={<h1 className="text-lg font-semibold text-foreground">Edit: {userRecord.name}</h1>}>
            <Head title="Edit User" />
            <FormShell width="lg">
                {userRecord.status !== 'active' && (
                    <div className="mb-5 bg-status-rejected/10 border border-status-rejected/30 rounded-lg p-3 text-sm text-status-rejected">
                        This account's access is restricted{userRecord.suspension_reason ? `: ${userRecord.suspension_reason}` : '.'}{' '}
                        Only the Super Admin can restore it from User Management.
                    </div>
                )}
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="name" value="Full Name" />
                        <TextInput id="name" value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.email} />
                    </div>
                    <div>
                        <InputLabel htmlFor="role" value="Role" />
                        <select id="role" value={data.role} onChange={e => setData('role', e.target.value)}
                            disabled={is_self}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm disabled:bg-muted/50 disabled:text-muted-foreground">
                            {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        {is_self && <p className="text-xs text-muted-foreground mt-1">You cannot change your own role.</p>}
                        <InputError message={errors.role} />
                    </div>
                    <div>
                        <InputLabel htmlFor="phone" value="Phone" />
                        <TextInput id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} className="mt-1 block w-full" />
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
                        <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
