import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@nodum/shared';

/**
 * Middleware de Proteção de Rotas
 * 
 * Implementa a Segregação Total de Experiência:
 * - Manager routes (/dashboard/*) -> Apenas MERCHANT_ADMIN, SCHOOL_ADMIN, SUPER_ADMIN
 * - Operator routes (/pos, /queue, /history, /settings) -> Apenas OPERATOR_SALES, OPERATOR_MEAL
 * 
 * IMPORTANTE: Route Groups (manager) e (operator) NÃO aparecem na URL final.
 * As URLs são: /dashboard/* para managers e /pos, /queue, etc. para operators.
 * 
 * @see AMBRA_CONTEXT.md - Segregação Total de Experiência
 */

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/register', '/legal', '/api'];

// Rotas de Manager (requerem roles de admin)
// Protege /dashboard e todas as sub-rotas
const managerRoutes = ['/dashboard'];

// Rotas de Operator (requerem roles de operador)
// IMPORTANTE: /settings do operator é diferente de /dashboard/settings do manager
const operatorRoutes = ['/pos', '/queue', '/history'];

// Rotas de Operator que podem conflitar com Manager (precisam de validação especial)
const operatorSpecificRoutes = ['/settings']; // Apenas operator, não manager

// Roles permitidas para Manager Mode
const managerRoles = [
    UserRole.MERCHANT_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.SUPER_ADMIN,
    // Legacy roles para compatibilidade
    'MERCHANT_ADMIN',
    'SUPER_ADMIN',
];

// Roles permitidas para Operator Mode
const operatorRoles = [
    UserRole.OPERATOR_SALES,
    UserRole.OPERATOR_MEAL,
    // Legacy roles para compatibilidade
    'OPERATOR_SALES',
    'OPERATOR_MEAL',
];

/**
 * Verifica se uma rota é protegida (manager ou operator)
 */
function isProtectedRoute(pathname: string): boolean {
    // Verifica rotas de manager
    if (managerRoutes.some(route => pathname.startsWith(route))) {
        return true;
    }
    
    // Verifica rotas de operator
    if (operatorRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        return true;
    }
    
    // Verifica rotas específicas de operator (que podem conflitar)
    // /settings sem prefixo /dashboard é rota de operator
    if (operatorSpecificRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        // Se não começa com /dashboard, é rota de operator
        if (!pathname.startsWith('/dashboard')) {
            return true;
        }
    }
    
    return false;
}

/**
 * Verifica se a rota é de manager
 */
function isManagerRoute(pathname: string): boolean {
    return managerRoutes.some(route => pathname.startsWith(route));
}

/**
 * Verifica se a rota é de operator
 */
function isOperatorRoute(pathname: string): boolean {
    // Rotas explícitas de operator
    if (operatorRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        return true;
    }
    
    // /settings sem prefixo /dashboard é rota de operator
    if (operatorSpecificRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        if (!pathname.startsWith('/dashboard')) {
            return true;
        }
    }
    
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Permite rotas públicas
    if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        return NextResponse.next();
    }

    // Permite a rota raiz (será tratada no client-side)
    if (pathname === '/') {
        return NextResponse.next();
    }

    // Verifica se é uma rota protegida
    if (!isProtectedRoute(pathname)) {
        return NextResponse.next();
    }

    // Tenta obter token do cookie
    const token = request.cookies.get('token')?.value;
    
    // Se não tem token, redireciona para login
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Tenta obter dados do usuário do cookie (se disponível)
    // Nota: Em produção, você pode decodificar o JWT aqui para validar roles no servidor
    // Por enquanto, a validação de roles é feita no client-side (layouts)
    // O middleware serve como primeira camada de proteção (verifica autenticação)
    
    // Validação de role será feita no client-side (nos layouts)
    // O middleware serve como primeira linha de defesa (verifica token)
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
