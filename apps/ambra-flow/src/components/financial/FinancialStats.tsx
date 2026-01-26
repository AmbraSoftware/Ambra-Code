'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

interface FinancialStatsProps {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
}

export function FinancialStats({ totalSales, totalRevenue, averageTicket }: FinancialStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">payments</span>
                </div>
                <div>
                    <p className="text-sm text-muted-light dark:text-muted-dark">Faturamento (Período)</p>
                    <p className="text-2xl font-bold text-text-light dark:text-text-dark">R$ {totalRevenue.toFixed(2)}</p>
                </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">shopping_cart</span>
                </div>
                <div>
                    <p className="text-sm text-muted-light dark:text-muted-dark">Vendas Realizadas</p>
                    <p className="text-2xl font-bold text-text-light dark:text-text-dark">{totalSales}</p>
                </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">analytics</span>
                </div>
                <div>
                    <p className="text-sm text-muted-light dark:text-muted-dark">Ticket Médio</p>
                    <p className="text-2xl font-bold text-text-light dark:text-text-dark">R$ {averageTicket.toFixed(2)}</p>
                </div>
            </Card>
        </div>
    );
}
