import { router } from '@inertiajs/react';

/** Pill tabs that filter an index page by ?status= (or another query param). */
export default function StatusFilter({ statuses, current, path, param = 'status', allLabel = 'All' }) {
    const go = (value) => router.get(path, value ? { [param]: value } : {}, { preserveState: true, preserveScroll: true });

    return (
        <div className="flex flex-wrap gap-1.5">
            {[{ value: null, label: allLabel }, ...statuses].map(s => (
                <button key={s.value ?? 'all'} type="button" onClick={() => go(s.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                        ${(current ?? null) === s.value ? 'bg-primary text-white border-blue-600' : 'bg-card text-muted-foreground border-border hover:bg-accent'}`}>
                    {s.label}{s.count != null && <span className="ml-1 opacity-70">({s.count})</span>}
                </button>
            ))}
        </div>
    );
}
