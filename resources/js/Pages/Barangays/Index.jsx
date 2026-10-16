import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/Modal';
import ModalLink from '@/Components/ModalLink';
import StatusBadge from '@/Components/StatusBadge';
import { Button, buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle, ArrowRight, Building2, House, LandPlot, LayoutGrid, List, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, UserRound, Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const number = (value) => (value == null || value === '' ? null : Number(value).toLocaleString('en-PH'));

/** "Municipality of Bagumbayan, Sultan Kudarat" → "Bagumbayan" for compact filter chips. */
const shortLgu = (lgu) => lgu.replace(/^(Municipality|City) of /i, '').replace(/,.*$/, '').replace(/ LGU$/i, '');

function SummaryTile({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="truncate text-xl font-bold leading-tight text-foreground">{value}</p>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value, className }) {
    return (
        <div className={cn('flex min-w-0 gap-2.5', className)}>
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className={cn('truncate text-sm', value ? 'font-medium text-foreground' : 'italic text-muted-foreground')}>
                    {value || 'Not set'}
                </dd>
            </div>
        </div>
    );
}

function CoverImage({ barangay }) {
    if (barangay.image_url) {
        return (
            <img
                src={barangay.image_url}
                alt={`${barangay.name} barangay`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
        );
    }

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary">
            <Building2 className="size-10" aria-hidden="true" />
            <span className="text-xs font-medium text-primary/80">No photo yet</span>
        </div>
    );
}

function BarangayCard({ barangay: b, onDelete }) {
    const admins = b.users ?? [];

    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <CoverImage barangay={b} />
                <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 font-mono text-xs text-white backdrop-blur-sm">
                    {b.code}
                </span>
                {admins.length === 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-status-ongoing px-2 py-0.5 text-xs font-medium text-white">
                        <AlertTriangle className="size-3" aria-hidden="true" /> No admin
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold leading-tight text-foreground">{b.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{b.lgu_name}</span>
                    </p>
                    {b.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>}
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoItem icon={UserRound} label="Punong Barangay" value={b.captain_name} />
                    <InfoItem icon={Phone} label="Hotline" value={b.contact_number} />
                    <InfoItem icon={Users} label="Population" value={number(b.population)} />
                    <InfoItem icon={LandPlot} label="Land area" value={b.land_area_km2 ? `${number(b.land_area_km2)} km²` : null} />
                    {b.hall_address && <InfoItem icon={House} label="Barangay hall" value={b.hall_address} className="col-span-2" />}
                    {b.email && <InfoItem icon={Mail} label="Email" value={b.email} className="col-span-2" />}
                </dl>

                <dl className="grid grid-cols-3 divide-x rounded-lg bg-muted/50 py-2.5 text-center">
                    {[['Puroks', b.puroks_count], ['Households', b.households_count], ['Reports', b.disaster_reports_count]].map(([label, value]) => (
                        <div key={label} className="flex flex-col-reverse">
                            <dt className="text-xs text-muted-foreground">{label}</dt>
                            <dd className="text-base font-semibold text-foreground">{value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="mt-auto">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Administrators</p>
                    {admins.length ? (
                        <ul className="space-y-1.5">
                            {admins.map(u => (
                                <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                                    <ModalLink href={`/users/${u.id}/edit`} className="flex min-w-0 items-center gap-2 text-foreground hover:text-primary">
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                            {u.name.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                                        </span>
                                        <span className="truncate">{u.name}</span>
                                    </ModalLink>
                                    <StatusBadge status={u.status} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-status-ongoing">
                            No administrator assigned.{' '}
                            <ModalLink href="/users/create" className="font-medium underline">Add one</ModalLink>
                        </p>
                    )}
                </div>
            </div>

            <footer className="flex items-center justify-between gap-2 border-t px-5 py-3">
                <Link href={`/puroks?barangay_id=${b.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Manage puroks <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <div className="flex items-center gap-1">
                    <ModalLink href={`/barangays/${b.id}/edit`} size="2xl" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        <Pencil aria-hidden="true" /> Edit
                    </ModalLink>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(b)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${b.name}`}>
                        <Trash2 aria-hidden="true" />
                    </Button>
                </div>
            </footer>
        </article>
    );
}

function BarangayTable({ barangays, onDelete }) {
    return (
        <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[56rem] text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3 font-medium">Barangay</th>
                        <th className="px-4 py-3 font-medium">Punong Barangay</th>
                        <th className="px-4 py-3 font-medium">Hotline</th>
                        <th className="px-4 py-3 text-right font-medium">Population</th>
                        <th className="px-4 py-3 text-right font-medium">Puroks</th>
                        <th className="px-4 py-3 text-right font-medium">Households</th>
                        <th className="px-4 py-3 font-medium">Administrator</th>
                        <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {barangays.map(b => (
                        <tr key={b.id} className="hover:bg-muted/40">
                            <td className="px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                        {b.image_url
                                            ? <img src={b.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                                            : <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary"><Building2 className="size-4" aria-hidden="true" /></div>}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-foreground">{b.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">{shortLgu(b.lgu_name)} · <span className="font-mono">{b.code}</span></p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-2.5">{b.captain_name || <span className="italic text-muted-foreground">Not set</span>}</td>
                            <td className="px-4 py-2.5">{b.contact_number || <span className="italic text-muted-foreground">Not set</span>}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{number(b.population) ?? '—'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{b.puroks_count}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{b.households_count}</td>
                            <td className="px-4 py-2.5">
                                {b.users?.length
                                    ? <span className="truncate">{b.users.map(u => u.name).join(', ')}</span>
                                    : <span className="inline-flex items-center gap-1 text-xs font-medium text-status-ongoing"><AlertTriangle className="size-3" aria-hidden="true" /> None</span>}
                            </td>
                            <td className="px-4 py-2.5">
                                <div className="flex justify-end gap-1">
                                    <ModalLink href={`/barangays/${b.id}/edit`} size="2xl" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                        <Pencil aria-hidden="true" /> Edit
                                    </ModalLink>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(b)}
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${b.name}`}>
                                        <Trash2 aria-hidden="true" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const VIEW_KEY = 'reliefnet.barangays.view';

function savedView() {
    try {
        return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards';
    } catch {
        return 'cards';
    }
}

function DeleteDialog({ barangay, onClose }) {
    const [busy, setBusy] = useState(false);

    const confirm = () => {
        setBusy(true);
        router.delete(`/barangays/${barangay.id}`, {
            preserveScroll: true,
            onFinish: () => { setBusy(false); onClose(); },
        });
    };

    return (
        <Modal show={!!barangay} onClose={onClose} maxWidth="md" title="Delete barangay">
            <div className="space-y-4 p-6">
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold leading-none text-foreground">Delete {barangay?.name}?</h2>
                    <p className="text-sm text-muted-foreground">
                        This only works for a barangay with no puroks, users, reports or inventory. Its photo is removed too.
                    </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="button" variant="destructive" onClick={confirm} disabled={busy}>
                        {busy ? 'Deleting…' : 'Delete barangay'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default function BarangaysIndex({ barangays = [] }) {
    const [query, setQuery] = useState('');
    const [lgu, setLgu] = useState('all');
    const [deleting, setDeleting] = useState(null);
    const [view, setView] = useState(savedView);

    const changeView = (next) => {
        setView(next);
        try { localStorage.setItem(VIEW_KEY, next); } catch { /* private mode: keep it for this visit only */ }
    };

    const lgus = useMemo(() => [...new Set(barangays.map(b => b.lgu_name))].sort(), [barangays]);

    const visible = barangays.filter(b => {
        const q = query.trim().toLowerCase();
        const matchesQuery = !q || [b.name, b.code, b.lgu_name, b.captain_name].some(v => v?.toLowerCase().includes(q));
        return matchesQuery && (lgu === 'all' || b.lgu_name === lgu);
    });

    const population = visible.reduce((sum, b) => sum + (b.population ?? 0), 0);
    const households = visible.reduce((sum, b) => sum + (b.households_count ?? 0), 0);
    const reports = visible.reduce((sum, b) => sum + (b.disaster_reports_count ?? 0), 0);

    const chip = (active) => cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
    );

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Barangays</h1>}>
            <Head title="Barangays" />

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <SummaryTile icon={Building2} label="Barangays" value={number(visible.length)} />
                    <SummaryTile icon={Users} label="Population on record" value={number(population)} />
                    <SummaryTile icon={House} label="Registered households" value={number(households)} />
                    <SummaryTile icon={AlertTriangle} label="Disaster reports" value={number(reports)} />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search name, code or captain…"
                            aria-label="Search barangays"
                            className="h-10 w-full rounded-md border-input bg-card pl-9 text-sm shadow-sm focus:border-primary focus:ring-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-md border bg-card p-0.5" role="group" aria-label="View">
                            {[['cards', LayoutGrid, 'Cards'], ['list', List, 'List']].map(([value, Icon, label]) => (
                                <button key={value} type="button" onClick={() => changeView(value)} aria-pressed={view === value}
                                    className={cn('inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors',
                                        view === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                                    <Icon className="size-4" aria-hidden="true" /> {label}
                                </button>
                            ))}
                        </div>
                        <ModalLink href="/barangays/create" size="2xl" className={cn(buttonVariants(), 'ml-auto sm:ml-0')}>
                            <Plus aria-hidden="true" /> Add Barangay
                        </ModalLink>
                    </div>
                </div>

                {lgus.length > 1 && (
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by municipality">
                        <button type="button" onClick={() => setLgu('all')} className={chip(lgu === 'all')}>
                            All ({barangays.length})
                        </button>
                        {lgus.map(name => (
                            <button key={name} type="button" onClick={() => setLgu(name)} className={chip(lgu === name)} title={name}>
                                {shortLgu(name)} ({barangays.filter(b => b.lgu_name === name).length})
                            </button>
                        ))}
                    </div>
                )}

                {visible.length > 0 && view === 'list' && <BarangayTable barangays={visible} onDelete={setDeleting} />}

                {visible.length > 0 && view === 'cards' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {visible.map(b => <BarangayCard key={b.id} barangay={b} onDelete={setDeleting} />)}
                    </div>
                )}

                {visible.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
                        <Building2 className="size-10 text-muted-foreground" aria-hidden="true" />
                        <div>
                            <p className="font-medium text-foreground">{barangays.length ? 'No barangays match your search' : 'No barangays yet'}</p>
                            <p className="text-sm text-muted-foreground">
                                {barangays.length ? 'Try another name, code or municipality.' : 'Add the first barangay to start managing relief operations.'}
                            </p>
                        </div>
                        {barangays.length > 0 && (
                            <Button type="button" variant="outline" onClick={() => { setQuery(''); setLgu('all'); }}>Clear filters</Button>
                        )}
                    </div>
                )}
            </div>

            <DeleteDialog barangay={deleting} onClose={() => setDeleting(null)} />
        </AppLayout>
    );
}
