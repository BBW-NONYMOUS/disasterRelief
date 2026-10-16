import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { HeartHandshake, MapPin, ShieldCheck } from 'lucide-react';

const TRUST_POINTS = [
    {
        icon: MapPin,
        title: 'Live disaster map',
        desc: 'Incidents verified by your purok and barangay, updated in real time.',
    },
    {
        icon: HeartHandshake,
        title: 'Relief you can trace',
        desc: 'Every donation is tracked from pledge to the receiving household.',
    },
    {
        icon: ShieldCheck,
        title: 'Your data, protected',
        desc: 'Handled under the Data Privacy Act of 2012 (RA 10173).',
    },
];

/**
 * Split-screen auth shell: brand panel (desktop) + form column.
 * Pages may pass a title/subtitle; plain children keep working.
 */
export default function GuestLayout({ children, title, subtitle }) {
    return (
        <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
            {/* Brand panel */}
            <aside
                className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between"
                style={{
                    backgroundImage: 'url(/images/auth-texture.webp)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#0D47A1',
                }}
            >
                <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
                    <Link href="/" className="flex w-fit items-center gap-3">
                        <ApplicationLogo className="h-11 w-11" />
                        <span className="text-xl font-bold tracking-tight">ReliefNet</span>
                    </Link>

                    <div className="max-w-md">
                        <h2 className="text-3xl font-bold leading-tight xl:text-4xl" style={{ textWrap: 'balance' }}>
                            Relief that reaches.
                            <br />
                            Aid you can trace.
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-blue-100">
                            Barangay-led disaster reporting, donations and distribution —
                            transparent from the first report to the last signature.
                        </p>

                        <ul className="mt-8 space-y-5">
                            {TRUST_POINTS.map(({ icon: Icon, title: t, desc }) => (
                                <li key={t} className="flex items-start gap-3.5">
                                    <span className="mt-0.5 rounded-lg bg-white/10 p-2">
                                        <Icon className="h-5 w-5 text-[#FFB74D]" aria-hidden="true" />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold">{t}</span>
                                        <span className="block text-xs leading-relaxed text-blue-200">{desc}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <img
                        src="/images/auth-illustration.svg"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none -mx-4 -mb-6 w-[calc(100%+2rem)] max-w-none opacity-95"
                    />
                </div>
            </aside>

            {/* Form column */}
            <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    {/* Compact brand header (mobile + context on desktop) */}
                    <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
                        <ApplicationLogo className="h-10 w-10" />
                        <span className="text-lg font-bold tracking-tight text-foreground">ReliefNet</span>
                    </Link>

                    {(title || subtitle) && (
                        <header className="mb-7">
                            {title && <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>}
                            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
                        </header>
                    )}

                    <div className="rounded-lg border bg-card p-6 text-card-foreground sm:p-8">
                        {children}
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        ReliefNet · Barangay disaster relief, accounted for.
                    </p>
                </div>
            </div>
        </div>
    );
}
