import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Dark surfaces per relief.md §4 (#121212 / #1E1E1E). The saved choice is
// applied before first paint by an inline script in app.blade.php.
export default function ThemeToggle() {
    const [dark, setDark] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
    );

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }, [dark]);

    return (
        <button
            type="button"
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
}
