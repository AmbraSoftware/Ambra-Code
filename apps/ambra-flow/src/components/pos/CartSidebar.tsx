'use client';

import React, { useState } from 'react';
import { CartItem } from '@/app/operator/pos/page';
import { Student } from '@/services/students.service';
import { Button } from '@/components/ui/Button';
import { StudentSearch } from './StudentSearch';
import { posService } from '@/services/pos.service';

interface CartSidebarProps {
    cart: CartItem[];
    student: Student | null;
    onSelectStudent: (s: Student) => void;
    onRemoveItem: (id: string) => void;
    onUpdateQuantity: (id: string, delta: number) => void;
    onClearCart: () => void;
    onCheckoutSuccess: (order: any) => void;
    onCheckoutError: (error: any) => void;
}

export function CartSidebar({
    cart,
    student,
    onSelectStudent,
    onRemoveItem,
    onUpdateQuantity,
    onClearCart,
    onCheckoutSuccess,
    onCheckoutError
}: CartSidebarProps) {
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const total = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    const balance = student ? Number(student.wallet?.balance || 0) : 0;
    const remainingBalance = balance - total;
    const canCheckout = cart.length > 0 && student && remainingBalance >= 0;

    const handleCheckout = async () => {
        if (!student || !canCheckout) return;

        setIsCheckingOut(true);
        try {
            const order = await posService.createOrder({
                studentId: student.id,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                }))
            });

            // Success!
            onClearCart();
            onCheckoutSuccess(order);
        } catch (error) {
            console.error('Checkout failed', error);
            onCheckoutError(error);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20">
                <h2 className="font-bold text-gray-900 dark:text-white">Carrinho de Compras</h2>
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{cart.reduce((acc, i) => acc + i.quantity, 0)} itens</span>
                    <button onClick={onClearCart} className="text-red-500 hover:underline">Limpar</button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Product List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-6xl mb-2">shopping_bag</span>
                            <p className="text-sm">Seu carrinho está vazio</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-100 dark:border-zinc-800 shadow-sm">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-700 rounded-md flex items-center justify-center text-gray-500 shrink-0">
                                    <span className="material-symbols-outlined text-lg">category</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">R$ {Number(item.price).toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                                        R$ {(Number(item.price) * item.quantity).toFixed(2)}
                                    </span>
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 rounded px-1">
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, -1)}
                                            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-500"
                                        >
                                            -
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, 1)}
                                            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-green-500"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/50">
                    <StudentSearch onSelect={onSelectStudent} selectedStudent={student} />

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                        {student && (
                            <div className="flex justify-between text-sm">
                                <span className={remainingBalance < 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                    Saldo Restante
                                </span>
                                <span className={`font-bold ${remainingBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    R$ {remainingBalance.toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-zinc-700">
                            <span>Total</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleCheckout}
                        isLoading={isCheckingOut}
                        disabled={!canCheckout}
                        variant={canCheckout ? "primary" : "secondary"}
                        size="lg"
                    >
                        {!student ? 'Selecione um Aluno' :
                            remainingBalance < 0 ? 'Saldo Insuficiente' :
                                cart.length === 0 ? 'Carrinho Vazio' :
                                    'Finalizar Venda'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
