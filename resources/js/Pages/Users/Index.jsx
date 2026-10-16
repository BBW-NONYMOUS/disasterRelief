import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import StatusFilter from '@/Components/StatusFilter';
import useModuleAccess from '@/Hooks/useModuleAccess';

function RestrictModal({ user, onClose }) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setBusy(true);
        router.post(`/users/${user.id}/restrict`, { reason }, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: (errors) => setError(errors.reason ?? Object.values(errors)[0]),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <Modal show={!!user} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Restrict access</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        <strong>{user?.name}</strong> will be signed out immediately and will not be able to log in until you restore access.
                    </p>
                </div>
                <div>
                    <label htmlFor="restrict-reason" className="block text-sm font-medium text-foreground">Reason *</label>
                    <textarea id="restrict-reason" rows={3} value={reason} onChange={e => setReason(e.target.value)} autoFocus
                        placeholder="e.g. Reported false incidents repeatedly; under review by the barangay."
                        className="mt-1 block w-full border-input rounded-md shadow-sm text-sm" />
                    {error && <p className="text-sm text-status-rejected mt-1">{error}</p>}
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-input rounded-lg text-sm text-foreground hover:bg-accent">Cancel</button>
                    <button type="submit" disabled={busy} className="px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:bg-destructive/90 disabled:opacity-50">
                        {busy ? 'Restricting…' : 'Restrict access'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function UsersIndex({ users, roles = [], restricted_count = 0, filters = {}, can_restrict = false }) {
    const { auth } = usePage().props;
    const { canManage } = useModuleAccess('users');
    const [restricting, setRestricting] = useState(null);
    const roleLabel = Object.fromEntries(roles.map(r => [r.value, r.label]));

    const restore = (u) => {
        if (confirm(`Restore ${u.name}'s access to ReliefNet?`)) {
            router.post(`/users/${u.id}/restore`, {}, { preserveScroll: true });
        }
    };

    const showRestricted = () => router.get('/users', filters.access === 'restricted' ? {} : { access: 'restricted' }, { preserveState: true });

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">User Management</h1>}>
            <Head title="Users" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{users.total} users</p>
                    {canManage && (
                        <ModalLink href="/users/create"
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
                            + Add User
                        </ModalLink>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusFilter statuses={roles} current={filters.role} path="/users" param="role" allLabel="All roles" />
                    <button type="button" onClick={showRestricted}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                            ${filters.access === 'restricted' ? 'bg-destructive text-white border-red-600' : 'bg-card text-status-rejected border-status-rejected/30 hover:bg-status-rejected/10'}`}>
                        Restricted ({restricted_count})
                    </button>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Barangay</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Access</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {users.data.length === 0 && (
                                <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No users match this filter.</td></tr>
                            )}
                            {users.data.map(u => {
                                const isRestricted = u.status !== 'active';
                                return (
                                    <tr key={u.id} className={isRestricted ? 'bg-status-rejected/10/40' : 'hover:bg-accent'}>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            <Link href={`/users/${u.id}`} className="hover:text-primary">{u.name}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                                                {roleLabel[u.role] ?? u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{u.barangay?.name ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            {isRestricted ? (
                                                <span title={u.suspension_reason ?? undefined}>
                                                    <StatusBadge status="rejected" label="Restricted" />
                                                </span>
                                            ) : (
                                                <StatusBadge status="active" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-3 justify-end whitespace-nowrap">
                                                {canManage && <ModalLink href={`/users/${u.id}/edit`} className="text-primary hover:underline">Edit</ModalLink>}
                                                {can_restrict && u.id !== auth?.user?.id && (
                                                    isRestricted ? (
                                                        <button onClick={() => restore(u)} className="text-status-completed hover:underline">Restore access</button>
                                                    ) : (
                                                        <button onClick={() => setRestricting(u)} className="text-status-rejected hover:underline">Restrict access</button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination paginator={users} />
            </div>

            {restricting && <RestrictModal user={restricting} onClose={() => setRestricting(null)} />}
        </AppLayout>
    );
}
