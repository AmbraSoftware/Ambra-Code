'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { UserRole } from '@nodum/shared';
import { setAuthToken, removeAuthToken } from '@/lib/auth-utils';

/**
 * Login Unificado com Redirecionamento Inteligente
 * 
 * Detecta automaticamente o tipo de usuário baseado em roles e redireciona:
 * - MERCHANT_ADMIN, SCHOOL_ADMIN -> /dashboard (Manager Mode)
 * - OPERATOR_SALES, OPERATOR_MEAL -> /pos (Operator Mode)
 * 
 * @see AMBRA_CONTEXT.md - Segregação Total de Experiência
 */
export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password
            });

            // Store Token & User (sincroniza com cookies para middleware)
            setAuthToken(response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Redirecionamento Inteligente baseado em Roles
            const userRoles = response.user.roles || [response.user.role].filter(Boolean);
            
            // Verifica se tem role de ADMIN (Manager Mode)
            const isManager = userRoles.some(role => 
                role === UserRole.MERCHANT_ADMIN || 
                role === UserRole.SCHOOL_ADMIN ||
                role === UserRole.SUPER_ADMIN
            );

            // Verifica se tem role de OPERATOR (Operator Mode)
            const isOperator = userRoles.some(role => 
                role === UserRole.OPERATOR_SALES || 
                role === UserRole.OPERATOR_MEAL
            );

            // Redireciona baseado na prioridade: Manager > Operator
            if (isManager) {
                router.push('/dashboard');
            } else if (isOperator) {
                router.push('/pos');
            } else {
                // Usuário sem role válido para este sistema
                alert('Seu perfil não tem acesso ao Ambra Flow. Entre em contato com o administrador.');
                removeAuthToken();
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const msg = error.response?.data?.message || 'Falha ao autenticar. Verifique suas credenciais.';
            alert(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans min-h-screen flex items-center justify-center p-4 lg:p-8 transition-colors duration-300">
            <main className="w-full max-w-5xl bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Left Section: Login Form */}
                <section className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative">
                    <div>
                        <div className="mb-10">
                            <Link href="/">
                                <Logo />
                            </Link>
                            <p className="text-sm font-semibold uppercase tracking-wider text-muted-light dark:text-muted-dark ml-1 mt-4">
                                Acesso ao Sistema
                            </p>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                            Login
                        </h2>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                    htmlFor="email"
                                >
                                    E-mail ou Usuário
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400 text-lg">mail</span>
                                    </div>
                                    <input
                                        className="pl-10 block w-full rounded-lg border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm py-3 transition-shadow outline-none border focus:ring-1"
                                        id="email"
                                        name="email"
                                        placeholder="usuario@escola.com"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                    htmlFor="password"
                                >
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400 text-lg">lock</span>
                                    </div>
                                    <input
                                        className="pl-10 block w-full rounded-lg border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm py-3 transition-shadow outline-none border focus:ring-1"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <Link
                                    href="/login/recovery"
                                    className="text-sm font-medium text-muted-light hover:text-primary transition-colors"
                                >
                                    Esqueci minha senha
                                </Link>
                            </div>

                            <button
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:translate-y-[-1px] cursor-pointer flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                ) : null}
                                {isLoading ? 'Entrando...' : 'Entrar no Ambra Flow'}
                            </button>
                        </form>

                        <div className="mt-8 text-center md:hidden border-t border-border-light dark:border-border-dark pt-6">
                            <p className="text-sm text-gray-500 mb-4">Ainda não tem acesso?</p>
                            <Link href="/register" className="w-full flex justify-center py-2 px-4 bg-gray-50 dark:bg-slate-800 border border-border-light dark:border-border-dark rounded-lg text-primary font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                Cadastre-se
                            </Link>
                        </div>
                    </div>

                    {/* Links moved INSIDE the card, at the bottom */}
                    <div className="mt-10 flex items-center justify-center gap-6 pt-6 border-t border-border-light dark:border-border-dark md:border-t-0 md:pt-0">
                        <Link
                            href="/"
                            className="flex items-center text-xs text-muted-light dark:text-muted-dark hover:text-primary transition-colors gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Voltar ao Início
                        </Link>
                        <span className="text-border-light dark:text-border-dark">|</span>
                        <a
                            href="#"
                            className="flex items-center text-xs text-muted-light dark:text-muted-dark hover:text-primary transition-colors gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">headset_mic</span>
                            Suporte Técnico
                        </a>
                    </div>
                </section>

                {/* Right Section: Marketing/Signup */}
                <section className="hidden md:flex w-full md:w-1/2 bg-gray-50 dark:bg-slate-800/50 p-8 md:p-12 lg:p-16 flex-col justify-center items-start border-l border-border-light dark:border-border-dark relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary-orange/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 max-w-sm">
                        <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-xl shadow-sm flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-600">
                            <span className="material-symbols-outlined text-secondary-orange text-3xl">domain_add</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Ainda não é parceiro?
                        </h2>
                        <p className="text-muted-light dark:text-muted-dark text-lg mb-8 leading-relaxed">
                            Cadastre sua escola e revolucione a gestão da sua cantina. Controle financeiro, gestão de estoque e relatórios detalhados em um só lugar.
                        </p>
                        <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-semibold rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary dark:hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
                            <span>Cadastre-se</span>
                            <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
