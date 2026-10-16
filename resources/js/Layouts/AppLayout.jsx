import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    ClipboardList,
    FileText,
    Gift,
    HandHeart,
    Home,
    MapPin,
    MessageSquareHeart,
    Package,
    ShieldCheck,
    Star,
    Truck,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { useModalPage } from '@/Components/ModalLink';
import { DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import NotificationBell from '@/Components/NotificationBell';
import OfflineBanner from '@/Components/OfflineBanner';
import ThemeToggle from '@/Components/ThemeToggle';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
    SidebarTrigger,
} from '@/Components/ui/sidebar';
import { LanguageToggle, useTranslation } from '@/lib/i18n';

const ALL_ROLES = ['super_admin', 'admin', 'purok_president', 'resident', 'donor'];

// Sidebar sections in the order relief flows: incidents come in, goods move out, then oversight.
// `labels` renames an item for one role; groups with no visible items are hidden.
const NAV_GROUPS = [
    {
        label: null,
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ALL_ROLES },
        ],
    },
    {
        label: 'Emergency Response',
        items: [
            { label: 'Disaster Reports', href: '/disaster-reports', icon: AlertTriangle, roles: ALL_ROLES, labels: { resident: 'My Reports' } },
            { label: 'Assistance Requests', href: '/assistance-requests', icon: HandHeart, roles: ALL_ROLES, labels: { donor: 'Open Needs' } },
        ],
    },
    {
        label: 'Relief Operations',
        items: [
            { label: 'Donations', href: '/donations', icon: Gift, roles: ['super_admin', 'admin', 'donor'], labels: { donor: 'My Donations' } },
            { label: 'Inventory', href: '/inventory', icon: Package, roles: ['super_admin', 'admin'] },
            { label: 'Distributions', href: '/distributions', icon: Truck, roles: ['super_admin', 'admin', 'purok_president'] },
            { label: 'Households', href: '/households', icon: Users, roles: ['super_admin', 'admin', 'purok_president'] },
        ],
    },
    {
        label: 'Reports & Audit',
        items: [
            { label: 'Reports', href: '/reports', icon: FileText, roles: ['super_admin', 'admin'] },
            { label: 'Evaluation Results', href: '/evaluations', icon: Star, roles: ['super_admin'] },
            { label: 'Audit Log', href: '/activity-logs', icon: ClipboardList, roles: ['super_admin'] },
        ],
    },
    {
        label: 'Administration',
        items: [
            { label: 'Users', href: '/users', icon: UserCog, roles: ['super_admin', 'admin'] },
            { label: 'Barangays', href: '/barangays', icon: Building2, roles: ['super_admin'] },
            { label: 'Puroks', href: '/puroks', icon: MapPin, roles: ['super_admin'] },
            { label: 'Access Control', href: '/access-control', icon: ShieldCheck, roles: ['super_admin'] },
        ],
    },
];

// Pinned above the profile, apart from the day-to-day work.
const SECONDARY_ITEMS = [
    { label: 'Evaluate System', href: '/evaluations/create', icon: MessageSquareHeart, roles: ['admin', 'purok_president', 'resident', 'donor'] },
];

// Sidebar entries that the Super Admin can switch off per role (Access Control).
const HREF_MODULES = {
    '/disaster-reports': 'disaster_reports',
    '/assistance-requests': 'assistance_requests',
    '/donations': 'donations',
    '/distributions': 'distributions',
    '/inventory': 'inventory',
    '/households': 'households',
    '/reports': 'reports',
    '/users': 'users',
    '/evaluations/create': 'evaluations',
};

const MODULE_LABELS = {
    disaster_reports: 'Disaster Reports',
    assistance_requests: 'Assistance Requests',
    donations: 'Donations',
    distributions: 'Distributions',
    inventory: 'Inventory',
    households: 'Households',
    reports: 'PDF Reports',
    users: 'User Management',
    evaluations: 'System Evaluation',
};

/** Module whose pages the current URL belongs to, if any. */
function moduleForPath(path) {
    const href = Object.keys(HREF_MODULES).find(h => path === h || path.startsWith(`${h}/`));
    return href ? HREF_MODULES[href] : null;
}

export default function AppLayout(props) {
    const modal = useModalPage();

    return modal ? <ModalFrame {...props} onClose={modal.close} /> : <AppShell {...props} />;
}

/** Page opened through a ModalLink: a shadcn-style dialog with the page header as its title and a scrollable body. */
function ModalFrame({ header, description, children, onClose }) {
    const { t } = useTranslation();

    return (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
            <DialogHeader className="px-6 pb-4 pr-12 pt-6">
                <DialogTitle asChild>
                    <div className="[&_h1]:leading-tight">{header}</div>
                </DialogTitle>
                <DialogDescription className={description ? undefined : 'sr-only'}>
                    {description ?? t('Fill in the form below.')}
                </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-6 pb-6 [&:has([data-modal-footer])]:pb-0">{children}</div>
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{t('Close')}</span>
            </button>
        </div>
    );
}

function AppShell({ header, children }) {
    const { t } = useTranslation();
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const role = user?.role ?? 'resident';
    const modules = user?.modules ?? [];
    const visible = (items) => items
        .filter(item => item.roles.includes(role))
        .filter(item => !HREF_MODULES[item.href] || modules.includes(HREF_MODULES[item.href]))
        .map(item => ({ ...item, label: item.labels?.[role] ?? item.label }));
    const groups = NAV_GROUPS
        .map(group => ({ ...group, items: visible(group.items) }))
        .filter(group => group.items.length > 0);
    const secondaryItems = visible(SECONDARY_ITEMS);
    const currentPath = window.location.pathname;
    const currentModule = moduleForPath(currentPath);
    const viewOnly = currentModule && user?.access?.[currentModule] === 'view';

    const renderItem = (item) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={currentPath === item.href || currentPath.startsWith(`${item.href}/`)} tooltip={t(item.label)}>
                <Link href={item.href}>
                    <item.icon aria-hidden="true" />
                    <span>{t(item.label)}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="lg" tooltip="ReliefNet">
                                <Link href="/dashboard">
                                    <ApplicationLogo className="!size-8" />
                                    <span className="grid flex-1 text-left leading-tight">
                                        <span className="truncate text-base font-bold">ReliefNet</span>
                                        <span className="truncate text-xs text-sidebar-foreground/70">{user?.role_label}</span>
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    {groups.map(group => (
                        <SidebarGroup key={group.label ?? 'main'} className="py-1">
                            {group.label && <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>}
                            <SidebarMenu>{group.items.map(renderItem)}</SidebarMenu>
                        </SidebarGroup>
                    ))}

                    {secondaryItems.length > 0 && (
                        <SidebarGroup className="mt-auto py-1">
                            <SidebarMenu>{secondaryItems.map(renderItem)}</SidebarMenu>
                        </SidebarGroup>
                    )}
                </SidebarContent>

                <SidebarFooter>
                    <SidebarSeparator className="mx-0" />
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="lg" isActive={currentPath === '/profile'} tooltip={t('Profile')}>
                                <Link href="/profile">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground [[data-active=true]_&]:bg-sidebar-primary-foreground/20">
                                        {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                    </span>
                                    <span className="grid flex-1 text-left leading-tight">
                                        <span className="truncate text-sm font-medium">{user?.name}</span>
                                        <span className="truncate text-xs text-sidebar-foreground/70">{user?.email}</span>
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                        <div className="min-w-0 truncate text-foreground">{header}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <LanguageToggle />
                        <ThemeToggle />
                        <NotificationBell userId={user?.id} />
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            {t('Logout')}
                        </Link>
                    </div>
                </header>

                {/* Offline queue status (relief.md §4) */}
                <OfflineBanner />

                {/* Flash messages */}
                {(flash?.success || flash?.error) && (
                    <div className={`mx-4 mt-4 p-3 rounded-lg text-sm font-medium border ${flash?.success ? 'bg-status-completed/10 text-status-completed border-status-completed/30' : 'bg-status-rejected/10 text-status-rejected border-status-rejected/30'}`}>
                        {flash?.success || flash?.error}
                    </div>
                )}

                {viewOnly && (
                    <div className="mx-4 mt-4 p-3 rounded-lg text-sm bg-status-ongoing/10 text-status-ongoing border border-status-ongoing/40" role="status">
                        <span className="font-semibold">{t('View Only')}</span> — your role can view {MODULE_LABELS[currentModule]} but cannot make changes.
                    </div>
                )}

                {/* Page content */}
                <div className="flex-1 p-4 lg:p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
