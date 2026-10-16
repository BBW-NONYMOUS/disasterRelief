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
        consent: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            title="Create your account"
            subtitle="Join your barangay's relief network as a resident or donor."
        >
            <Head title="Register" />

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="name" value="Full Name" />
                        <TextInput id="name" name="name" value={data.name} className="mt-1.5 block w-full"
                            autoComplete="name" isFocused onChange={e => setData('name', e.target.value)} required />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Mobile Number (optional)" />
                        <TextInput id="phone" type="tel" name="phone" value={data.phone}
                            className="mt-1.5 block w-full" placeholder="09XXXXXXXXX"
                            onChange={e => setData('phone', e.target.value)} />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput id="email" type="email" name="email" value={data.email}
                        className="mt-1.5 block w-full" placeholder="you@example.com"
                        onChange={e => setData('email', e.target.value)} required />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="role" value="I am a..." />
                    <div className="flex gap-4 mt-2">
                        {[
                            { value: 'resident', label: 'Resident', desc: 'Report disasters & request assistance' },
                            { value: 'donor', label: 'Donor', desc: 'Donate relief goods or funds' },
                        ].map(opt => (
                            <label key={opt.value} className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition-colors
                                ${data.role === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-input'}`}>
                                <input type="radio" name="role" value={opt.value} checked={data.role === opt.value}
                                    onChange={() => setData('role', opt.value)} className="sr-only" />
                                <div className="font-medium text-foreground text-sm">{opt.label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                            </label>
                        ))}
                    </div>
                    <InputError message={errors.role} className="mt-2" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput id="password" type="password" name="password" value={data.password}
                            className="mt-1.5 block w-full" autoComplete="new-password"
                            onChange={e => setData('password', e.target.value)} required />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                        <TextInput id="password_confirmation" type="password" name="password_confirmation"
                            value={data.password_confirmation} className="mt-1.5 block w-full" autoComplete="new-password"
                            onChange={e => setData('password_confirmation', e.target.value)} required />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" name="consent" checked={data.consent} required
                            onChange={e => setData('consent', e.target.checked)}
                            className="mt-0.5 rounded border-input text-primary focus:ring-primary" />
                        <span className="text-sm text-muted-foreground">
                            I have read the{' '}
                            <a href={route('privacy')} target="_blank" rel="noopener" className="text-primary underline hover:text-primary-dark">
                                Privacy Notice
                            </a>{' '}
                            and consent to ReliefNet collecting and processing my personal data for disaster response,
                            as provided by the Data Privacy Act of 2012 (RA 10173).
                        </span>
                    </label>
                    <InputError message={errors.consent} className="mt-2" />
                </div>

                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Creating account…' : 'Create account'}
                </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href={route('login')} className="font-medium text-primary hover:underline">
                    Sign in
                </Link>
            </p>
        </GuestLayout>
    );
}
