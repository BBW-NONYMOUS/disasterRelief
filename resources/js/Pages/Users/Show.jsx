import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import useModuleAccess from '@/Hooks/useModuleAccess';

export default function ShowUser({ userRecord, can_restrict = false }) {
    const isRestricted = userRecord.status !== 'active';
    const { canManage } = useModuleAccess('users');

    const restore = () => {
        if (confirm(`Restore ${userRecord.name}'s access to ReliefNet?`)) {
            router.post(`/users/${userRecord.id}/restore`, {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">User: {userRecord.name}</h1>}>
            <Head title={userRecord.name} />
            <div className="max-w-lg mx-auto space-y-4">
                {isRestricted && (
                    <div className="bg-status-rejected/10 border border-status-rejected/30 rounded-xl p-4 text-sm text-status-rejected space-y-1">
                        <p className="font-semibold">Access restricted</p>
                        {userRecord.suspended_at && (
                            <p>
                                Since {new Date(userRecord.suspended_at).toLocaleString()}
                                {userRecord.suspender ? ` by ${userRecord.suspender.name}` : ''}
                            </p>
                        )}
                        {userRecord.suspension_reason && <p>Reason: {userRecord.suspension_reason}</p>}
                        {can_restrict && (
                            <button onClick={restore} className="mt-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">
                                Restore access
                            </button>
                        )}
                    </div>
                )}

                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">{userRecord.name}</h2>
                        {isRestricted ? <StatusBadge status="rejected" label="Restricted" /> : <StatusBadge status="active" />}
                    </div>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{userRecord.email}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Role</dt><dd className="font-medium capitalize">{userRecord.role?.replace(/_/g, ' ')}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{userRecord.phone ?? '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Barangay</dt><dd className="font-medium">{userRecord.barangay?.name ?? '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Purok</dt><dd className="font-medium">{userRecord.purok?.name ?? '—'}</dd></div>
                        {userRecord.consented_at && (
                            <div className="flex justify-between"><dt className="text-muted-foreground">Privacy consent</dt><dd className="font-medium">{new Date(userRecord.consented_at).toLocaleDateString()}</dd></div>
                        )}
                    </dl>
                    <div className="mt-4 pt-4 border-t border-border/60 flex gap-3">
                        {canManage && <ModalLink href={`/users/${userRecord.id}/edit`} className="text-primary hover:underline text-sm">Edit</ModalLink>}
                        <Link href="/users" className="text-muted-foreground hover:underline text-sm">← Back</Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
