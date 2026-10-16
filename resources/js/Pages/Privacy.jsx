import { Head, Link } from '@inertiajs/react';

function Section({ title, children }) {
    return (
        <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <div className="text-sm text-foreground leading-relaxed space-y-2">{children}</div>
        </section>
    );
}

export default function Privacy() {
    return (
        <div className="min-h-screen bg-muted/50">
            <Head title="Privacy Notice" />
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-card rounded-xl border border-border p-6 sm:p-8 space-y-6">
                    <header>
                        <p className="text-sm font-medium text-primary">ReliefNet</p>
                        <h1 className="text-2xl font-bold text-foreground">Privacy Notice</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Issued in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.
                        </p>
                    </header>

                    <Section title="What we collect">
                        <p>Account details (name, email address, mobile number, role, barangay and purok); disaster reports you file, including photos, location and affected area; assistance requests and household information (head of household, address, number of members); donation records; and signatures captured when relief goods are received.</p>
                        <p>Photos are re-encoded on upload so embedded camera and GPS metadata is removed. Recipient signatures are stored privately and are only visible to authorized barangay officials.</p>
                    </Section>

                    <Section title="Why we collect it">
                        <p>To verify and respond to disaster incidents, prioritize and deliver relief to affected households, track donations from pledge to distribution, and produce reports required by the barangay and the LGU.</p>
                    </Section>

                    <Section title="Who can see it">
                        <p>Access follows your role. Purok Presidents see records in their purok; barangay administrators see records in their barangay; the Super Admin oversees all barangays. Donors only see aggregated, approved needs and never see household names. We do not sell or share your data with third parties, except our payment processor (PayMongo) for online donations and government agencies when required by law.</p>
                    </Section>

                    <Section title="How long we keep it">
                        <p>Records are kept for as long as needed for relief operations and for the retention periods required for government audit, after which they are securely deleted or anonymized.</p>
                    </Section>

                    <Section title="Your rights">
                        <p>You have the right to be informed, to access, to object, to correct, to erasure or blocking, to data portability, and to file a complaint with the National Privacy Commission. To exercise these rights, contact your barangay's ReliefNet administrator.</p>
                    </Section>

                    <footer className="pt-4 border-t border-border/60 flex gap-4 text-sm">
                        <Link href={route('register')} className="text-primary hover:underline">← Back to registration</Link>
                        <Link href="/" className="text-muted-foreground hover:underline">Home</Link>
                    </footer>
                </div>
            </div>
        </div>
    );
}
