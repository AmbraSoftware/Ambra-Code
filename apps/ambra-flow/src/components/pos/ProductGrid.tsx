'use client';

import React, { useState } from 'react';
import { Product } from '@/services/stock.service';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ProductGridProps {
    products: Product[];
    onProductClick: (product: Product) => void;
    isLoading: boolean;
}

export function ProductGrid({ products, onProductClick, isLoading }: ProductGridProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-md">
                <Input
                    placeholder="Buscar produto por nome..."
                    leftIcon="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white dark:bg-zinc-800"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                    <button
                        key={product.id}
                        onClick={() => onProductClick(product)}
                        className="group relative flex flex-col items-start text-left bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 hover:border-primary dark:hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-95"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">
                                {product.category === 'BEBIDAS' ? 'local_cafe' :
                                    product.category === 'SALGADOS' ? 'bakery_dining' : 'fastfood'}
                            </span>
                        </div>

                        <div className="flex-1 w-full">
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">
                                {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {product.category || 'Geral'}
                            </p>
                        </div>

                        <div className="mt-4 w-full flex items-center justify-between">
                            <span className="font-bold text-lg text-gray-900 dark:text-white">
                                <span className="text-xs font-normal text-gray-400 mr-0.5">R$</span>
                                {Number(product.price).toFixed(2)}
                            </span>
                            {product.stock <= 5 && (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold">
                                    Restam {product.stock}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                    <p>Nenhum produto encontrado.</p>
                </div>
            )}
        </div>
    );
}
