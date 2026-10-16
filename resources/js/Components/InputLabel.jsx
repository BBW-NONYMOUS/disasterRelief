import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

export default function InputLabel({ value, className = '', children, ...props }) {
    return (
        <Label {...props} className={cn('block', className)}>
            {value ? value : children}
        </Label>
    );
}
