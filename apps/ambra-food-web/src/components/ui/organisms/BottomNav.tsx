'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Store, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    {
        href: '/',
        label: 'Carteira',
        icon: <Wallet className="h-6 w-6" />,
    },
    {
        href: '/store',
        label: 'Loja',
        icon: <Store className="h-6 w-6" />,
    },
    {
        href: '/settings',
        label: 'Config',
        icon: <Settings className="h-6 w-6" />,
    },
    {
        href: '/profile',
        label: 'Perfil',
        icon: <User className="h-6 w-6" />,
    },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 ios-blur border-t border-gray-200 dark:border-white/10 safe-area-bottom z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center w-full gap-1 transition-colors touch-target',
                                isActive
                                    ? 'text-brand-primary'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-brand-primary'
                            )}
                        >
                            <div className={cn(isActive && '[&>svg]:fill-current')}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
