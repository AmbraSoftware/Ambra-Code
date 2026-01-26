
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    timestamp: Date; // For sorting
    type: 'FINANCE' | 'SECURITY' | 'SYSTEM' | 'USER_ACTION';
    severity: 'good' | 'bad' | 'neutral' | 'info';
    actorId?: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                // 1. Fetch Audit Logs (My Changes / System Changes)
                // Endpoint: /audit/global-recent (if admin) or /audit/logs (if school)
                // For "My Changes", ideally we filter by actorId, but global-recent is okay for "Console" view.
                const { data: auditLogsData } = await api.get('/audit/global-recent');
                const auditLogs = Array.isArray(auditLogsData) ? auditLogsData : [];
                // 2. Fetch Recent Transactions (Financial Events)
                // We use the transactions endpoint to find recent recharges (Money In)
                const { data: transactionsData } = await api.get('/transactions?type=RECHARGE'); // Assuming RECHARGE maps to SaaS/Money in context
                const transactions = Array.isArray(transactionsData) ? transactionsData : [];

                const mappedAudit: NotificationItem[] = (auditLogs || []).map((log: any) => {
                    const isMyAction = log.actor?.email === user.email || log.actor?.id === user.id;
                    return {
                        id: log.id,
                        title: log.action.replace(/_/g, ' '),
                        description: `Action by ${log.actor?.name || 'System'} on ${log.entity}`,
                        time: new Date(log.createdAt).toLocaleString('pt-BR'),
                        timestamp: new Date(log.createdAt),
                        type: isMyAction ? 'USER_ACTION' : 'SYSTEM',
                        severity: log.action.includes('DELETE') ? 'bad' : 'neutral',
                        actorId: log.actor?.id
                    };
                });

                const mappedTx: NotificationItem[] = transactions.map((tx: any) => ({
                    id: tx.id,
                    title: "Novo Pagamento Recebido",
                    description: `Recarga de ${Number(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} confirmada.`,
                    time: new Date(tx.createdAt).toLocaleString('pt-BR'),
                    timestamp: new Date(tx.createdAt),
                    type: 'FINANCE',
                    severity: 'good'
                }));

                const all = [...mappedAudit, ...mappedTx].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

                setNotifications(all);

                // Check Read State from LocalStorage
                const lastRead = localStorage.getItem('nodum_last_read_notification');
                if (lastRead) {
                    const lastReadDate = new Date(lastRead);
                    const newItems = all.filter(n => n.timestamp > lastReadDate).length;
                    setUnreadCount(newItems);
                } else {
                    setUnreadCount(all.length);
                }

            } catch (err) {
                console.error("Failed to fetch notifications", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Poll every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);

    }, [user]);

    const markAsRead = () => {
        const now = new Date();
        localStorage.setItem('nodum_last_read_notification', now.toISOString());
        setUnreadCount(0);
    };

    const myActions = notifications.filter(n => n.type === 'USER_ACTION');
    const systemAlerts = notifications.filter(n => n.type !== 'USER_ACTION');

    return { notifications, unreadCount, markAsRead, loading, myActions, systemAlerts };
}
