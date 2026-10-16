import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { CloudOff, UploadCloud } from 'lucide-react';
import { getDrafts, removeDraft, onQueueChange } from '@/lib/offlineQueue';
import { useTranslation } from '@/lib/i18n';

/*
| relief.md §4 component: "Offline banner — yellow strip, pending count,
| 'will sync'. Shown when the queue is not empty."
| Queued report drafts are re-submitted one at a time on reconnect.
*/
export default function OfflineBanner() {
    const { t, locale } = useTranslation();
    const [online, setOnline] = useState(() => navigator.onLine);
    const [pending, setPending] = useState(() => getDrafts().length);
    const [syncing, setSyncing] = useState(false);
    const busy = useRef(false);

    const sync = useCallback(() => {
        if (busy.current || !navigator.onLine) return;
        const [draft] = getDrafts();
        if (!draft) return;

        busy.current = true;
        setSyncing(true);
        router.post('/disaster-reports', draft.data, {
            preserveScroll: true,
            onSuccess: () => removeDraft(draft.id),
            onError: () => removeDraft(draft.id), // invalid draft would fail forever — drop it
            onFinish: () => {
                busy.current = false;
                setSyncing(false);
                setPending(getDrafts().length);
                if (getDrafts().length > 0) setTimeout(sync, 400);
            },
        });
    }, []);

    useEffect(() => {
        const goOnline = () => { setOnline(true); sync(); };
        const goOffline = () => setOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        const offQueue = onQueueChange(() => setPending(getDrafts().length));

        if (navigator.onLine && getDrafts().length > 0) sync();

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
            offQueue();
        };
    }, [sync]);

    if (online && pending === 0) return null;

    return (
        <div className="bg-status-ongoing/15 border-b border-status-ongoing/40 px-4 py-2 text-sm text-status-ongoing flex items-center gap-2"
            role="status" aria-live="polite">
            {online ? <UploadCloud className="h-4 w-4 shrink-0" /> : <CloudOff className="h-4 w-4 shrink-0" />}
            {!online && pending === 0 && (
                <span>{locale === 'fil' ? t('offline.no_signal') : 'No signal — you can still file a report; it will be saved on this phone.'}</span>
            )}
            {!online && pending > 0 && (
                <span>
                    <strong>{pending}</strong>{' '}
                    {locale === 'fil' ? t('offline.saved') : `report${pending > 1 ? 's' : ''} saved offline — will send when you are back online.`}
                </span>
            )}
            {online && pending > 0 && (
                <span>
                    {locale === 'fil'
                        ? <>{syncing ? t('offline.sending') : t('offline.ready')} <strong>{pending}</strong> {t('offline.saved_reports')}</>
                        : <>{syncing ? 'Sending' : 'Ready to send'} <strong>{pending}</strong> saved report{pending > 1 ? 's' : ''}…</>}
                </span>
            )}
        </div>
    );
}
