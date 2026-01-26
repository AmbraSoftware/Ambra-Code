import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export function useDashboard(user: any) {
    const [metrics, setMetrics] = useState<any>(null);
    const [systems, setSystems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            // 1. Fetch KPI Metrics
            // The backend returns: { mrr, totalSchools, totalStudents, activePlans }
            const { data: stats } = await api.get('/platform/dashboard');

            // Map to UI format (OverviewTab expects: mrr, gmv, netRevenue, financialFloat, activeOperators, endUsers)
            setMetrics({
                mrr: stats.mrr?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "R$ 0,00",
                gmv: stats.gmv?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "R$ 0,00",
                netRevenue: stats.netRevenue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "R$ 0,00",
                financialFloat: stats.financialFloat?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "R$ 0,00",
                activeOperators: stats.activeOperators?.toString() || "0",
                endUsers: stats.totalStudents?.toLocaleString('pt-BR') || "0",
                totalSchools: stats.totalSchools || 0,
                activePlans: stats.activePlans || 0,
                // Charts Data (Passed through to UI)
                salesHistory: stats.salesHistory || [],
                revenueComposition: (stats.revenueComposition || []).map((item: any, index: number) => ({
                    ...item,
                    fill: `hsl(var(--chart-${index + 1}))`,
                    color: `hsl(var(--chart-${index + 1}))`
                }))
            });

            // 2. Fetch Systems (Verticals)
            const { data: systemsData } = await api.get('/platform/systems');
            setSystems(systemsData);

        } catch (err: any) {
            console.error("Dashboard Sync Failed:", err);
            setError(err.response?.data?.message || "Falha ao sincronizar com o Kernel.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Auto-refresh every 30 seconds to ensure fresh data
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDashboard();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [fetchDashboard]);

    return {
        metrics,
        systems,
        isFetching: loading,
        error,
        refresh: fetchDashboard
    };
}
