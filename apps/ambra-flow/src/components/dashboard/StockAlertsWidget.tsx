'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardService, StockAlert } from '@/services/dashboard.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function StockAlertsWidget() {
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const data = await dashboardService.getStockAlerts();
            setAlerts(data);
        } catch (error) {
            console.error('Failed to load stock alerts', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getSeverityColor = (severity: StockAlert['severity']) => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-50 border-red-200 dark:bg-red-900/20';
            case 'HIGH':
                return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20';
            case 'MEDIUM':
                return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20';
        }
    };

    const getSeverityIcon = (severity: StockAlert['severity']) => {
        switch (severity) {
            case 'CRITICAL':
                return 'error';
            case 'HIGH':
                return 'warning';
            case 'MEDIUM':
                return 'info';
        }
    };

    if (isLoading) {
        return (
            <Card title="⚠️ Atenção Urgente" className="border-l-4 border-l-red-500">
                <div className="flex justify-center py-4">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                </div>
            </Card>
        );
    }

    return (
        <Card title="⚠️ Atenção Urgente" className="border-l-4 border-l-red-500">
            {alerts.length === 0 ? (
                <div className="text-center py-6 text-green-600">
                    <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                    <p className="font-medium">Estoque OK</p>
                    <p className="text-sm text-muted-light dark:text-muted-dark mt-1">
                        Todos os produtos estão com estoque adequado.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} transition-all hover:shadow-md`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className={`material-symbols-outlined ${alert.severity === 'CRITICAL' ? 'text-red-600' :
                                            alert.severity === 'HIGH' ? 'text-orange-600' :
                                                'text-yellow-600'
                                        }`}>
                                        {getSeverityIcon(alert.severity)}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-text-light dark:text-text-dark">
                                            {alert.name}
                                        </p>
                                        <p className="text-xs text-muted-light dark:text-muted-dark">
                                            {alert.stock === 0 ? (
                                                <span className="text-red-600 font-bold">ESGOTADO</span>
                                            ) : (
                                                <>
                                                    {alert.stock} {alert.stock === 1 ? 'unidade restante' : 'unidades restantes'}
                                                    {' '}(mínimo: {alert.minStockAlert})
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => router.push('/manager/stock')}
                                    className="shrink-0"
                                >
                                    Repor
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
