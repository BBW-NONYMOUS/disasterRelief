import { useEffect, useState } from 'react';

/*
| relief.md §4: "support en and fil string files from day one."
|
| English strings double as the lookup keys (gettext style), so untranslated
| text falls back to English automatically. Add Filipino strings to FIL as
| screens get translated — missing keys are never an error.
*/
const FIL = {
    // Navigation
    'Dashboard': 'Dashboard',
    'Disaster Reports': 'Mga Ulat ng Sakuna',
    'My Reports': 'Aking mga Ulat',
    'Assistance Requests': 'Mga Hiling ng Tulong',
    'Open Needs': 'Mga Pangangailangan',
    'Donations': 'Mga Donasyon',
    'My Donations': 'Aking mga Donasyon',
    'Distributions': 'Pamamahagi',
    'Inventory': 'Imbentaryo',
    'Households': 'Mga Sambahayan',
    'Reports': 'Mga Ulat',
    'Barangays': 'Mga Barangay',
    'Puroks': 'Mga Purok',
    'Users': 'Mga User',
    'Access Control': 'Kontrol ng Access',
    'Evaluation Results': 'Resulta ng Ebalwasyon',
    'Audit Log': 'Talaan ng Audit',
    'Evaluate System': 'I-evaluate ang Sistema',
    'Profile': 'Profile',
    'Logout': 'Mag-logout',
    'Emergency Response': 'Pagtugon sa Sakuna',
    'Relief Operations': 'Operasyon ng Tulong',
    'Reports & Audit': 'Ulat at Audit',
    'Administration': 'Pangangasiwa',

    // Statuses — same vocabulary everywhere (relief.md §4)
    'Reported': 'Naiulat',
    'Verified': 'Beripikado',
    'Confirmed': 'Kumpirmado',
    'Resolved': 'Nalutas',
    'Rejected': 'Tinanggihan',
    'Merged': 'Pinagsama',
    'Waiting': 'Naghihintay',
    'Ongoing': 'Isinasagawa',
    'Completed': 'Tapos na',
    'Pending': 'Nakabinbin',
    'Approved': 'Aprubado',
    'Fulfilled': 'Naibigay',
    'Paid': 'Bayad na',
    'Received': 'Natanggap',
    'Distributed': 'Naipamahagi',
    'Declined': 'Tinanggihan',
    'Failed': 'Nabigo',
    'Active': 'Aktibo',
    'Inactive': 'Hindi aktibo',
    'Critical': 'Kritikal',
    'High': 'Mataas',
    'Urgent': 'Madalian',
    'Moderate': 'Katamtaman',
    'Low': 'Mababa',
    'Normal': 'Normal',
    'Scheduled': 'Nakatakda',
    'Refunded': 'Naibalik',

    // Incident report form (resident flow)
    'File a Disaster Report': 'Mag-ulat ng Sakuna',
    'Barangay *': 'Barangay *',
    'Purok (optional)': 'Purok (opsyonal)',
    'Disaster Type *': 'Uri ng Sakuna *',
    'Severity *': 'Tindi *',
    'Affected Area *': 'Apektadong Lugar *',
    'Pin the location on the map (optional)': 'Ituro ang lokasyon sa mapa (opsyonal)',
    'Description *': 'Paglalarawan *',
    'Photos (up to 5)': 'Mga Larawan (hanggang 5)',
    'Submit Report': 'Ipasa ang Ulat',
    'Submitting…': 'Ipinapasa…',

    // Offline banner
    'offline.no_signal': 'Walang signal — maaari ka pa ring mag-ulat; masesave ito sa teleponong ito.',
    'offline.saved': 'ulat ang naka-save offline — maipapadala kapag may signal na.',
    'offline.sending': 'Ipinapadala ang',
    'offline.ready': 'Handa nang ipadala ang',
    'offline.saved_reports': 'naka-save na ulat…',

    // Common
    'View Only': 'Pagtingin Lamang',
    'Save': 'I-save',
    'Cancel': 'Kanselahin',
    'Donate now': 'Mag-donate na',
};

const translations = { en: {}, fil: FIL };

let currentLocale = (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) || 'en';
const listeners = new Set();

export function setLocale(locale) {
    currentLocale = translations[locale] ? locale : 'en';
    localStorage.setItem('locale', currentLocale);
    listeners.forEach(listener => listener(currentLocale));
}

export function getLocale() {
    return currentLocale;
}

export function useTranslation() {
    const [locale, setState] = useState(currentLocale);

    useEffect(() => {
        listeners.add(setState);
        return () => listeners.delete(setState);
    }, []);

    // English text is the key; missing Filipino strings fall back to it.
    const t = (key) => (locale === 'en' ? key : (translations[locale][key] ?? key));

    return { t, locale, setLocale };
}

/** EN ⇄ FIL switch for the top bar. */
export function LanguageToggle() {
    const { locale, setLocale } = useTranslation();

    return (
        <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'fil' : 'en')}
            aria-label={locale === 'en' ? 'Lumipat sa Filipino' : 'Switch to English'}
            title={locale === 'en' ? 'Lumipat sa Filipino' : 'Switch to English'}
            className="rounded-md px-2 py-1.5 text-xs font-bold tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {locale === 'en' ? 'FIL' : 'EN'}
        </button>
    );
}
