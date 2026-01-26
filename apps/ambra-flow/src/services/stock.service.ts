import { api } from './api';

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    canteenId: string;
    minStockAlert?: number;
    // Add other fields as necessary from the DTO
    version: number;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    isKit?: boolean;
    minStockAlert?: number;
}

export type UpdateProductDto = Partial<CreateProductDto> & { version?: number };

export const stockService = {
    getAll: async () => {
        const response = await api.get<Product[]>('/products');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },

    create: async (data: CreateProductDto) => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },

    update: async (id: string, data: UpdateProductDto) => {
        const response = await api.patch<Product>(`/products/${id}`, data);
        return response.data;
    },

    updateStock: async (id: string, change: number) => {
        const response = await api.patch<Product>(`/products/${id}/stock`, { change });
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/products/${id}`);
    },

    getStockAlerts: async () => {
        const response = await api.get<{
            critical: Product[];
            warning: Product[];
            total: number;
        }>('/products/stock-alerts');
        return response.data;
    },

    addStock: async (id: string, quantity: number) => {
        const response = await api.patch<Product>(`/products/${id}/stock`, { change: quantity });
        return response.data;
    },
};
