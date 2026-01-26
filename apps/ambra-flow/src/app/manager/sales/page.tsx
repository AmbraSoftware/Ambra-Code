'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function SalesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Vendas (PDV)</h1>
            <Card className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                <span className="material-symbols-outlined text-6xl text-muted-light mb-4">point_of_sale</span>
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Ponto de Venda em Construção</h2>
                <p className="text-muted-light dark:text-muted-dark max-w-md">
                    O módulo de vendas rápidas para operadores de caixa está sendo preparado.
                    Em breve você poderá realizar vendas diretas por aqui.
                </p>
            </Card>
        </div>
    );
}
