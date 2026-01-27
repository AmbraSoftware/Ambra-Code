'use client';

import { useEffect, useState } from 'react';
import { menuService } from '@/services/menu.service';
import { Product } from '@/services/stock.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { stockService } from '@/services/stock.service';

export default function MenuPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        category: string;
        price: number;
        stock: number;
        minStockAlert: number;
        imageUrl: string;
        isAvailable: boolean;
    }>({
        name: '',
        category: 'Lanches',
        price: 0,
        stock: 0,
        minStockAlert: 10,
        imageUrl: '',
        isAvailable: true,
    });
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        setIsLoading(true);
        try {
            const data = await menuService.getMenu();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load menu', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (product: Product) => {
        setProcessingId(product.id);
        try {
            await menuService.toggleAvailability(product);
            // Optimistic update
            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p
            ));
        } catch (error) {
            console.error('Failed to toggle availability', error);
            alert('Erro ao atualizar status do produto.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                minStockAlert: product.minStockAlert || 10,
                imageUrl: product.imageUrl || '',
                isAvailable: product.isAvailable,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: 'Lanches',
                price: 0,
                stock: 0,
                minStockAlert: 10,
                imageUrl: '',
                isAvailable: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingProduct) {
                await stockService.update(editingProduct.id, {
                    ...formData,
                    version: editingProduct.version
                });
            } else {
                await stockService.create(formData as any);
            }
            await loadMenu();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save product', error);
            alert('Erro ao salvar produto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return;

        try {
            await stockService.delete(id);
            await loadMenu();
        } catch (error) {
            console.error('Failed to delete product', error);
            alert('Não foi possível remover o produto.');
        }
    };

    const availableProducts = products.filter(p => p.isAvailable);
    const unavailableProducts = products.filter(p => !p.isAvailable);

    // Aplicar filtro de categoria
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
    const filteredAvailable = categoryFilter === 'all'
        ? availableProducts
        : availableProducts.filter(p => p.category === categoryFilter);
    const filteredUnavailable = categoryFilter === 'all'
        ? unavailableProducts
        : unavailableProducts.filter(p => p.category === categoryFilter);

    const ProductList = ({ items, title, emptyMsg, type }: { items: Product[], title: string, emptyMsg: string, type: 'active' | 'inactive' }) => (
        <Card title={`${title} (${items.length})`} className="h-full">
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-light dark:text-muted-dark opacity-60">
                    <span className="material-symbols-outlined text-4xl mb-2">
                        {type === 'active' ? 'restaurant_menu' : 'visibility_off'}
                    </span>
                    <p className="text-sm">{emptyMsg}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-black/20 hover:border-primary/50 transition-colors group">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">fastfood</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-text-light dark:text-text-dark">{product.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-light dark:text-muted-dark">{product.category}</span>
                                        <span className="text-xs font-semibold text-primary">R$ {Number(product.price).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenModal(product)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <Button
                                    size="sm"
                                    variant={type === 'active' ? 'secondary' : 'primary'}
                                    onClick={() => handleToggle(product)}
                                    isLoading={processingId === product.id}
                                    className={type === 'active' ? 'bg-red-100 text-red-600 hover:bg-red-200 border-none shadow-none' : 'bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none'}
                                >
                                    {type === 'active' ? (
                                        <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Cardápio Digital</h1>
                    <p className="text-muted-light dark:text-muted-dark">Defina quais produtos estarão visíveis para compra nos totens e aplicativo.</p>
                </div>
                <Button
                    icon="add"
                    onClick={() => handleOpenModal()}
                >
                    Novo Produto
                </Button>
            </div>

            {/* Filtro de Categoria */}
            {categories.length > 2 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <span className="text-sm text-muted-light dark:text-muted-dark shrink-0">Categoria:</span>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${categoryFilter === cat
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-zinc-800 text-muted-light dark:text-muted-dark hover:bg-gray-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {cat === 'all' ? 'Todas' : cat}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProductList
                    items={filteredUnavailable}
                    title="Indisponíveis (Ocultos)"
                    emptyMsg="Todos os produtos estão ativos."
                    type="inactive"
                />

                <div className="relative">
                    {/* Visual Connector for larger screens */}
                    <div className="hidden md:flex absolute top-1/2 -left-3 transform -translate-y-1/2 w-6 h-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full items-center justify-center z-10 text-muted-light">
                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                    </div>
                    <ProductList
                        items={filteredAvailable}
                        title="Ativos no Cardápio"
                        emptyMsg="Nenhum produto ativo no momento."
                        type="active"
                    />
                </div>
            </div>

            {/* Modal CRUD */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <ImageUpload
                        value={formData.imageUrl}
                        onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nome do Produto"
                            placeholder="Ex: Refri Cola 350ml"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Categoria"
                            placeholder="Ex: Bebidas"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Preço (R$)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            required
                        />
                        <Input
                            label="Estoque Inicial"
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                            required
                        />
                        <Input
                            label="Alerta Mínimo"
                            type="number"
                            min="0"
                            value={formData.minStockAlert}
                            onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isAvailable"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.isAvailable}
                            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                        />
                        <label htmlFor="isAvailable" className="text-sm font-medium text-text-light dark:text-text-dark select-none cursor-pointer">
                            Produto disponível para venda
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            Salvar Produto
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
