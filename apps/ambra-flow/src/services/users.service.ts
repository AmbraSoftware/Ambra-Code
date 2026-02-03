import { api } from './api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string; // Legacy single role
    roles?: string[]; // Multi-role support
    class?: string;
    profile?: {
        class?: string;
        restrictions?: string[];
        dailyLimit?: number;
    };
    wallet?: {
        balance: number;
    };
    imageUrl?: string;
    avatarUrl?: string;
    createdAt: string;
    // Guardian specific
    dependents?: User[];
    mobilePhone?: string;
    taxId?: string;
}

export interface CreateUserDto {
    name: string;
    email?: string;
    password?: string;
    role: string; // Aceita qualquer role válida (STUDENT, GUARDIAN, OPERATOR_SALES, OPERATOR_MEAL, etc.)
    profile?: {
        class?: string;
        restrictions?: string[];
        dailyLimit?: number;
    };
    // Guardian
    mobilePhone?: string;
    taxId?: string;
}

// export interface UpdateUserDto extends Partial<CreateUserDto> { }
export type UpdateUserDto = Partial<CreateUserDto>;

export const usersService = {
    getAll: async (params?: { role?: string; filter?: string }) => {
        const query = new URLSearchParams();
        if (params?.role) query.append('role', params.role);
        if (params?.filter) query.append('filter', params.filter);

        const response = await api.get<User[]>(`/users?${query.toString()}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: CreateUserDto) => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    bulkCreate: async (data: { users: CreateUserDto[] }) => {
        const response = await api.post<{ created: number; errors: unknown[]; details: unknown[] }>('/users/bulk', data);
        return response.data;
    },

    update: async (id: string, data: UpdateUserDto) => {
        const response = await api.patch<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/users/${id}`);
    },

    getStats: async () => {
        const response = await api.get<{ total: number; negativeBalance: number; inactive30d: number }>('/users/stats');
        return response.data;
    },
};
