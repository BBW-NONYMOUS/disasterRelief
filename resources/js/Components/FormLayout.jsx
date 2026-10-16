import { useModalPage } from '@/Components/ModalLink';
import { cn } from '@/lib/utils';

const WIDTHS = { lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl' };

/** Centred card on a full page; flat when the page is shown in a modal, which is already the surface. */
export function FormShell({ width = 'lg', className, children }) {
    const modal = useModalPage();

    if (modal) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div className={cn('mx-auto', WIDTHS[width])}>
            <div className={cn('rounded-xl border border-border bg-card p-6', className)}>{children}</div>
        </div>
    );
}

/** Form buttons; in a modal they become the dialog footer, pinned to the bottom while the body scrolls. */
export function FormActions({ children }) {
    const modal = useModalPage();

    return (
        <div
            data-modal-footer={modal ? '' : undefined}
            className={cn(
                modal
                    ? 'sticky bottom-0 -mx-6 flex flex-col-reverse gap-2 border-t bg-card px-6 py-4 sm:flex-row sm:justify-end'
                    : 'flex justify-end gap-3 pt-2',
            )}
        >
            {children}
        </div>
    );
}
