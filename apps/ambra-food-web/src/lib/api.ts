import axios from 'axios';

// API Base URL - usar variável de ambiente ou fallback para localhost
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

const normalizeBaseUrl = (value: string) => {
  if (!value) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error('[API CRITICAL] NEXT_PUBLIC_API_URL is NOT defined in production! Requests will fail.');
    }
    return '';
  }

  // Remove slashes extras e garante UM no final
  let trimmed = value.replace(/\/+$/, '');

  // Garantir HTTPS em produção para evitar redirect de POST -> GET
  if (trimmed.startsWith('http://') && !trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
    trimmed = trimmed.replace('http://', 'https://');
  }

  if (trimmed.toLowerCase().endsWith('/api')) {
    trimmed = trimmed.slice(0, -4);
  }

  // O padrão ouro para axios baseURL é terminar com /
  return `${trimmed}/`;
};

const API_BASE_URL = normalizeBaseUrl(rawBaseUrl);
console.log('[API] Initialized with Base URL:', API_BASE_URL || '(relative)');

export { API_BASE_URL };

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

    // Multi-tenancy: backend exige x-tenant-slug
    const tenantSlug =
      typeof window !== 'undefined'
        ? localStorage.getItem('tenantSlug') || 'colegio-elite'
        : 'colegio-elite';
    (config.headers as any)['x-tenant-slug'] = tenantSlug;

    // Telemetria Industrial (Sempre visível para depuração de produção)
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.info(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`, {
      slug: tenantSlug,
      hasToken: !!token
    });

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
  dependentId: string;
}

export interface PixRechargeResponse {
  transactionId: string;
  pixCode: string;
  qrCode: string;
  expiresAt: string;
  totalAmount: number;
  fees: number;
  pixCopyPaste?: string;
  grossAmount?: number;
  netAmount?: number;
}

export interface CashInFees {
  pix: PaymentMethodFee;
  boleto: PaymentMethodFee;
}

export interface PaymentMethodFee {
  customerFeeFixed: number;
  customerFeePercent: number;
}

export interface StoreFavoriteToggleResponse {
  isFavorited: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'SNACK' | 'DRINK' | 'MEAL' | 'DESSERT';
  imageUrl?: string;
  isAvailable: boolean;
}

// API Methods - Removendo slashes iniciais para usar padrão base/path
export const authAPI = {
  login: (data: LoginDto) => api.post<AuthResponse>('auth/login', data),
  logout: () => api.post('auth/logout'),
  getProfile: () => api.get<UserProfile>('auth/profile'),
};

export const walletAPI = {
  getWallet: () => api.get<Wallet>('wallet/me'),
  getTransactions: (limit = 10) => api.get<Transaction[]>(`wallet/transactions?limit=${limit}`),
};

export const productsAPI = {
  getProducts: () => api.get<ApiProduct[]>('products'),
};

export const paymentAPI = {
  createPixRecharge: (data: RechargeDto) => api.post<PixRechargeResponse>('payment/recharge-request', data),
  getFees: () => api.get<CashInFees>('global-admin/cash-in-fees'),
};

export const storeAPI = {
  getFavorites: () => api.get<string[]>('store/favorites'),
  toggleFavorite: (productId: string) =>
    api.post<StoreFavoriteToggleResponse>(`store/favorites/${productId}/toggle`),
};
