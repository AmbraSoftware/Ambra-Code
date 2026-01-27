'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function OrdersPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Pedidos</h1>
            <Card className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                <span className="material-symbols-outlined text-6xl text-muted-light mb-4">receipt_long</span>
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Central de Pedidos</h2>
                <p className="text-muted-light dark:text-muted-dark max-w-md">
                    Visualize e gerencie os pedidos realizados pelos alunos através do aplicativo.
                    Esta funcionalidade estará disponível na próxima atualização.
                </p>
            </Card>
        </div>
    );
}
