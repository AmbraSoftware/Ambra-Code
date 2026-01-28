'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { LayoutDashboard, Utensils, Users, Megaphone, Package, Store, DollarSign, Settings, LogOut, Menu, X, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { UserRole } from '@nodum/shared';
import { removeAuthToken } from '@/lib/auth-utils';

/**
 * Layout Manager Mode
 * 
 * Layout administrativo com Sidebar completa para gestores.
 * Acesso restrito a: MERCHANT_ADMIN, SCHOOL_ADMIN, SUPER_ADMIN
 * 
 * @see AMBRA_CONTEXT.md - Segregação Total de Experiência
 */
export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

            // Verifica se tem role de Manager
            const isManager = userRoles.some((role: string) => 
                role === UserRole.MERCHANT_ADMIN || 
                role === UserRole.SCHOOL_ADMIN ||
                role === UserRole.SUPER_ADMIN ||
                role === 'MERCHANT_ADMIN' ||
                role === 'SUPER_ADMIN'
            );

            if (!isManager) {
                // Usuário sem permissão - redireciona para login
                alert('Você não tem permissão para acessar esta área.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
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

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (!isAuthorized) {
        return null; // Don't render anything while checking/redirecting
    }

    const navItems = [
        { section: 'Visão Geral', items: [{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }] },
        {
            section: 'Gestão Escolar',
            items: [
                { href: '/dashboard/menu', icon: Utensils, label: 'Produtos de Venda' },
                { href: '/dashboard/school-meals', icon: Utensils, label: 'Merenda Escolar' },
                { href: '/dashboard/users', icon: Users, label: 'Usuários' },
                { href: '/dashboard/staff', icon: UserCog, label: 'Operadores' },
                { href: '/dashboard/communication', icon: Megaphone, label: 'Comunicação' },
                { href: '/dashboard/stock', icon: Package, label: 'Estoque' },
            ]
        },
        {
            section: 'Administrativo',
            items: [
                { href: '/dashboard/canteens', icon: Store, label: 'Unidades' },
                { href: '/dashboard/financial', icon: DollarSign, label: 'Financeiro' },
                { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
            ]
        }
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark">
            <div className="p-6">
                <Logo />
            </div>
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((group, idx) => (
                    <div key={idx} className="mb-6">
                        <p className="px-2 text-xs font-bold text-muted-light dark:text-muted-dark uppercase tracking-wider mb-2 mt-2">
                            {group.section}
                        </p>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                active={pathname === item.href}
                            />
                        ))}
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t border-border-light dark:border-border-dark">
                <button
                    onClick={() => {
                        removeAuthToken();
                        router.push('/login');
                    }}
                    className="flex items-center gap-3 w-full px-2 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black/90 font-sans transition-colors duration-200">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 h-full fixed inset-y-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full z-40 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
                <Logo />
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 md:hidden bg-surface-light dark:bg-surface-dark shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={cn(
                "flex-1 overflow-y-auto min-h-screen",
                "md:pl-64", // Space for desktop sidebar
                "pt-16 md:pt-0" // Space for mobile header
            )}>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
            )}
        >
            <Icon className="w-5 h-5" />
            {label}
        </Link>
    )
}
