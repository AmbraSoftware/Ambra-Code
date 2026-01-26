'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login/operator'); // Or generic login
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return null; // Or a loading spinner
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col">
            {/* POS Header (Minimal) */}
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">point_of_sale</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Ambra<span className="text-primary">POS</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/50">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Sistema Online</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Caixa 01</span>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
