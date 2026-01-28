'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Plus, User } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname();

  // Não mostrar bottom bar no login
  const showBottomBar = pathname !== '/login';

  const navItems = [
    { href: '/', icon: Wallet, label: 'Carteira' },
    { href: '/recharge', icon: Plus, label: 'Recarregar' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto scroll-smooth-mobile">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      {showBottomBar && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border safe-bottom z-50">
          <div className="app-container">
            <div className="flex items-center justify-around h-16">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[60px] transition-colors no-select ${
                      isActive ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
