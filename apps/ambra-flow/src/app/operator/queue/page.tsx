'use client';

import { useEffect, useState, useCallback } from 'react';
import { queueService, Order } from '@/services/queue.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function QueuePage() {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [recentDelivered, setRecentDelivered] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Auto-refresh logic could be added here (polling or socket)

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [pending, delivered] = await Promise.all([
                queueService.getOrders('PAID'),
                queueService.getOrders('DELIVERED') // This might return too many, ideally backend should limit or we slice
            ]);
            setPendingOrders(pending);
            setRecentDelivered(delivered.slice(0, 10)); // Just show last 10
        } catch (err) {
            console.error('Failed to load queue', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        // Poll every 15s
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleDeliver = async (orderId: string) => {
        setProcessingId(orderId);
        try {
            await queueService.deliverOrder(orderId);
            // Optimistic update
            const order = pendingOrders.find(o => o.id === orderId);
            if (order) {
                setPendingOrders(prev => prev.filter(o => o.id !== orderId));
                setRecentDelivered(prev => [order, ...prev.slice(0, 9)]);
            }
        } catch (error) {
            console.error('Delivery failed', error);
            alert('Erro ao confirmar entrega.');
        } finally {
            setProcessingId(null);
        }
    };

    const OrderCard = ({ order, isDelivered }: { order: Order; isDelivered?: boolean }) => (
        <div className={`p-4 rounded-xl border mb-3 transition-all ${isDelivered ? 'bg-gray-50 dark:bg-black/20 border-border-light/50 opacity-70' : 'bg-white dark:bg-surface-dark border-primary/20 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-text-light dark:text-text-dark">{order.student.name}</h4>
                    <p className="text-xs text-muted-light dark:text-muted-dark">#{order.orderHash.substring(0, 8)} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {!isDelivered && (
                    <Button
                        size="sm"
                        onClick={() => handleDeliver(order.id)}
                        isLoading={processingId === order.id}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-green-900/20"
                    >
                        Entregar
                    </Button>
                )}
            </div>

            <div className="space-y-1">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300"><span className="font-bold">{item.quantity}x</span> {item.product.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const [scanInput, setScanInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanInput) return;

        setIsScanning(true);
        try {
            // Tenta buscar pelo ID ou Hash direto (se backend suportar)
            // Se não, busca na lista local de pendentes primeiro para agilidade
            const localOrder = pendingOrders.find(o => o.orderHash === scanInput || o.id === scanInput);

            if (localOrder) {
                if (confirm(`Confirmar entrega para ${localOrder.student.name}?`)) {
                    await handleDeliver(localOrder.id);
                    setScanInput('');
                }
            } else {
                // Fallback: Busca no backend via service (já atualizado para tentar GET /orders/:id)
                const order = await queueService.getOrderByHash(scanInput);
                if (order && order.status === 'PAID') {
                    if (confirm(`Pedido encontrado: ${order.student.name}. Confirmar entrega?`)) {
                        await handleDeliver(order.id);
                        setScanInput('');
                        // Força refresh para aparecer na lista de entregues se não estava na pendente
                        loadData();
                    }
                } else if (order) {
                    alert(`Pedido já está com status: ${order.status}`);
                } else {
                    alert('Pedido não encontrado na fila de preparo.');
                }
            }
        } catch (error) {
            console.error('Scan failed', error);
            alert('Erro ao processar código.');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Fila de Pedidos</h1>
                    <p className="text-muted-light dark:text-muted-dark">Gerencie a entrega de produtos no balcão.</p>
                </div>
                <div className="flex gap-3">
                    <form onSubmit={handleScan} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="ESCANEAR QR CODE..."
                            className="bg-white dark:bg-black/20 border border-border-light dark:border-border-dark rounded-lg px-4 py-2 w-64 focus:ring-2 focus:ring-primary outline-none"
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            autoFocus
                        />
                        <Button type="submit" icon="qr_code_scanner" isLoading={isScanning}>
                            Validar
                        </Button>
                    </form>
                    <Button variant="outline" icon="refresh" onClick={loadData} isLoading={loading}>
                        Atualizar
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                {/* Pending Column */}
                <div className="flex flex-col min-h-0 bg-gray-100 dark:bg-surface-dark/50 rounded-2xl p-4 border border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-text-light dark:text-text-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">soup_kitchen</span>
                            Preparando / Aguardando
                        </h3>
                        <Badge variant="warning">{pendingOrders.length}</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {loading && pendingOrders.length === 0 ? (
                            <div className="p-4 text-center">Carregando...</div>
                        ) : pendingOrders.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-muted-light opacity-60">
                                <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                                <p>Tudo entregue!</p>
                            </div>
                        ) : (
                            pendingOrders.map(order => <OrderCard key={order.id} order={order} />)
                        )}
                    </div>
                </div>

                {/* Delivered Column */}
                <div className="flex flex-col min-h-0 bg-gray-100 dark:bg-surface-dark/50 rounded-2xl p-4 border border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-text-light dark:text-text-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-500">done_all</span>
                            Entregues (Recentes)
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {recentDelivered.map(order => <OrderCard key={order.id} order={order} isDelivered />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
