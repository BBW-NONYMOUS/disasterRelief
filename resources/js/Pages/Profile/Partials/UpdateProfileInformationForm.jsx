import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            prefers_sms: user.prefers_sms ?? false,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), { preserveScroll: true });
    };

    return (
        <Card className={className}>
            <form onSubmit={submit}>
                <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                    <CardDescription>
                        Update your name, email address and how ReliefNet can reach you.
                    </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Mobile Number" />
                        <TextInput
                            id="phone"
                            type="tel"
                            className="mt-1 block w-full"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="09XXXXXXXXX"
                            autoComplete="tel"
                        />
                        <InputError className="mt-2" message={errors.phone} />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                            <span>
                                <span className="block text-sm font-medium text-foreground">Text me disaster alerts (SMS)</span>
                                <span className="block text-xs text-muted-foreground">
                                    For when you have no mobile data. Needs a mobile number.
                                </span>
                            </span>
                            <input
                                type="checkbox"
                                checked={data.prefers_sms}
                                disabled={!data.phone}
                                onChange={(e) => setData('prefers_sms', e.target.checked)}
                                className="mt-0.5 h-5 w-5 shrink-0 rounded border-input bg-card text-primary shadow-sm focus:ring-primary"
                            />
                        </label>
                        <InputError className="mt-2" message={errors.prefers_sms} />
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div className="sm:col-span-2 rounded-lg bg-status-ongoing/10 p-3 text-sm text-foreground">
                            Your email address is unverified.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md underline hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                Re-send the verification email.
                            </Link>

                            {status === 'verification-link-sent' && (
                                <p className="mt-2 font-medium text-status-completed">
                                    A new verification link has been sent to your email address.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="justify-end gap-3 border-t pt-5">
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-muted-foreground">Saved.</p>
                    </Transition>
                    <PrimaryButton disabled={processing}>Save changes</PrimaryButton>
                </CardFooter>
            </form>
        </Card>
    );
}
