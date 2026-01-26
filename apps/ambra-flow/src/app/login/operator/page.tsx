'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import Logo from '@/components/ui/Logo';

export default function OperatorLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', formData);

            // Store auth data
            localStorage.setItem('token', data.token); // IMPORTANT: Key must be 'token' for api.ts interceptor
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role (Operator -> POS)
            if (data.user.role === 'CANTEEN_OPERATOR' || data.user.role === 'SCHOOL_MANAGER') {
                router.push('/pos');
            } else {
                alert('Este perfil não tem acesso ao PDV.');
            }
        } catch (error: any) {
            console.error('Login failed', error);
            alert('Falha no login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center transition-colors duration-200">
            <div className="mb-8 text-center">
                <Link href="/" className="inline-block mb-2">
                    <Logo />
                </Link>
                <p className="text-muted-light dark:text-muted-dark text-sm font-medium uppercase tracking-wider mt-2">
                    Gestão de Cantina Escolar
                </p>
            </div>

            <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
                {/* Left Section: Login Form */}
                <div className="p-8 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark relative">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">Acesso Operador</h2>
                        <p className="text-sm text-muted-light dark:text-muted-dark mt-1">Informe suas credenciais de caixa.</p>
                    </div>
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label
                                className="block text-sm font-medium text-text-light dark:text-text-dark mb-1"
                                htmlFor="email"
                            >
                                E-mail ou Usuário
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-muted-light dark:text-muted-dark text-lg">person</span>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-black/20 text-text-light dark:text-text-dark placeholder-muted-light dark:placeholder-muted-dark focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all outline-none"
                                    id="email"
                                    name="email"
                                    placeholder="operador@escola.com"
                                    type="text"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label
                                    className="block text-sm font-medium text-text-light dark:text-text-dark"
                                    htmlFor="password"
                                >
                                    Senha
                                </label>
                            </div>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-muted-light dark:text-muted-dark text-lg">lock</span>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-black/20 text-text-light dark:text-text-dark placeholder-muted-light dark:placeholder-muted-dark focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all outline-none"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    className="h-4 w-4 text-primary focus:ring-primary border-border-light dark:border-border-dark rounded bg-background-light dark:bg-surface-dark"
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                />
                                <label
                                    className="ml-2 block text-sm text-muted-light dark:text-muted-dark"
                                    htmlFor="remember-me"
                                >
                                    Lembrar terminal
                                </label>
                            </div>
                            <Link
                                href="/login/recovery"
                                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                            >
                                Esqueci a senha
                            </Link>
                        </div>
                        <button
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar no Ambra Flow'}
                        </button>
                    </form>
                </div>

                {/* Right Section: NFC / Quick Access */}
                <div className="p-8 md:p-10 bg-gray-50 dark:bg-black/20 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500"></div>
                    <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="mb-6 relative">
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping opacity-75"></div>
                            <div className="absolute inset-[-10px] border border-primary/10 rounded-full"></div>
                            <div className="w-24 h-24 bg-surface-light dark:bg-surface-dark rounded-full shadow-lg border-4 border-primary/10 cursor-pointer hover:border-primary transition-colors duration-300 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-primary">nfc</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">Acesso Rápido</h3>
                        <p className="text-sm text-muted-light dark:text-muted-dark max-w-[240px] leading-relaxed">
                            Aproxime seu crachá de operador ou pulseira RFID no leitor para entrar instantaneamente.
                        </p>
                        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-muted-light dark:text-muted-dark uppercase tracking-wide">
                                Leitor Ativo
                            </span>
                        </div>
                    </div>
                    <div className="absolute bottom-6 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                        {/* Abstract icon or pattern could go here */}
                    </div>
                </div>
            </main>

            <div className="mt-8 flex items-center justify-center gap-6">
                <Link
                    href="/"
                    className="flex items-center text-sm text-muted-light dark:text-muted-dark hover:text-primary transition-colors gap-1"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Voltar ao Início
                </Link>
                <span className="text-border-light dark:text-border-dark">|</span>
                <a
                    href="#"
                    className="flex items-center text-sm text-muted-light dark:text-muted-dark hover:text-primary transition-colors gap-1"
                >
                    <span className="material-symbols-outlined text-sm">headset_mic</span>
                    Suporte Técnico
                </a>
            </div>
        </div>
    );
}
