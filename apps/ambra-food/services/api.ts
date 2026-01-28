/**
 * AMBRA FOOD API CLIENT
 * Centralizador de requisições HTTP para o Backend Nodum.
 * Configurado com Interceptors para Autenticação (JWT) e Tratamento de Erros.
 */
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { LoginDto, AuthResponse, Wallet, Transaction, PixRechargeResponse, RechargeDto, CashInFees } from '../types';

// ⚠️ IMPORTANTE: Substitua pelo IP da sua máquina na rede local
// Para descobrir seu IP: ipconfig (Windows) ou ifconfig (Mac/Linux)
// Exemplo: 'http://192.168.1.100:3333'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.15.9:3333';

export const api = axios.create({
    baseURL: API_BASE_URL,
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
    async (error: AxiosError) => {
        // Tratamento de erros globais
        if (error.response && error.response.status === 401) {
            // Se receber 401 (Unauthorized), força logout limpo
            try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                
                // Redireciona para a tela de login
                router.replace('/(auth)/login');
            } catch (storageError) {
                console.error('Erro ao limpar sessão:', storageError);
            }
        }
        return Promise.reject(error);
    }
);

// ========================================
// API METHODS (Tipados para o MVP)
// ========================================

/**
 * Autenticação
 */
export const authAPI = {
    /**
     * Realiza login e retorna token + dados do usuário
     */
    login: async (credentials: LoginDto): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/login', credentials);
        return data;
    },
};

/**
 * Carteira (Wallet)
 */
export const walletAPI = {
    /**
     * Busca a carteira do usuário autenticado
     */
    getMyWallet: async (): Promise<Wallet> => {
        const { data } = await api.get<Wallet>('/wallet/me');
        return data;
    },
    
    /**
     * Busca transações da carteira
     */
    getMyTransactions: async (): Promise<Transaction[]> => {
        const { data } = await api.get<Transaction[]>('/wallet/me/transactions');
        return data;
    },
};

/**
 * Recarga (Cash-In)
 */
export const paymentAPI = {
    /**
     * Solicita recarga via PIX
     */
    createPixRecharge: async (rechargeData: RechargeDto): Promise<PixRechargeResponse> => {
        const { data } = await api.post<PixRechargeResponse>('/payment/recharge-request', rechargeData);
        return data;
    },
    
    /**
     * Busca as taxas de recarga configuradas
     */
    getCashInFees: async (): Promise<CashInFees> => {
        const { data } = await api.get<CashInFees>('/global-admin/cash-in-fees');
        return data;
    },
};
