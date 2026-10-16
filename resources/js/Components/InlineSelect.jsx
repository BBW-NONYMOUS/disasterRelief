import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Select whose option list opens in the page flow, pushing the fields below it down
 * instead of floating over them like a native <select> popup.
 */
export default function InlineSelect({ id, value, onChange, options, placeholder = 'Select…', disabled = false, className }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        if (!open) return;
        const close = e => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
        const onKey = e => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

    const pick = v => { onChange(v); setOpen(false); };

    return (
        <div ref={rootRef} className={cn('mt-1', className)}>
            <button type="button" id={id} disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
                onClick={() => setOpen(o => !o)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 text-left text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70">
                <span className={cn('truncate', !selected && 'text-muted-foreground')}>{selected ? selected.label : placeholder}</span>
                <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <ul role="listbox" aria-labelledby={id}
                    className="mt-1 max-h-60 overflow-y-auto rounded-md border border-input bg-card py-1 text-sm shadow-sm">
                    {[{ value: '', label: placeholder }, ...options].map(o => {
                        const active = String(o.value) === String(value ?? '');
                        return (
                            <li key={o.value === '' ? '__empty' : o.value} role="option" aria-selected={active}>
                                <button type="button" onClick={() => pick(o.value)}
                                    className={cn('flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none',
                                        o.value === '' && 'text-muted-foreground', active && 'font-medium')}>
                                    <span className="truncate">{o.label}</span>
                                    {active && <Check className="size-4 shrink-0" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
