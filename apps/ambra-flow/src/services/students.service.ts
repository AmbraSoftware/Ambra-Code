import { api } from './api';
import { User } from './users.service';

export type Student = User;

export const studentsService = {
    getAll: async () => {
        const response = await api.get<Student[]>('/users?role=STUDENT');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Student>(`/users/${id}`);
        return response.data;
    }
};
