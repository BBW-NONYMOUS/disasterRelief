import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export default function ResponsiveNavLink({ active = false, className = '', children, ...props }) {
    return (
        <Link
            {...props}
            className={cn(
                'flex w-full items-start border-l-4 py-2 pe-4 ps-3 text-base font-medium transition duration-150 ease-in-out focus:outline-none',
                active
                    ? 'border-primary bg-primary/10 text-primary focus:border-primary-dark focus:bg-primary/15'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground focus:border-border focus:bg-muted focus:text-foreground',
                className,
            )}
        >
            {children}
        </Link>
    );
}
