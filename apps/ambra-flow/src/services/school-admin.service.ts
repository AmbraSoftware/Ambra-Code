import { api } from './api';

export interface SchoolConfig {
    customDomain?: string;
    theme?: {
        primaryColor?: string;
        logoUrl?: string;
    };
    financial?: {
        allowNegativeBalance?: boolean;
        defaultCreditLimit?: number;
    };
    operational?: {
        blockSalesOutsideHours?: boolean;
        openingTime?: string;
        closingTime?: string;
    };
}

export const schoolAdminService = {
    async getSchool() {
        const response = await api.get<{ config: SchoolConfig }>('/school-admin/config');
        return response.data;
    },

    // Atualiza configurações
    updateConfig: async (config: SchoolConfig) => {
        const response = await api.patch('/school-admin/config', config);
        return response.data;
    }
};
