// ============================================
// USER TYPES
// ============================================

export type UserRole = 'STUDENT' | 'GUARDIAN';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    createdAt: Date;
}

export interface Student extends User {
    role: 'STUDENT';
    guardianId: string;
    schoolClass: string;
    schoolId: string;
}

export interface Guardian extends User {
    role: 'GUARDIAN';
    students: Student[];
}

// ============================================
// WALLET TYPES
// ============================================

export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    dailyLimit: number;
    credit: number;
    isBlocked: boolean;
    updatedAt: Date;
}

export interface Balance {
    available: number;
    dailyLimit: number;
    credit: number;
    spent: number;
}

// ============================================
// TRANSACTION TYPES (ALINHADO COM BACKEND)
// ============================================

export type TransactionType = 'CASH_IN' | 'PURCHASE' | 'REFUND' | 'ADJUSTMENT';  // ✅ Alinhado com API
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Transaction {
    id: string;
    walletId: string;
    type: TransactionType;
    amount: number;
    description: string;
    createdAt: Date;
    status: TransactionStatus;
    metadata?: Record<string, any>;
}

// ============================================
// PRODUCT TYPES
// ============================================

export type ProductCategory = 'SNACK' | 'DRINK' | 'MEAL' | 'DESSERT';

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: ProductCategory;
    imageUrl?: string;
    isAvailable: boolean;
    nutritionalInfo?: NutritionalInfo;
}

export interface NutritionalInfo {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Cart {
    items: CartItem[];
    total: number;
}

// ============================================
// PARENTAL CONTROLS TYPES
// ============================================

export interface ParentalControls {
    studentId: string;
    dailyLimit: number;
    blockedCategories: ProductCategory[];
    notifyOnLowBalance: boolean;
    lowBalanceThreshold: number;
}

// ============================================
// PIX TYPES
// ============================================

export interface PixPayment {
    id: string;
    amount: number;
    fee: number;
    total: number;
    qrCode: string;
    qrCodeBase64: string;
    pixCopyPaste: string;
    expiresAt: Date;
    status: 'PENDING' | 'PAID' | 'EXPIRED';
}
