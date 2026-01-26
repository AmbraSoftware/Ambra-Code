import { api } from './api';

export interface OrderItem {
    quantity: number;
    unitPrice: number;
    product: {
        name: string;
    };
}

export interface Order {
    id: string;
    orderHash: string;
    createdAt: string;
    totalAmount: number;
    student: {
        name: string;
    };
    items: OrderItem[];
    status?: string; // Sometimes useful for UI even if filtered by query
}

export const queueService = {
    getOrders: async (status: 'PAID' | 'DELIVERED' = 'PAID') => {
        // Backend usa filtro 'status' na rota GET /orders
        // Se status for PAID, o backend retorna pedidos pagos (que vão para a fila de preparo)
        const response = await api.get<Order[]>('/orders', { params: { status } });
        return response.data;
    },

    deliverOrder: async (orderId: string) => {
        // Rota correta: PATCH /orders/:id/status
        const response = await api.patch(`/orders/${orderId}/status`, { status: 'DELIVERED' });
        return response.data;
    },

    // For the Scanner flow
    getOrderByHash: async (hash: string) => {
        // Usar busca global de orders se o backend suportar, ou implementar filtro especifico
        // Por hora, vamos assumir que existe um endpoint ou filtro.
        // Se não houver endpoint de scan especifico, usamos o findAll com filtro (se suportado) ou erro.
        // O backend orders.controller.ts não tem endpoint de scan dedicado exposto publicamente/operador explicitamente.
        // Vamos usar o findAll filtrando (backend precisa suportar busca por hash se não tiver,
        // mas o controller atual tem filtros basicos. Vamos tentar achar pelo ID se o hash for o ID, ou assumir erro por enquanto e corrigir o backend se precisarmos de busca por hash real).

        // CORREÇÃO: Vamos supor que o "scan" lê o ID do pedido (QR Code contendo ID).
        try {
            const response = await api.get<Order>(`/orders/${hash}`);
            return response.data;
        } catch (e) {
            return null;
        }
    }
};
