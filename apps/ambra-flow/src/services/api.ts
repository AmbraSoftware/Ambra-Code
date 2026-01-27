/**
 * AMBRA API CLIENT
 * Centralizador de requisições HTTP para o Backend Nodum.
 * Configurado com Interceptors para Autenticação (JWT) e Tratamento de Erros.
 */
import axios from 'axios';
import { removeAuthToken } from '@/lib/auth-utils';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
    headers: {
        'Content-Type': 'application/json',
    },
    // Timeout para evitar requisições presas em conexões lentas (Mobile/3G)
    timeout: 30000, 
});

/**
 * Request Interceptor
 * Injeta o Token JWT em todas as requisições autenticadas.
 */
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

/**
 * Response Interceptor
 * Gerencia o ciclo de vida da sessão (Auto-Logout em 401).
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Tratamento de erros globais
        if (error.response && error.response.status === 401) {
            // Se receber 401 (Unauthorized), força logout limpo
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                // Previne loop de redirecionamento se já estiver no login
                removeAuthToken();
                // Redireciona para a página de login
                window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);

