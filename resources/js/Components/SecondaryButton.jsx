import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export default function SecondaryButton({ type = 'button', className = '', disabled, children, ...props }) {
    return (
        <Button
            {...props}
            type={type}
            variant="outline"
            disabled={disabled}
            className={cn('h-12 sm:h-10', className)}
        >
            {children}
        </Button>
    );
}
