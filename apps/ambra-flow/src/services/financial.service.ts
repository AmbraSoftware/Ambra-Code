import { api } from './api';

export interface Transaction {
    id: string;
    amount: number;
    type: 'RECHARGE' | 'PURCHASE' | 'REFUND' | 'WITHDRAWAL';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    createdAt: string;
    description: string;
}

export interface Order {
    id: string;
    orderHash: string;
    totalAmount: number;
    status: 'PENDING' | 'PAID' | 'DELIVERED' | 'CANCELLED';
    createdAt: string;
    buyer: { name: string };
    student: { name: string };
    items: {
        product: { name: string };
        quantity: number;
        unitPrice: number;
    }[];
}

export const financialService = {
    /**
     * Realiza uma recarga manual (Admin/Tesouraria)
     */
    recharge: async (userId: string, amount: number) => {
        const response = await api.post('/transactions/recharge', { userId, amount });
        return response.data;
    },

    /**
     * Busca histórico de vendas (Pedidos)
     */
    getSales: async (filters?: { startDate?: string; endDate?: string; status?: string }) => {
        const response = await api.get<Order[]>('/orders', { params: filters });
        return response.data;
    },

    /**
     * Busca histórico financeiro de uma carteira específica
     */
    getWalletHistory: async (userId?: string, filters?: Record<string, string>) => {
        // Se userId não for passado, o backend assume o usuário logado
        // Mas para ver histórico de terceiros (se permitido), precisaria de outro endpoint
        // Por enquanto, usamos /transactions que retorna o do usuário logado
        const response = await api.get('/transactions', { params: filters });
        return response.data;
    }
};
