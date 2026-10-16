import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

// relief.md: primary #1565C0; 48px tap target on mobile forms.
export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <Button
            {...props}
            disabled={disabled}
            className={cn('h-12 sm:h-10', className)}
        >
            {children}
        </Button>
    );
}
