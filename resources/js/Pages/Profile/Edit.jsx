import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || '?';
}

function ProfileSummary({ user }) {
    const details = [
        ['Mobile number', user.phone || 'Not set'],
        ['SMS alerts', user.prefers_sms ? 'On' : 'Off'],
        ['Account', user.status === 'active' ? 'Active' : 'Restricted'],
    ];

    return (
        <Card className="lg:sticky lg:top-20">
            <CardContent className="flex flex-col items-center p-6 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {initials(user.name)}
                </span>
                <h2 className="mt-3 max-w-full truncate text-lg font-semibold text-foreground">{user.name}</h2>
                <p className="max-w-full truncate text-sm text-muted-foreground">{user.email}</p>
                <span className="mt-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {user.role_label}
                </span>

                <dl className="mt-5 w-full divide-y divide-border border-t text-sm">
                    {details.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3 py-2.5">
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="truncate font-medium text-foreground">{value}</dd>
                        </div>
                    ))}
                </dl>
            </CardContent>
        </Card>
    );
}

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Profile</h1>}>
            <Head title="Profile" />

            <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <ProfileSummary user={user} />

                <div className="min-w-0 space-y-6">
                    <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                    <UpdatePasswordForm />
                    <DeleteUserForm />
                </div>
            </div>
        </AppLayout>
    );
}
