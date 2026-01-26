import { api } from './api';
import { Product } from './stock.service';
import { Student } from './students.service';

export interface CreateOrderDto {
    items: {
        productId: string;
        quantity: number;
    }[];
    studentId: string;
}

export const posService = {
    // Get only available products for the POS grid with caching
    getProducts: async () => {
        try {
            const response = await api.get<Product[]>('/products');
            const products = response.data.filter(p => p.isAvailable && p.stock > 0);

            // Cache para offline fallback
            localStorage.setItem('pos_products_cache', JSON.stringify(products));
            localStorage.setItem('pos_products_cache_time', new Date().toISOString());

            return products;
        } catch (error) {
            console.error('API Error, trying cache...', error);
            const cached = localStorage.getItem('pos_products_cache');
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    },

    // Search students by name or card ID (optimized)
    searchStudent: async (query: string) => {
        // [FIX] Use server-side filtering to avoid loading all students
        const response = await api.get<Student[]>('/users', {
            params: {
                role: 'STUDENT',
                search: query, // Assuming backend supports ?search=
                take: 5 // Limit
            }
        });
        return response.data;
    },

    createOrder: async (data: CreateOrderDto) => {
        try {
            const response = await api.post('/orders', data);
            return response.data;
        } catch (error: any) {
            // Check if network error (offline)
            if (!error.response || error.code === 'ERR_NETWORK') {
                console.warn('Offline mode detected. Queuing order...');
                const queue = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]');

                // Add metadata for sync
                const offlineOrder = { ...data, _queuedAt: new Date().toISOString() };
                queue.push(offlineOrder);
                localStorage.setItem('pos_offline_queue', JSON.stringify(queue));

                // Mock success response for UI
                return {
                    id: 'OFFLINE_' + Date.now(),
                    status: 'PENDING_SYNC',
                    orderHash: 'OFFLINE-' + Math.random().toString(36).substring(7)
                };
            }
            throw error;
        }
    },

    // Sync pending orders
    syncQueue: async () => {
        const queue = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]');
        if (queue.length === 0) return 0;

        console.log(`Syncing ${queue.length} offline orders...`);
        const failed: any[] = [];
        let successCount = 0;

        for (const order of queue) {
            try {
                // Remove internal metadata before sending
                const { _queuedAt, ...payload } = order;
                await api.post('/orders', payload);
                successCount++;
            } catch (err: any) {
                console.error('Failed to sync order', order, err);
                // If it's a validation error (400), we probably should drop it or flag it.
                // For now, keep it in queue only if network error
                if (!err.response) failed.push(order);
            }
        }

        localStorage.setItem('pos_offline_queue', JSON.stringify(failed));
        return successCount;
    },

    // [v4.9] Operator History
    getHistory: async () => {
        // Fetches orders completed by the current user (Operator)
        // Using existing endpoint with filters
        const response = await api.get('/canteen/orders', {
            params: {
                status: 'DELIVERED', // Or PAID depending on flow
                take: 50
            }
        });
        return response.data;
    }
};
