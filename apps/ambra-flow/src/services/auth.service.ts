import { api } from './api';

export type RegisterData = {
    profileType: 'school' | 'operator';
    entityName: string;
    taxId: string;
    email: string;
    password: string;
    consentVersion: string;
    termsAccepted: boolean;
    mobilePhone?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    birthDate?: string;
    planId?: string;
};

export const authService = {
    register: async (data: RegisterData) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    login: async (credentials: LoginCredentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    requestPasswordRecovery: async (email: string) => {
        const response = await api.post('/auth/recovery/request', { email });
        return response.data;
    },
};

export type LoginCredentials = {
    email: string;
    password: string;
};

export type LoginResponse = {
    access_token: string;
    user: {
        id: string;
        name: string;
        role: string;
        schoolId?: string;
    };
};

export enum UserRole {
    STUDENT = 'STUDENT',
    GUARDIAN = 'GUARDIAN',
    SCHOOL_ADMIN = 'SCHOOL_ADMIN',
    CANTEEN_OPERATOR = 'CANTEEN_OPERATOR'
}
