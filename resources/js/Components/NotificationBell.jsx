import { useState, useEffect, useRef, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';

// Plays a short beep when a new notification arrives
function playAlert() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch {}
}

function timeAgo(iso) {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ userId }) {
    // Persisted unread notifications shared from the server on every page load.
    const { notifications: serverNotifications = [] } = usePage().props;
    // Notifications received live over the websocket this session.
    const [live, setLive] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Merge server + live, newest first, de-duplicated by id.
    const notifications = useMemo(() => {
        const seen = new Set();
        return [...live, ...serverNotifications]
            .filter(n => {
                if (!n) return false;
                const key = n.id ?? n.message;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .slice(0, 20);
    }, [live, serverNotifications]);

    useEffect(() => {
        if (!userId || !window.Echo) return;

        const channel = window.Echo.private(`App.Models.User.${userId}`);
        channel.notification((n) => {
            setLive(prev => [{
                id: n.id,
                message: n.message,
                report_id: n.report_id ?? null,
                url: n.url ?? null,
                created_at: new Date().toISOString(),
            }, ...prev].slice(0, 20));
            playAlert();
        });

        return () => channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
    }, [userId]);

    useEffect(() => {
        const handleOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const unread = notifications.length;

    const markAllRead = () => {
        setLive([]);
        router.post('/notifications/read-all', {}, { preserveScroll: true, preserveState: true });
    };

    const openNotification = (n) => {
        setLive(prev => prev.filter(x => x.id !== n.id));
        const target = n.url ?? (n.report_id ? `/disaster-reports/${n.report_id}` : null);
        if (n.id) {
            router.post(`/notifications/${n.id}/read`, {}, {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    if (target) router.visit(target);
                },
            });
        } else if (target) {
            router.visit(target);
        }
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} className="relative p-2 text-muted-foreground hover:text-foreground">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
                        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                        {unread > 0 && (
                            <button onClick={markAllRead}
                                className="text-xs text-primary hover:underline">Mark all read</button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                        ) : notifications.map((n, i) => (
                            <button key={n.id ?? i} onClick={() => openNotification(n)}
                                className="block w-full text-left px-4 py-3 hover:bg-accent transition-colors">
                                <p className="text-sm text-foreground">{n.message}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
