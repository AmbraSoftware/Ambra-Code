'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SalesTable } from '@/components/financial/SalesTable';
import { FinancialStats } from '@/components/financial/FinancialStats';
import { financialService, Order } from '@/services/financial.service';

export default function FinancialPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, averageTicket: 0 });

    // Filters
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0], // Hoje
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await financialService.getSales({
                startDate: dateRange.start, // Backend deve tratar 00:00
                endDate: dateRange.end // Backend deve tratar 23:59
            });

            // Calculate Stats Client-Side (for now, ideal is backend)
            const validOrders = data.filter(o => o.status === 'PAID' || o.status === 'DELIVERED');
            const totalRevenue = validOrders.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

            setOrders(data);
            setStats({
                totalSales: validOrders.length,
                totalRevenue,
                averageTicket: validOrders.length ? totalRevenue / validOrders.length : 0
            });

        } catch (error) {
            console.error('Failed to load financial data', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Extratos Financeiros</h1>
                    <p className="text-muted-light dark:text-muted-dark">Acompanhe as vendas e o fluxo de caixa da cantina.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
                    />
                    <span className="text-muted-light">-</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
                    />
                    <Button icon="refresh" variant="ghost" onClick={loadData}>
                        Atualizar
                    </Button>
                </div>
            </div>

            <FinancialStats {...stats} />

            <Card className="min-h-[400px]" noPadding>
                <div className="p-4 border-b border-border-light dark:border-border-dark">
                    <h3 className="font-semibold text-text-light dark:text-text-dark">Histórico de Vendas</h3>
                </div>
                <SalesTable orders={orders} isLoading={isLoading} />
            </Card>


        </div>
    );
}
