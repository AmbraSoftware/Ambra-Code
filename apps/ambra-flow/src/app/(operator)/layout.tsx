'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { removeAuthToken } from '@/lib/auth-utils';

/**
 * Layout Operator Mode (Kiosk)
 * 
 * Layout fullscreen sem sidebar para operadores.
 * Acesso restrito a: OPERATOR_SALES, OPERATOR_MEAL
 * 
 * Design focado em execução rápida e imersiva.
 * 
 * @see AMBRA_CONTEXT.md - Segregação Total de Experiência
 */
export default function OperatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Auth Guard com validação de Role
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            const userRoles = userData.roles || [userData.role].filter(Boolean);

            // Verifica se tem role de Operator
            const isOperator = userRoles.some((role: string) => 
                role === 'OPERATOR_SALES' || role === 'OPERATOR_MEAL'
            );

            if (!isOperator) {
                // Usuário sem permissão - redireciona para login
                alert('Você não tem permissão para acessar esta área.');
                removeAuthToken();
                router.push('/login');
                return;
            }

            setUser(userData);
            setIsAuthorized(true);
        } catch (e) {
            console.error('Failed to parse user', e);
            router.push('/login');
        }
    }, [router]);

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black/90 font-sans transition-colors duration-200 overflow-hidden">
            {/* Minimal Top Bar - Apenas botão de sair discreto */}
            <div className="absolute top-0 right-0 z-50 p-4">
                <button
                    onClick={() => {
                        if (confirm('Deseja realmente sair?')) {
                            removeAuthToken();
                            router.push('/login');
                        }
                    }}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Sair"
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                </button>
            </div>

            {/* Main Content Area - Fullscreen */}
            <main className="flex-1 overflow-hidden relative flex flex-col w-full">
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-black/90">
                    {children}
                </div>
            </main>
        </div>
    );
}
