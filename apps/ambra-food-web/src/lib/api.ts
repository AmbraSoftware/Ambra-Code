import axios from 'axios';

// API Base URL - usar variável de ambiente ou fallback para localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// Axios instance com configuração base
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Wallet {
  id: string;
  balance: number;
  dailyLimit: number;
  creditLimit: number;
  allowedDays: number[];
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
}

export interface Transaction {
  id: string;
  type: 'CASH_IN' | 'PURCHASE' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  description: string;
  createdAt: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface RechargeDto {
  amount: number;
  paymentMethod: 'pix' | 'boleto';
}

export interface PixRechargeResponse {
  transactionId: string;
  pixCode: string;
  qrCode: string;
  expiresAt: string;
  totalAmount: number;
  fees: number;
}

export interface CashInFees {
  pix: PaymentMethodFee;
  boleto: PaymentMethodFee;
}

export interface PaymentMethodFee {
  customerFeeFixed: number;
  customerFeePercent: number;
}

// API Methods
export const authAPI = {
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get<UserProfile>('/auth/profile'),
};

export const walletAPI = {
  getWallet: () => api.get<Wallet>('/wallet'),
  getTransactions: (limit = 10) => api.get<Transaction[]>(`/wallet/transactions?limit=${limit}`),
};

export const paymentAPI = {
  createPixRecharge: (data: RechargeDto) => api.post<PixRechargeResponse>('/payment/pix-recharge', data),
  getFees: () => api.get<CashInFees>('/global-admin/cash-in-fees'),
};
