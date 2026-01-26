/**
 * AMBRA FOOD API CLIENT
 * Centralizador de requisições HTTP para o Backend Nodum.
 * Configurado com Interceptors para Autenticação (JWT) e Tratamento de Erros.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333',
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
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Erro ao recuperar token:', error);
    }
    return config;
});

/**
 * Response Interceptor
 * Gerencia o ciclo de vida da sessão (Auto-Logout em 401).
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Tratamento de erros globais
        if (error.response && error.response.status === 401) {
            // Se receber 401 (Unauthorized), força logout limpo
            try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                
                // Redireciona para a tela de login
                // Verifica se já não está na tela de login para evitar loop (opcional, mas boa prática)
                router.replace('/(auth)/login');
            } catch (storageError) {
                console.error('Erro ao limpar sessão:', storageError);
            }
        }
        return Promise.reject(error);
    }
);
