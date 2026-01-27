'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { posService } from '@/services/pos.service';
import { formatCurrency } from '@/lib/utils';

export default function OperatorHistoryPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ count: 0, total: 0 });

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await posService.getHistory();
            setOrders(data);
            
            // Calculate summary of loaded orders
            const total = data.reduce((acc: number, order: any) => acc + Number(order.totalAmount), 0);
            setSummary({
                count: data.length,
                total
            });
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Histórico de Vendas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Últimas vendas realizadas nesta cantina.</p>
                </div>

                <div className="flex gap-4">
                    <Card className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">Vendas Hoje</span>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{summary.count}</div>
                    </Card>
                    <Card className="px-6 py-3 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">Total Faturado</span>
                        <div className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(summary.total)}</div>
                    </Card>
                </div>
            </div>

            <Card>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando histórico...</div>
                ) : orders.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-gray-400 text-3xl">receipt_long</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nenhuma venda recente</h3>
                        <p className="text-gray-500 mt-2">As vendas realizadas aparecerão aqui.</p>
                    </div>
                ) : (
                    <Table
                        columns={[
                            {
                                header: 'Horário',
                                cell: (order: any) => new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            },
                            {
                                header: 'Cliente',
                                cell: (order: any) => (
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{order.student?.name || 'Cliente'}</span>
                                        <span className="text-xs text-gray-500">Matrícula: {order.student?.profile?.class || 'N/A'}</span>
                                    </div>
                                )
                            },
                            {
                                header: 'Itens',
                                cell: (order: any) => (
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        {order.items?.map((i: any) => `${i.quantity}x ${i.product.name}`).join(', ')}
                                    </div>
                                )
                            },
                            {
                                header: 'Valor',
                                cell: (order: any) => <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(order.totalAmount)}</span>
                            },
                            {
                                header: 'Status',
                                cell: (order: any) => (
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        order.status === 'DELIVERED' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                        {order.status === 'DELIVERED' ? 'ENTREGUE' : order.status}
                                    </span>
                                )
                            }
                        ]}
                        data={orders}
                        keyExtractor={(order) => order.id}
                    />
                )}
            </Card>
        </div>
    );
}
