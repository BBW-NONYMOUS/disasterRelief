import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                destructive: 'border-transparent bg-destructive text-destructive-foreground',
                outline: 'text-foreground',
                // relief.md status vocabulary — soft tinted chips, AA text.
                reported: 'border-status-reported/30 bg-status-reported/10 text-status-reported',
                verified: 'border-status-verified/30 bg-status-verified/10 text-status-verified',
                ongoing: 'border-status-ongoing/40 bg-status-ongoing/15 text-status-ongoing',
                completed: 'border-status-completed/30 bg-status-completed/10 text-status-completed',
                rejected: 'border-status-rejected/30 bg-status-rejected/10 text-status-rejected',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
