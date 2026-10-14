import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
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
        barangay_id: '',
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
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Add User</h1>}>
            <Head title="Add User" />
            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
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
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                <option value="resident">Resident</option>
                                <option value="donor">Donor</option>
                                <option value="purok_president">Purok President</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
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
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                    <option value="">None</option>
                                    {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="purok_id" value="Purok" />
                                <select id="purok_id" value={data.purok_id} onChange={e => setData('purok_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                    <option value="">None</option>
                                    {filteredPuroks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/users" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</Link>
                            <PrimaryButton disabled={processing}>{processing ? 'Creating…' : 'Create User'}</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
