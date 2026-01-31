'use client';

import { useEffect, useState } from 'react';
import { Product, ProductCategory, CartItem } from '@/types';
import { Card } from '@/components/ui/molecules/Card';
import { Badge } from '@/components/ui/atoms/Badge';
import { Button } from '@/components/ui/atoms/Button';
import { BottomNav } from '@/components/ui/organisms/BottomNav';
import { CartFloatingButton } from '@/components/ui/organisms/CartFloatingButton';
import { CartDrawer } from '@/components/ui/organisms/CartDrawer';
import { FavoritesDrawer } from '@/components/ui/organisms/FavoritesDrawer';
import { Heart, Search, Plus, Minus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { productsAPI, storeAPI } from '@/lib/api';

// Mock de produtos (substituir por API real)
const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Suco Natural de Laranja',
        description: 'Suco 100% natural, sem açúcar adicionado',
        price: 5.50,
        category: 'DRINK',
        imageUrl: '',
        isAvailable: true,
        nutritionalInfo: {
            calories: 120,
            protein: 1.5,
            carbs: 28,
            fat: 0.5,
        },
    },
    {
        id: '2',
        name: 'Sanduíche Natural',
        description: 'Pão integral com peito de peru e queijo branco',
        price: 8.00,
        category: 'MEAL',
        imageUrl: '',
        isAvailable: true,
        nutritionalInfo: {
            calories: 280,
            protein: 18,
            carbs: 32,
            fat: 8,
        },
    },
    {
        id: '3',
        name: 'Barra de Cereal',
        description: 'Barra de cereal com castanhas',
        price: 3.50,
        category: 'SNACK',
        imageUrl: '',
        isAvailable: true,
    },
    {
        id: '4',
        name: 'Salada de Frutas',
        description: 'Mix de frutas da estação',
        price: 6.00,
        category: 'DESSERT',
        imageUrl: '',
        isAvailable: true,
    },
];

const CATEGORIES: { value: ProductCategory; label: string; emoji: string }[] = [
    { value: 'MEAL', label: 'Refeições', emoji: '🍽️' },
    { value: 'SNACK', label: 'Lanches', emoji: '🥪' },
    { value: 'DRINK', label: 'Bebidas', emoji: '🥤' },
    { value: 'DESSERT', label: 'Sobremesas', emoji: '🍰' },
];

export default function StorePage() {
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [cartOpen, setCartOpen] = useState(false);
    const [favoritesOpen, setFavoritesOpen] = useState(false);

    const CART_STORAGE_KEY = 'ambra_food_web_cart_v1';

    useEffect(() => {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as CartItem[];
            if (Array.isArray(parsed)) {
                setCart(parsed);
            }
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch {
            // ignore
        }
    }, [cart]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, favoritesRes] = await Promise.all([
                    productsAPI.getProducts(),
                    storeAPI.getFavorites(),
                ]);

                setProducts(productsRes.data as unknown as Product[]);
                setFavoriteIds(new Set(favoritesRes.data));
            } catch {
                // Keep mock data as fallback
            }
        };

        fetchData();
    }, []);

    const filteredProducts = products.filter((product) => {
        const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch && product.isAvailable;
    });

    const toggleFavorite = async (productId: string) => {
        const previous = new Set(favoriteIds);
        const next = new Set(favoriteIds);

        if (next.has(productId)) {
            next.delete(productId);
        } else {
            next.add(productId);
        }

        // Optimistic update
        setFavoriteIds(next);

        try {
            const { data } = await storeAPI.toggleFavorite(productId);
            const confirmed = new Set(previous);
            if (data.isFavorited) {
                confirmed.add(productId);
            } else {
                confirmed.delete(productId);
            }
            setFavoriteIds(confirmed);
        } catch {
            // Rollback
            setFavoriteIds(previous);
        }
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === productId);
            if (existing && existing.quantity > 1) {
                return prev.map((item) =>
                    item.product.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            }
            return prev.filter((item) => item.product.id !== productId);
        });
    };

    const getProductQuantity = (productId: string) => {
        return cart.find((item) => item.product.id === productId)?.quantity || 0;
    };

    const removeAllFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const favoritesProducts = products.filter((p) => favoriteIds.has(p.id));

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return (
        <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col overflow-x-hidden">
            {/* TopAppBar */}
            <header className="sticky top-0 z-50 bg-surface-light/80 dark:bg-surface-dark/80 ios-blur border-b border-gray-200 dark:border-gray-800">
                <div className="p-4 pt-8 safe-area-top">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-text-primary dark:text-white text-xl font-bold leading-tight tracking-tight">
                            Loja da Cantina
                        </h2>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFavoritesOpen(true)}
                                className="flex items-center justify-center size-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-text-primary dark:text-white tap-scale"
                                aria-label="Abrir favoritos"
                            >
                                <Heart className={cn('h-5 w-5', favoritesProducts.length > 0 ? 'fill-current text-red-600' : '')} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setCartOpen(true)}
                                className="relative flex items-center justify-center size-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-text-primary dark:text-white tap-scale"
                                aria-label="Abrir carrinho"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-current"
                                >
                                    <path
                                        d="M6 6H21L20 12.5C19.7 14.5 19.6 15.5 19 16.2C18.4 17 17.5 17.2 15.6 17.6C14.2 17.9 12.7 18 11.2 18H9C7.3 18 6.4 17.5 5.8 16.7C5.2 15.9 5.1 14.8 4.8 12.5L4 2H2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M9 22a1 1 0 100-2 1 1 0 000 2zM17 22a1 1 0 100-2 1 1 0 000 2z"
                                        fill="currentColor"
                                    />
                                </svg>

                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                                        {totalItems > 99 ? '99+' : totalItems}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-text-primary dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 w-max">
                        <button
                            onClick={() => setSelectedCategory('ALL')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors tap-scale',
                                selectedCategory === 'ALL'
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white'
                            )}
                        >
                            Todos
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors tap-scale',
                                    selectedCategory === cat.value
                                        ? 'bg-brand-primary text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white'
                                )}
                            >
                                {cat.emoji} {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 py-4 pb-32 overflow-y-auto">
                {/* Products Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((product) => {
                        const quantity = getProductQuantity(product.id);
                        const isFavorited = favoriteIds.has(product.id);
                        return (
                            <Card key={product.id} variant="default" padding="none" className="overflow-hidden">
                                {/* Product Image Placeholder */}
                                <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => toggleFavorite(product.id)}
                                        className={cn(
                                            'absolute top-2 right-2 flex items-center justify-center size-9 rounded-full backdrop-blur border tap-scale',
                                            isFavorited
                                                ? 'bg-white/90 border-red-200 text-red-600'
                                                : 'bg-white/70 border-gray-200 text-gray-600'
                                        )}
                                        aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                    >
                                        <Heart
                                            className={cn('h-5 w-5', isFavorited ? 'fill-current' : '')}
                                        />
                                    </button>

                                    <span className="text-4xl">
                                        {product.category === 'MEAL' && '🍽️'}
                                        {product.category === 'SNACK' && '🥪'}
                                        {product.category === 'DRINK' && '🥤'}
                                        {product.category === 'DESSERT' && '🍰'}
                                    </span>
                                </div>

                                <div className="p-3">
                                    <h3 className="text-text-primary dark:text-white text-sm font-bold line-clamp-2 mb-1">
                                        {product.name}
                                    </h3>
                                    <p className="text-text-secondary dark:text-text-secondary-dark text-xs line-clamp-2 mb-2">
                                        {product.description}
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        <p className="text-brand-primary text-lg font-bold">
                                            {formatCurrency(product.price)}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            {quantity === 0 ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => addToCart(product)}
                                                    icon={<Plus className="h-4 w-4" />}
                                                    className="h-8 w-full"
                                                >
                                                    Adicionar
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => removeFromCart(product.id)}
                                                        className="flex items-center justify-center size-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white tap-scale"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-text-primary dark:text-white font-bold min-w-[20px] text-center">
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        className="flex items-center justify-center size-7 rounded-lg bg-brand-primary text-white tap-scale"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                            Nenhum produto encontrado
                        </p>
                    </div>
                )}
            </main>

            {/* Cart Floating Button */}
            <CartFloatingButton
                itemCount={totalItems}
                onClick={() => setCartOpen(true)}
            />

            <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                cart={cart}
                onAdd={(productId) => {
                    const product = products.find((p) => p.id === productId);
                    if (product) addToCart(product);
                }}
                onRemove={(productId) => removeFromCart(productId)}
                onRemoveAll={(productId) => removeAllFromCart(productId)}
            />

            <FavoritesDrawer
                open={favoritesOpen}
                onClose={() => setFavoritesOpen(false)}
                favorites={favoritesProducts}
                onAddToCart={(product) => {
                    addToCart(product);
                    setCartOpen(true);
                }}
            />

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
