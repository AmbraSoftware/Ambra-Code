'use client';

import React, { useState, useEffect } from 'react';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { posService } from '@/services/pos.service';
import { Product } from '@/services/stock.service';
import { User as Student } from '@/services/users.service';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { usePosProducts } from '@/hooks/usePos';
import { CheckCircle, AlertTriangle, WifiOff } from 'lucide-react';

export interface CartItem extends Product {
    quantity: number;
}

/**
 * POS Page - Operator Mode
 * 
 * Tela de venda rápida para operadores.
 * Layout fullscreen sem distrações.
 * 
 * @see AMBRA_CONTEXT.md - Segregação Total de Experiência
 */
export default function PosPage() {
    const { data: products = [], isLoading, refetch: reloadProducts } = usePosProducts();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Premium Features State
    const [isOffline, setIsOffline] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Offline Detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            posService.syncQueue().then(count => {
                if (count > 0) alert(`${count} vendas offline sincronizadas!`);
            });
        };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const addToCart = (product: Product) => {
        // Offline Stock Check
        const existing = cart.find(item => item.id === product.id);
        const currentQty = existing ? existing.quantity : 0;

        if (currentQty + 1 > product.stock) {
            playErrorSound();
            alert(`Estoque insuficiente! Apenas ${product.stock} unidades disponíveis.`);
            return;
        }

        setCart(prev => {
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                // Check stock on increase
                const product = products.find((p: any) => p.id === productId);
                if (delta > 0 && product && newQty > product.stock) {
                    playErrorSound();
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const clearCart = () => {
        setCart([]);
        setSelectedStudent(null);
    };

    // Sound Logic (Base64 Mocks)
    const playSuccessSound = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    };

    const playErrorSound = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 150;
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    };

    // Callback Handlers
    const handleCheckoutSuccess = (order: any) => {
        setLastOrder(order);
        playSuccessSound();
        setShowSuccessModal(true);
        // Reload products to sync stock
        reloadProducts();
    };

    const handleCheckoutError = (error: any) => {
        playErrorSound();
        const msg = error.response?.data?.message || 'Erro ao processar venda.';
        setErrorMsg(msg);
    };

    return (
        <div className="flex h-full relative">
            {/* Offline Banner */}
            {isOffline && (
                <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 animate-pulse z-50">
                    <WifiOff size={18} />
                    MODO OFFLINE - Vendas serão sincronizadas automaticamente
                </div>
            )}

            {/* Left: Product Grid */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-zinc-900/50 pt-12">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produtos Disponíveis</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Selecione os itens para adicionar ao pedido.</p>
                </div>

                <ProductGrid
                    products={products}
                    onProductClick={addToCart}
                    isLoading={isLoading}
                />
            </div>

            {/* Right: Cart Sidebar */}
            <div className="w-[400px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col z-10 pt-10">
                <CartSidebar
                    cart={cart}
                    student={selectedStudent}
                    onSelectStudent={setSelectedStudent}
                    onRemoveItem={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                    onClearCart={clearCart}
                    onCheckoutSuccess={handleCheckoutSuccess}
                    onCheckoutError={handleCheckoutError}
                />
            </div>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Venda Realizada!"
                size="sm"
            >
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                        <CheckCircle className="text-4xl text-green-600 dark:text-green-400" size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-1">Pagamento Confirmado</h3>
                    <p className="text-muted-light dark:text-muted-dark text-center mb-6">
                        O pedido #{lastOrder?.orderHash?.substring(0, 8) || 'N/A'} foi enviado para a fila.
                    </p>
                    <Button onClick={() => setShowSuccessModal(false)} className="w-full">
                        Nova Venda
                    </Button>
                </div>
            </Modal>

            {/* Error Modal */}
            <Modal
                isOpen={!!errorMsg}
                onClose={() => setErrorMsg(null)}
                title="Não foi possível processar"
                size="sm"
            >
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="text-4xl text-red-600 dark:text-red-400" size={48} />
                    </div>
                    <p className="text-center font-medium text-text-light dark:text-text-dark mb-6">
                        {errorMsg}
                    </p>
                    <Button variant="secondary" onClick={() => setErrorMsg(null)} className="w-full">
                        Entendido
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
