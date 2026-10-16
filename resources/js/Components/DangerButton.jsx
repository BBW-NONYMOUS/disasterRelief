import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

// Danger is reserved for reject/decline and destructive actions (relief.md §4).
export default function DangerButton({ className = '', disabled, children, ...props }) {
    return (
        <Button
            {...props}
            variant="destructive"
            disabled={disabled}
            className={cn('h-12 sm:h-10', className)}
        >
            {children}
        </Button>
    );
}
