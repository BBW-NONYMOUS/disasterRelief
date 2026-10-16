import { usePage } from '@inertiajs/react';

/**
 * The signed-in user's Access Control level for a module:
 * 'full' (Full Access), 'view' (View Only) or 'none' (No Access).
 * The server enforces it; this only hides actions a View Only user can't use.
 */
export default function useModuleAccess(module) {
    const level = usePage().props.auth?.user?.access?.[module] ?? 'none';

    return { level, canView: level !== 'none', canManage: level === 'full' };
}
