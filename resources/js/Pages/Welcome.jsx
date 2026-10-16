import { Head, Link } from '@inertiajs/react';

const FEATURES = [
    {
        icon: '📢',
        title: 'Report Disasters',
        desc: 'Residents can instantly report floods, fires, typhoons and other incidents with photos and location details.',
    },
    {
        icon: '🤝',
        title: 'Request Assistance',
        desc: 'Affected households can request relief goods and be matched with available inventory and donors.',
    },
    {
        icon: '💝',
        title: 'Donate with Ease',
        desc: 'Give cash through GCash or card, or pledge relief goods — every donation is tracked end to end.',
    },
    {
        icon: '📦',
        title: 'Manage Inventory',
        desc: 'Barangay admins monitor stock levels, expiry dates and low-stock alerts in real time.',
    },
    {
        icon: '🚚',
        title: 'Track Distribution',
        desc: 'Record who received what, capture digital signatures, and keep a transparent audit trail.',
    },
    {
        icon: '📊',
        title: 'Generate Reports',
        desc: 'Produce incident, donations-received and distribution PDF reports for LGU accountability.',
    },
];

const STEPS = [
    { n: '1', title: 'Report or Donate', desc: 'Residents report incidents; donors contribute funds or goods.' },
    { n: '2', title: 'Coordinate', desc: 'Barangay officials confirm reports and organize relief inventory.' },
    { n: '3', title: 'Distribute', desc: 'Relief reaches affected households — tracked and verified.' },
];

export default function Welcome({ canLogin, canRegister, auth }) {
    return (
        <>
            <Head title="Welcome to RELIEFNET" />
            <div className="min-h-screen bg-card text-foreground">
                {/* Nav */}
                <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border/60">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white font-bold">R</span> */}
                            <span className="text-lg font-bold tracking-tight text-foreground">RELIEF<span className="text-primary">NET</span></span>
                        </div>
                        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
                            <a href="#features" className="hidden sm:inline text-muted-foreground hover:text-foreground">Features</a>
                            <a href="#how" className="hidden sm:inline text-muted-foreground hover:text-foreground">How it works</a>
                            {auth?.user ? (
                                <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Link href={route('login')} className="px-3 py-2 text-foreground hover:text-foreground font-medium">
                                            Log in
                                        </Link>
                                    )}
                                    {canRegister && (
                                        <Link href={route('register')} className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark">
                                            Get Started
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-4">
                                Disaster Monitoring & Relief Management
                            </span>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                                Helping communities <span className="text-primary">recover</span> — together.
                            </h1>
                            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
                                RELIEFNET connects residents, donors and barangay officials on one platform to report disasters,
                                coordinate relief, and make sure aid reaches every household that needs it.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {canRegister && !auth?.user && (
                                    <Link href={route('register')} className="px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-primary-dark">
                                        Get Started — it's free
                                    </Link>
                                )}
                                <a href="#features" className="px-6 py-3 rounded-lg border border-input text-foreground font-semibold hover:bg-accent">
                                    Learn more
                                </a>
                            </div>
                            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                                <div><span className="block text-2xl font-bold text-foreground">24/7</span>Incident reporting</div>
                                <div><span className="block text-2xl font-bold text-foreground">100%</span>Transparent tracking</div>
                                <div><span className="block text-2xl font-bold text-foreground">LGU</span>Ready reports</div>
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src="/images/hero-relief.svg"
                                alt="Volunteers delivering relief goods to a community after a disaster"
                                className="w-full max-w-lg mx-auto drop-shadow-xl rounded-2xl"
                            />
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-16 sm:py-24">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-3xl font-bold text-foreground">Everything relief work needs</h2>
                            <p className="mt-3 text-muted-foreground">From the first report to the last delivery, RELIEFNET keeps every step organized and accountable.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-md hover:border-primary/30 transition">
                                    <div className="text-3xl mb-3">{f.icon}</div>
                                    <h3 className="font-semibold text-lg text-foreground">{f.title}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section id="how" className="py-16 sm:py-24 bg-muted/50">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-3xl font-bold text-foreground">How it works</h2>
                            <p className="mt-3 text-muted-foreground">Three simple steps from crisis to relief.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {STEPS.map((s) => (
                                <div key={s.n} className="relative text-center">
                                    <div className="mx-auto w-14 h-14 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mb-4">
                                        {s.n}
                                    </div>
                                    <h3 className="font-semibold text-lg text-foreground">{s.title}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 sm:py-24">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-14 text-center text-white shadow-xl">
                            <h2 className="text-3xl font-bold">Ready to make a difference?</h2>
                            <p className="mt-3 text-blue-100 max-w-xl mx-auto">
                                Join RELIEFNET as a resident, donor, or barangay official and help your community stay resilient.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                {canRegister && !auth?.user && (
                                    <Link href={route('register')} className="px-6 py-3 rounded-lg bg-card text-primary font-semibold hover:bg-primary/10">
                                        Create an account
                                    </Link>
                                )}
                                {canLogin && (
                                    <Link href={auth?.user ? '/dashboard' : route('login')} className="px-6 py-3 rounded-lg border border-white/60 text-white font-semibold hover:bg-card/10">
                                        {auth?.user ? 'Go to Dashboard' : 'Log in'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border/60 py-10">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary text-white font-bold text-xs">R</span>
                            <span className="font-semibold text-foreground">RELIEFNET</span>
                        </div>
                        <p>Web-Mobile Disaster Monitoring & Relief Donation Management System</p>
                        <p>&copy; {new Date().getFullYear()} RELIEFNET</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
