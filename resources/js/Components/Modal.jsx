import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

// Breeze-compatible API (show / onClose / maxWidth / closeable) on Radix Dialog, styled like shadcn/ui Dialog.
// Callers render their own heading and action buttons inside children. Pass title={null} when the
// children render their own DialogTitle and DialogDescription.
export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    dismissOnOutsideClick = true,
    title = 'Dialog',
    onClose = () => {},
}) {
    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
    }[maxWidth];

    const handleOpenChange = (open) => {
        if (!open && closeable) {
            onClose();
        }
    };

    return (
        <DialogPrimitive.Root open={show} onOpenChange={handleOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    onInteractOutside={(e) => { if (!closeable || !dismissOnOutsideClick) e.preventDefault(); }}
                    onEscapeKeyDown={(e) => { if (!closeable) e.preventDefault(); }}
                    className={cn(
                        'fixed left-1/2 top-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        maxWidthClass,
                    )}
                >
                    {title !== null && (
                        <>
                            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                            <DialogPrimitive.Description className="sr-only">
                                Modal dialog
                            </DialogPrimitive.Description>
                        </>
                    )}
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
