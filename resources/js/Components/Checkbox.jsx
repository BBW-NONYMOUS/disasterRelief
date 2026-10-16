import { cn } from '@/lib/utils';

export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={cn(
                'h-4 w-4 rounded border-input bg-card text-primary shadow-sm focus:ring-primary',
                className,
            )}
        />
    );
}
