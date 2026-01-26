import { api } from './api';

export interface Operator {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export interface Canteen {
    id: string;
    name: string;
    type: 'COMMERCIAL' | 'GOVERNMENTAL';
    schoolId: string;
    _count?: {
        operators: number;
    };
    operators?: Operator[];
}

export const canteenService = {
    // Lista todas as cantinas da escola
    findAll: async () => {
        const response = await api.get<Canteen[]>('/canteen');
        return response.data;
    },

    // Cria nova cantina
    create: async (data: { name: string; type: 'COMMERCIAL' | 'GOVERNMENTAL' }) => {
        const response = await api.post<Canteen>('/canteen', data);
        return response.data;
    },

    // Detalhes da cantina com operadores
    findOne: async (id: string) => {
        const response = await api.get<Canteen>(`/canteen/${id}`);
        return response.data;
    },

    // Adiciona operador
    addOperator: async (canteenId: string, data: { name: string; email: string; passwordHash: string }) => {
        const response = await api.post(`/canteen/${canteenId}/operators`, data);
        return response.data;
    },

    // Remove operador
    removeOperator: async (canteenId: string, operatorId: string) => {
        await api.delete(`/canteen/${canteenId}/operators/${operatorId}`);
    }
};
