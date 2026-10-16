import { Link } from '@inertiajs/react';
import { useModalPage } from '@/Components/ModalLink';
import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

/** Form "Cancel": closes the modal when the form is opened through a ModalLink, otherwise navigates to `href`. */
export default function CancelLink({ href, className, children = 'Cancel' }) {
    const modal = useModalPage();
    const classes = cn(buttonVariants({ variant: 'outline' }), 'h-12 sm:h-10', className);

    if (modal) {
        return <button type="button" onClick={modal.close} className={classes}>{children}</button>;
    }

    return <Link href={href} className={classes}>{children}</Link>;
}
