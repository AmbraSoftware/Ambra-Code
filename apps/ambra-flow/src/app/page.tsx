'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

/**
 * Landing Page com Redirecionamento Inteligente
 * 
 * Se o usuário estiver logado, redireciona automaticamente:
 * - Admins -> /dashboard
 * - Operadores -> /pos
 * - Deslogados -> Mostra a página de escolha de perfil
 */
export default function LandingPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Verifica se há token e usuário logado
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            // Usuário não logado - mostra a página de escolha
            setIsChecking(false);
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            const userRoles = userData.roles || [userData.role].filter(Boolean);

            // Verifica se é Manager
            const isManager = userRoles.some((role: string) => 
                role === 'MERCHANT_ADMIN' ||
                role === 'SCHOOL_ADMIN' ||
                role === 'SUPER_ADMIN' ||
                role === 'SUPER_ADMIN'
            );

            // Verifica se é Operator
            const isOperator = userRoles.some((role: string) => 
                role === 'OPERATOR_SALES' || role === 'OPERATOR_MEAL'
            );

            // Redireciona baseado no role
            if (isManager) {
                router.push('/dashboard');
            } else if (isOperator) {
                router.push('/pos');
            } else {
                // Role desconhecido - mostra página de escolha
                setIsChecking(false);
            }
        } catch (e) {
            console.error('Failed to parse user data', e);
            // Erro ao parsear - mostra página de escolha
            setIsChecking(false);
        }
    }, [router]);

    // Mostra loading enquanto verifica autenticação
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">progress_activity</span>
                    <p className="text-muted-light dark:text-muted-dark">Carregando...</p>
                </div>
            </div>
        );
    }

    // Página de escolha de perfil (usuário não logado ou role desconhecido)
    return (
        <>
            <header className="w-full px-6 py-6 md:px-12 flex justify-between items-center absolute top-0 left-0 z-10">
                <div className="select-none">
                    <Logo variant="horizontal" width={120} height={40} />
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center px-4 py-24 w-full max-w-7xl mx-auto relative">
                <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in-up">
                    <div className="mb-12 text-center max-w-2xl">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                            Escolha seu perfil
                        </h1>
                        <p className="text-muted-light dark:text-muted-dark text-lg font-normal">
                            Selecione o ambiente de trabalho para iniciar sua sessão.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        {/* Card Gestão */}
                        <div className="group relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-8 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer flex flex-col h-full">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-3xl group-hover:text-primary transition-colors">
                                        analytics
                                    </span>
                                </div>
                                <span className="px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-100 dark:border-slate-700 tracking-wide">
                                    GESTÃO
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                Painel do Gestor
                            </h3>
                            <p className="text-muted-light dark:text-muted-dark mb-10 text-sm leading-relaxed">
                                Acesso completo a relatórios financeiros, controle de estoque, gestão de contratos e indicadores de desempenho.
                            </p>
                            <div className="mt-auto pt-6 border-t border-dashed border-border-light dark:border-border-dark">
                                <Link href="/login" className="w-full py-3.5 px-4 bg-transparent border border-border-light dark:border-border-dark rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 flex items-center justify-between group-hover:border-primary/30 group-hover:text-primary cursor-pointer">
                                    <span>Acessar Gestão</span>
                                    <span className="material-symbols-outlined text-xl">
                                        arrow_forward
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Card Operacional */}
                        <div className="group relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-8 hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer flex flex-col h-full ring-0 ring-primary/0 hover:ring-1 hover:ring-primary/20">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 bg-orange-50 dark:bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                                    <span className="material-symbols-outlined text-primary text-3xl group-hover:text-white transition-colors">
                                        point_of_sale
                                    </span>
                                </div>
                                <span className="px-3 py-1 text-xs font-bold bg-orange-50 dark:bg-primary/10 text-primary rounded-full border border-orange-100 dark:border-primary/20 tracking-wide">
                                    OPERACIONAL
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                Frente de Caixa
                            </h3>
                            <p className="text-muted-light dark:text-muted-dark mb-10 text-sm leading-relaxed">
                                Ambiente otimizado para operação diária. Vendas rápidas, leitura de cartões e fechamento de caixa simplificado.
                            </p>
                            <div className="mt-auto pt-6 border-t border-dashed border-border-light dark:border-border-dark">
                                <Link href="/login" className="w-full py-3.5 px-4 bg-primary text-white border border-primary rounded-lg font-semibold hover:bg-primary-hover shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center justify-between transform group-hover:-translate-y-0.5 cursor-pointer">
                                    <span>Iniciar Operação</span>
                                    <span className="material-symbols-outlined text-xl">bolt</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full py-6 text-center text-sm text-muted-light dark:text-muted-dark bg-transparent">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs opacity-70">
                        © 2025 Ambra Flow. Tecnologia Nodum.
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium opacity-60">
                        <a className="hover:text-primary transition-colors" href="#">
                            Ajuda
                        </a>
                        <span className="text-border-dark/20">•</span>
                        <a className="hover:text-primary transition-colors" href="#">
                            Privacidade
                        </a>
                    </div>
                </div>
            </footer>
        </>
    );
}
