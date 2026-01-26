'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

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
        // Simple Auth Guard
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login/operator');
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            // In a real app, check role here too
            setUser(userData);
            setIsAuthorized(true);
        } catch (e) {
            router.push('/login/operator');
        }
    }, [router]);

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black/90 font-sans transition-colors duration-200">
            {/* Operator Sidebar - Icon Focused for Touch */}
            <aside className="w-20 lg:w-24 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col items-center py-6 shadow-xl z-20">
                <div className="mb-8">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-white text-2xl">point_of_sale</span>
                    </div>
                </div>

                <nav className="flex-1 w-full space-y-4 px-2 flex flex-col items-center">
                    <TooltipNavLink href="/pos" icon="shopping_cart_checkout" label="POS (Venda)" active={pathname?.startsWith('/pos')} />
                    <TooltipNavLink href="/operator/queue" icon="list_alt" label="Fila / Cozinha" active={pathname?.includes('/queue')} />
                    <TooltipNavLink href="/operator/history" icon="history" label="Histórico" active={pathname?.includes('/history')} />

                    <div className="w-full h-px bg-border-light dark:bg-border-dark my-2"></div>

                    <TooltipNavLink href="/operator/settings" icon="settings" label="Config" active={pathname?.includes('/settings')} />
                </nav>

                <div className="mt-auto">
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            router.push('/login/operator');
                        }}
                        className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 active:scale-90"
                        title="Sair"
                    >
                        <span className="material-symbols-outlined text-2xl">logout</span>
                    </button>
                    <div className="mt-2 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border-2 border-primary">
                        {user.name?.charAt(0) || 'OP'}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
                {/* Top Bar (Optional, mostly for connectivity status or quick info, can be hidden for full POS immersion) */}
                {/* <header className="h-14 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-6">
                    <span className="font-bold text-gray-700 dark:text-gray-200">{user.name}</span>
                    <Badge variant="success" icon="wifi">Online</Badge>
                 </header> */}

                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-black/90 p-4 lg:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

function TooltipNavLink({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`
                group relative w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-2xl transition-all duration-300
                ${active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-primary'
                }
            `}
        >
            <span className="material-symbols-outlined text-[26px] lg:text-[28px]">{icon}</span>

            {/* Tooltip */}
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                {label}
            </span>
        </Link>
    )
}
