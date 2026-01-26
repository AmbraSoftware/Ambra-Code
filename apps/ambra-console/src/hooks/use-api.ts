
import useSWR from 'swr';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';

// --- Types ---
import type { System, School, Operator, Client, Plan } from '@/types';

export interface ApiError {
    message: string;
    statusCode: number;
}

// --- Fetcher ---
const fetcher = async (url: string) => {
    const response = await api.get(url);
    return response.data;
};

// --- Hooks ---

export function useSystems() {
    const { data, error, isLoading, mutate } = useSWR<System[]>('/platform/systems', fetcher);
    return {
        systems: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

export function useSchools(systemId?: string) {
    // If systemId is provided, we can filter (backend needs to support this if we want specific system schools, 
    // but usually /schools returns all schools for the tenant context)
    const { data, error, isLoading, mutate } = useSWR<School[]>('/tenancy/schools', fetcher);
    return {
        schools: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

export function useCanteens(schoolId?: string) {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    const { data, error, isLoading, mutate } = useSWR<any[]>(`/tenancy/canteens${query}`, fetcher);
    return {
        canteens: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

export function usePlans() {
    const { data, error, isLoading } = useSWR<Plan[]>('/platform/plans', fetcher);
    return {
        plans: data || [],
        isLoading,
        isError: error
    };
}

export function useUsers(role?: string) {
    const query = role ? `?role=${role}` : '';
    // Determines return type based on role (Operator vs Client/User) - simplistic approach
    // In a stricter setup, we might split hooks.
    const { data, error, isLoading, mutate } = useSWR<any[]>(`/users${query}`, fetcher);
    return {
        users: data || [], // Consumers should cast or we refine further
        isLoading,
        isError: error,
        mutate
    };
}

// Generic Hook for any endpoint
export function useFetch<T>(endpoint: string | null) {
    const { data, error, isLoading, mutate } = useSWR<T>(endpoint, fetcher);
    return {
        data,
        isLoading,
        isError: error,
        mutate
    };
}
