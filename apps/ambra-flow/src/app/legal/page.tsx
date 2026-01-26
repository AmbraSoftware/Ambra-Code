'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import LegalContent from '@/components/legal/LegalContent';

export default function LegalPage() {
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

    return (
        <div className="font-sans bg-background-light dark:bg-background-dark min-h-screen flex flex-col transition-colors duration-200">
            {/* Header */}
            <header className="flex items-center justify-between px-6 lg:px-10 py-4 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark shrink-0 z-20 shadow-sm">
                <Link href="/" className="flex items-center gap-3">
                    <Logo />
                </Link>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-light dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-[20px]">print</span>
                        <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-light dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        <span className="hidden sm:inline">Baixar PDF</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6 lg:p-8 overflow-hidden">
                <div className="w-full max-w-[960px] bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark flex flex-col h-full max-h-[80vh] overflow-hidden">

                    {/* Tabs Header */}
                    <div className="flex border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-slate-900/50">
                        <button
                            onClick={() => setActiveTab('terms')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'terms'
                                ? 'border-primary text-primary bg-surface-light dark:bg-surface-dark'
                                : 'border-transparent text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            Termos de Uso
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'privacy'
                                ? 'border-primary text-primary bg-surface-light dark:bg-surface-dark'
                                : 'border-transparent text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            Política de Privacidade
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <LegalContent activeTab={activeTab} />
                </div>

                {/* Footer / Back Link */}
                <div className="mt-8 text-center">
                    <Link href="/login/manager" className="text-sm font-medium text-muted-light dark:text-muted-dark hover:text-primary transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar para Login
                    </Link>
                </div>
            </main>
        </div>
    );
}
