import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/NotificationBell';

const MENU_ITEMS = {
    super_admin: [
        { label: 'Dashboard', href: '/dashboard', icon: 'home' },
        { label: 'Disaster Reports', href: '/disaster-reports', icon: 'alert' },
        { label: 'Donations', href: '/donations', icon: 'gift' },
        { label: 'Distributions', href: '/distributions', icon: 'truck' },
        { label: 'Inventory', href: '/inventory', icon: 'box' },
        { label: 'Households', href: '/households', icon: 'users' },
        { label: 'Reports', href: '/reports', icon: 'doc' },
        { label: 'Users', href: '/users', icon: 'user-cog' },
    ],
    admin: [
        { label: 'Dashboard', href: '/dashboard', icon: 'home' },
        { label: 'Disaster Reports', href: '/disaster-reports', icon: 'alert' },
        { label: 'Assistance Requests', href: '/assistance-requests', icon: 'hand' },
        { label: 'Donations', href: '/donations', icon: 'gift' },
        { label: 'Inventory', href: '/inventory', icon: 'box' },
        { label: 'Distributions', href: '/distributions', icon: 'truck' },
        { label: 'Households', href: '/households', icon: 'users' },
        { label: 'Reports', href: '/reports', icon: 'doc' },
        { label: 'Users', href: '/users', icon: 'user-cog' },
    ],
    purok_president: [
        { label: 'Dashboard', href: '/dashboard', icon: 'home' },
        { label: 'Disaster Reports', href: '/disaster-reports', icon: 'alert' },
        { label: 'Households', href: '/households', icon: 'users' },
        { label: 'Distributions', href: '/distributions', icon: 'truck' },
        { label: 'Assistance Requests', href: '/assistance-requests', icon: 'hand' },
    ],
    resident: [
        { label: 'Dashboard', href: '/dashboard', icon: 'home' },
        { label: 'My Reports', href: '/disaster-reports', icon: 'alert' },
        { label: 'Assistance Requests', href: '/assistance-requests', icon: 'hand' },
    ],
    donor: [
        { label: 'Dashboard', href: '/dashboard', icon: 'home' },
        { label: 'Disaster Reports', href: '/disaster-reports', icon: 'alert' },
        { label: 'My Donations', href: '/donations', icon: 'gift' },
    ],
};

function MenuIcon({ type }) {
    const icons = {
        home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
        alert: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
        gift: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />,
        truck: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />,
        box: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
        doc: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        'user-cog': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
        hand: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />,
    };

    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icons[type] || icons.home}
        </svg>
    );
}

export default function AppLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const role = user?.role ?? 'resident';
    const menuItems = MENU_ITEMS[role] ?? MENU_ITEMS.resident;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentPath = window.location.pathname;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-800">
                    <div className="bg-blue-600 rounded-lg p-1.5">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <div>
                        <div className="font-bold text-lg leading-tight">ReliefNet</div>
                        <div className="text-xs text-blue-300">{user?.role_label}</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {menuItems.map(item => {
                        const isActive = currentPath.startsWith(item.href) && (item.href !== '/dashboard' || currentPath === '/dashboard');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 text-sm font-medium transition-colors
                                    ${isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800 hover:text-white'}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <MenuIcon type={item.icon} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info */}
                <div className="border-t border-blue-800 p-4">
                    <div className="text-sm font-medium truncate">{user?.name}</div>
                    <div className="text-xs text-blue-300 truncate">{user?.email}</div>
                    <Link href="/profile" className="mt-2 inline-block text-xs text-blue-400 hover:text-white">
                        Profile &rarr;
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            className="p-1.5 text-gray-600 hover:text-gray-900 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="text-gray-700">{header}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell userId={user?.id} />
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100"
                        >
                            Logout
                        </Link>
                    </div>
                </header>

                {/* Flash messages */}
                {(flash?.success || flash?.error) && (
                    <div className={`mx-4 mt-4 p-3 rounded-lg text-sm font-medium ${flash?.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {flash?.success || flash?.error}
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
