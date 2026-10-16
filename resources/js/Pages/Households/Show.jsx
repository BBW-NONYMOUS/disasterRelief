import AppLayout from '@/Layouts/AppLayout';
import ModalLink from '@/Components/ModalLink';
import { Head, Link, router } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import VerifiedBadge, { HOUSEHOLD_STATUS_LABELS } from '@/Components/VerifiedBadge';

export default function ShowHousehold({ household, can = {} }) {
    const verify = () => {
        if (confirm(`Confirm that you have checked ${household.head_name}'s household on the ground?`)) {
            router.post(`/households/${household.id}/verify`, {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout header={
            <div className="flex items-center gap-2">
                <Link href="/households" className="text-muted-foreground hover:text-foreground">Households</Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground">{household.head_name}</span>
            </div>
        }>
            <Head title={household.head_name} />

            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{household.head_name}</h2>
                            <p className="text-sm text-muted-foreground">{household.address}</p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            {household.priority_flag && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">⚡ Priority</span>}
                            <StatusBadge status={household.status} label={HOUSEHOLD_STATUS_LABELS[household.status]} />
                            <VerifiedBadge household={household} />
                        </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-muted-foreground">Members</dt>
                            <dd className="font-medium text-foreground">{household.members_count}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Purok</dt>
                            <dd className="font-medium text-foreground">{household.purok?.name}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Barangay</dt>
                            <dd className="font-medium text-foreground">{household.purok?.barangay?.name}</dd>
                        </div>
                        {household.verified_at && (
                            <div>
                                <dt className="text-muted-foreground">Verified</dt>
                                <dd className="font-medium text-foreground">
                                    {new Date(household.verified_at).toLocaleDateString()}{household.verifier ? ` by ${household.verifier.name}` : ''}
                                </dd>
                            </div>
                        )}
                    </dl>
                    <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-3">
                        {can.verify && (
                            <button onClick={verify} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                                Verify Household
                            </button>
                        )}
                        {can.update && (
                            <ModalLink href={`/households/${household.id}/edit`} className="text-primary hover:underline text-sm">Edit Household</ModalLink>
                        )}
                    </div>
                </div>

                {household.distributions?.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-3">Distribution History</h3>
                        {household.distributions.map(d => (
                            <Link key={d.id} href={`/distributions/${d.id}`}
                                className="flex justify-between gap-3 py-2 border-b border-border/60 last:border-0 text-sm hover:text-primary">
                                <span>{d.items}</span>
                                <StatusBadge status={d.status} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
