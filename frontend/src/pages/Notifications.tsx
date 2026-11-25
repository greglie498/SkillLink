import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';
import { api } from '../lib/api';
import { timeAgo, type NotificationDto } from '../lib/notifications';

export default function Notifications() {
    const navigate = useNavigate();
    const [items, setItems] = useState<NotificationDto[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const d = await api<{ unread: number; items: NotificationDto[] }>('/notifications', { auth: true });
            setItems(d.items);
            setUnread(d.unread);
            setError(null);
        } catch {
            setError('Could not load your notifications.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function open(n: NotificationDto) {
        if (!n.isRead) {
        try {
            await api(`/notifications/${n.id}/read`, { method: 'PATCH', auth: true });
        } catch {
            /* still follow the link */
        }
        }
        if (n.link && n.link.startsWith('/') && !n.link.startsWith('//')) navigate(n.link);
        else await load();
    }

    async function markAll() {
        try {
        await api('/notifications/read-all', { method: 'POST', auth: true });
        await load();
        } catch {
        setError('Could not update your notifications.');
        }
    }

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8 max-w-7xl">
                <PageHeader
                    title="Notifications"
                    sub={unread > 0 ? `${unread} unread` : 'You are all caught up.'}
                    action={
                        unread > 0 ? (
                        <button onClick={markAll} className="btn btn-secondary btn-sm">
                            Mark all as read
                        </button>
                        ) : undefined
                    }
                />

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {!loading && !error && items.length === 0 && (
                    <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-8 text-sm text-ink">
                        No notifications yet. You will see updates here when something happens to your applications, opportunities or projects.
                    </div>
                )}

                {items.length > 0 && (
                    <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm overflow-hidden">
                        {items.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => open(n)}
                            className={`w-full text-left flex gap-3.5 p-4 border-b border-[#EEEEF1] last:border-0 hover:bg-[#FFFAF8] transition-colors ${
                            n.isRead ? '' : 'bg-[#FFFAF8]'
                            }`}
                        >
                            <span className="w-9 h-9 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0">
                                <Icon name="bell" className="w-4 h-4" />
                            </span>
                            <span className="flex-1 min-w-0">
                            <span className="block text-[13px] leading-5 text-[#454550]">{n.message}</span>
                            <span className="block text-[11px] text-muted mt-0.5">{timeAgo(n.createdAt)}</span>
                            </span>
                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                        </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}