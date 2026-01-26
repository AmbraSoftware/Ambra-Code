import { api } from './api';
import { UserRole } from './auth.service';

export interface Announcement {
    id: string;
    title: string;
    message: string;
    targetRole: UserRole;
    scope: 'GLOBAL' | 'GOVERNMENT' | 'SYSTEM' | 'SCHOOL' | 'INDIVIDUAL';
    status: string;
    createdAt: string;
    author?: {
        name: string;
    };
}

export interface CreateAnnouncementDto {
    title: string;
    message: string;
    targetRole: UserRole;
    scope: 'GLOBAL' | 'GOVERNMENT' | 'SYSTEM' | 'SCHOOL' | 'INDIVIDUAL';
    targetIds?: string[];
}

export const announcementsService = {
    getAll: async () => {
        const response = await api.get<Announcement[]>('/announcements');
        return response.data;
    },

    create: async (data: CreateAnnouncementDto) => {
        const response = await api.post<Announcement>('/announcements', data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/announcements/${id}`);
    }
};
