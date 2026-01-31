'use client';

import { useMemo } from 'react';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { Button } from '@/components/ui/atoms/Button';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '@/types';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
  onRemoveAll: (productId: string) => void;
}

export function CartDrawer({
  open,
  onClose,
  cart,
  onAdd,
  onRemove,
  onRemoveAll,
}: CartDrawerProps) {
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  return (
    <Dialog open={open} onClose={onClose} title="Carrinho" description={`${totalItems} item(ns)`}>
      {cart.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Seu carrinho está vazio.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary dark:text-white text-sm font-bold truncate">
                    {item.product.name}
                  </p>
                  <p className="text-text-secondary dark:text-text-secondary-dark text-xs">
                    {formatCurrency(item.product.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRemove(item.product.id)}
                    className="flex items-center justify-center size-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-primary dark:text-white tap-scale"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="text-text-primary dark:text-white font-bold min-w-[24px] text-center">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => onAdd(item.product.id)}
                    className="flex items-center justify-center size-9 rounded-lg bg-brand-primary text-white tap-scale"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveAll(item.product.id)}
                    className="flex items-center justify-center size-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 tap-scale"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <p className="text-text-secondary dark:text-text-secondary-dark text-sm">Total</p>
              <p className="text-text-primary dark:text-white text-lg font-bold">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={onClose}>
            Continuar comprando
          </Button>
        </div>
      )}
    </Dialog>
  );
}
