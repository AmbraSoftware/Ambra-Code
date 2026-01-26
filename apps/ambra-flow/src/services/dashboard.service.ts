import { api } from './api';

export interface DashboardMetrics {
    orders: {
        lastHour: number;
        lastDay: number;
        lastWeek: number;
    };
    revenue: {
        lastHour: number;
        lastDay: number;
        lastWeek: number;
    };
    users: {
        active24h: number;
        totalStudents: number;
    };
    inventory: {
        lowStock: number;
        totalProducts: number;
    };
    system: {
        uptime: number;
    };
}

export const dashboardService = {
    getMetrics: async () => {
        const response = await api.get<DashboardMetrics>('/dashboard/metrics');
        return response.data;
    },

    getTopProducts: async (limit = 5) => {
        const response = await api.get<{ name: string; totalSold: number; revenue: number }[]>('/metrics/top-products', { params: { limit } });
        return response.data;
    },

    // [v4.5] Stock Alerts - Business Intelligence
    getStockAlerts: async () => {
        const response = await api.get<StockAlert[]>('/dashboard/stock-alerts');
        return response.data;
    },

    getSalesChart: async (period: 'day' | 'week' | 'month' = 'day') => {
        const response = await api.get<{ time: string; value: number }[]>('/dashboard/sales-chart', { params: { period } });
        return response.data;
    },

    linkSchool: async (accessCode: string) => {
        const response = await api.post('/operators/link-school', { accessCode });
        return response.data;
    }
};

export interface StockAlert {
    id: string;
    name: string;
    category: string;
    stock: number;
    minStockAlert: number;
    imageUrl: string | null;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}
