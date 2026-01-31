'use client';

import { useMemo, useState } from 'react';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { Button } from '@/components/ui/atoms/Button';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import type { Product } from '@/types';

export interface FavoritesDrawerProps {
  open: boolean;
  onClose: () => void;
  favorites: Product[];
  onAddToCart: (product: Product) => void;
}

export function FavoritesDrawer({
  open,
  onClose,
  favorites,
  onAddToCart,
}: FavoritesDrawerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((p) => p.name.toLowerCase().includes(q));
  }, [favorites, query]);

  return (
    <Dialog open={open} onClose={onClose} title="Favoritos" description="Seus produtos salvos">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar favoritos..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-text-primary dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Nenhum favorito encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary dark:text-white text-sm font-bold truncate">
                    {product.name}
                  </p>
                  <p className="text-text-secondary dark:text-text-secondary-dark text-xs">
                    {formatCurrency(product.price)}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => onAddToCart(product)}
                  icon={<Plus className="h-4 w-4" />}
                  className="h-9"
                >
                  Carrinho
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="secondary" className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Dialog>
  );
}
