import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export default function Pagination({ paginator }) {
    if (!paginator || paginator.last_page <= 1) return null;

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {paginator.links.map((link, i) => (
                <button key={i}
                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                    disabled={!link.url}
                    className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        link.active
                            ? 'bg-primary text-primary-foreground'
                            : 'border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40',
                    )}>
                    {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                </button>
            ))}
        </div>
    );
}
