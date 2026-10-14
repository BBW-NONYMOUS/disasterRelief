import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'resident',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Full Name" />
                    <TextInput id="name" name="name" value={data.name} className="mt-1 block w-full"
                        autoComplete="name" isFocused onChange={e => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput id="email" type="email" name="email" value={data.email}
                        className="mt-1 block w-full" onChange={e => setData('email', e.target.value)} required />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="phone" value="Phone Number (optional)" />
                    <TextInput id="phone" name="phone" value={data.phone}
                        className="mt-1 block w-full" placeholder="09XXXXXXXXX"
                        onChange={e => setData('phone', e.target.value)} />
                    <InputError message={errors.phone} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="role" value="I am a..." />
                    <div className="flex gap-4 mt-2">
                        {[
                            { value: 'resident', label: 'Resident', desc: 'Report disasters & request assistance' },
                            { value: 'donor', label: 'Donor', desc: 'Donate relief goods or funds' },
                        ].map(opt => (
                            <label key={opt.value} className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition-colors
                                ${data.role === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="role" value={opt.value} checked={data.role === opt.value}
                                    onChange={() => setData('role', opt.value)} className="sr-only" />
                                <div className="font-medium text-gray-800 text-sm">{opt.label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                            </label>
                        ))}
                    </div>
                    <InputError message={errors.role} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput id="password" type="password" name="password" value={data.password}
                        className="mt-1 block w-full" autoComplete="new-password"
                        onChange={e => setData('password', e.target.value)} required />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                    <TextInput id="password_confirmation" type="password" name="password_confirmation"
                        value={data.password_confirmation} className="mt-1 block w-full" autoComplete="new-password"
                        onChange={e => setData('password_confirmation', e.target.value)} required />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900">
                        Already registered?
                    </Link>
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {processing ? 'Creating account…' : 'Register'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
