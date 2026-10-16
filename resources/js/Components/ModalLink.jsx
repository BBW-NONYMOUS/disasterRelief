import { router, usePage } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createContext, useContext, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import { cn } from '@/lib/utils';

const ModalPageContext = createContext(null);

/** `{ close }` when the current page is rendered inside a ModalLink, otherwise null. */
export function useModalPage() {
    return useContext(ModalPageContext);
}

const pages = import.meta.glob('../Pages/**/*.jsx');

const samePath = (a, b) => new URL(a, window.location.origin).pathname === new URL(b, window.location.origin).pathname;

/**
 * A link that opens an Inertia page (e.g. a Create or Edit form) in a modal over the current page.
 * The URL still works as a full page: new-tab clicks and any unexpected response fall back to a normal visit.
 */
export default function ModalLink({ href, size = 'lg', className, children, ...rest }) {
    const { version } = usePage();
    const [opened, setOpened] = useState(null);
    const [loading, setLoading] = useState(false);

    const close = () => setOpened(null);

    // Form submissions inside the modal redirect back to the page underneath; close once one succeeds without errors.
    useEffect(() => {
        if (!opened) return undefined;
        let submitting = false;
        const offStart = router.on('start', (e) => {
            submitting = e.detail.visit.method.toLowerCase() !== 'get';
        });
        const offSuccess = router.on('success', (e) => {
            if (submitting && Object.keys(e.detail.page.props.errors ?? {}).length === 0) close();
        });
        return () => { offStart(); offSuccess(); };
    }, [opened]);

    const open = async (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        try {
            const res = await fetch(href, {
                headers: {
                    'X-Inertia': 'true',
                    'X-Inertia-Version': version ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'text/html, application/xhtml+xml',
                },
            });
            const page = res.ok && res.headers.get('X-Inertia') ? await res.json() : null;

            // Forbidden, asset version changed, session expired (redirect), etc.: let Inertia handle it normally.
            if (!page || !samePath(page.url, href)) {
                router.visit(href);
                return;
            }

            const module = await resolvePageComponent(`../Pages/${page.component}.jsx`, pages);
            setOpened({ Component: module.default, props: page.props });
        } catch {
            router.visit(href);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <a href={href} onClick={open} aria-busy={loading || undefined} className={cn(className, loading && 'cursor-wait opacity-60')} {...rest}>
                {children}
            </a>
            {opened && (
                <ModalPageContext.Provider value={{ close }}>
                    <Modal show onClose={close} maxWidth={size} title={null} dismissOnOutsideClick={false}>
                        <opened.Component {...opened.props} />
                    </Modal>
                </ModalPageContext.Provider>
            )}
        </>
    );
}
