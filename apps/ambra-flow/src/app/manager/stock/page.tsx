'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stockService, Product, CreateProductDto } from '@/services/stock.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function StockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stockAlerts, setStockAlerts] = useState<{
        critical: Product[];
        warning: Product[];
        total: number;
    }>({ critical: [], warning: [], total: 0 });
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockProduct, setStockProduct] = useState<Product | null>(null);
    const [stockQuantity, setStockQuantity] = useState(0);

    // Form State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<CreateProductDto>>({
        name: '',
        category: 'Salgados', // Default seguro
        price: 0,
        stock: 0,
        minStockAlert: 10,
        imageUrl: '',
        isAvailable: true,
        isKit: false,
    });

    const CATEGORIES = [
        { label: '🥪 Salgados e Lanches', value: 'Salgados' },
        { label: '🥤 Bebidas e Sucos', value: 'Bebidas' },
        { label: '🍲 Refeições', value: 'Refeicoes' },
        { label: '🍰 Doces e Sobremesas', value: 'Doces' },
        { label: '📦 Diversos / Outros', value: 'Diversos' }
    ];

    useEffect(() => {
        loadProducts();
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const data = await stockService.getStockAlerts();
            setStockAlerts(data || { critical: [], warning: [], total: 0 }); // Defensive
        } catch (error) {
            console.error('Failed to load stock alerts', error);
            setStockAlerts({ critical: [], warning: [], total: 0 });
        }
    };

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const data = await stockService.getAll();
            setProducts(Array.isArray(data) ? data : []); // Defensive: Evita crash .filter
        } catch (error) {
            console.error('Failed to load products', error);
            setProducts([]); // Fallback seguro
        } finally {
            setIsLoading(false);
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
                minStockAlert: 10, // backend usually doesn't return this if not requested specifically or if standard DTO, assuming default
                imageUrl: product.imageUrl,
                isAvailable: product.isAvailable,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: 'Geral',
                price: 0,
                stock: 0,
                minStockAlert: 10,
                imageUrl: '',
                isAvailable: true,
                isKit: false,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingProduct) {
                await stockService.update(editingProduct.id, formData);
            } else {
                await stockService.create(formData as CreateProductDto);
            }
            await loadProducts();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Failed to save product', error);
            if (error?.response?.status === 409) {
                alert('Conflito: Já existe um produto com este nome ou ele foi modificado recentemente.');
            } else {
                alert('Erro ao salvar produto. Verifique os dados.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return;

        try {
            await stockService.delete(id);
            await loadProducts();
        } catch (error) {
            console.error('Failed to delete product', error);
            alert('Não foi possível remover o produto.');
        }
    };

    const handleOpenStockModal = (product: Product) => {
        setStockProduct(product);
        setStockQuantity(10); // Valor padrão
        setIsStockModalOpen(true);
    };

    const handleAddStock = async () => {
        if (!stockProduct || stockQuantity <= 0) return;

        setIsSubmitting(true);
        try {
            // Optimistic update
            setProducts(prev => prev.map(p =>
                p.id === stockProduct.id
                    ? { ...p, stock: p.stock + stockQuantity }
                    : p
            ));

            await stockService.addStock(stockProduct.id, stockQuantity);
            await loadAlerts(); // Atualizar alertas
            setIsStockModalOpen(false);
        } catch (error) {
            console.error('Failed to add stock', error);
            alert('Erro ao adicionar estoque.');
            // Reverter optimistic update
            await loadProducts();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickStockUpdate = async (product: Product, change: number) => {
        try {
            // Optimistic update
            setProducts(prev => prev.map(p =>
                p.id === product.id
                    ? { ...p, stock: Math.max(0, p.stock + change) }
                    : p
            ));

            await stockService.updateStock(product.id, change);
            await loadAlerts();
        } catch (error) {
            console.error('Failed to update stock', error);
            // Reverter em caso de erro (Recarrega tudo para garantir consistência)
            await loadProducts();
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Estoque</h1>
                    <p className="text-muted-light dark:text-muted-dark">Gerencie os produtos e o inventário da cantina.</p>
                </div>
                <Button
                    icon="add"
                    onClick={() => handleOpenModal()}
                >
                    Novo Produto
                </Button>
            </div>

            {/* Alertas de Estoque */}
            {stockAlerts.total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stockAlerts.critical.length > 0 && (
                        <Card className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">
                                        error
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                        {stockAlerts.critical.length} {stockAlerts.critical.length === 1 ? 'Produto em Ruptura' : 'Produtos em Ruptura'}
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                                        Estoque zerado. Reposição urgente necessária.
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {stockAlerts.critical.slice(0, 3).map(p => (
                                            <Badge key={p.id} variant="error" className="text-xs">
                                                {p.name}
                                            </Badge>
                                        ))}
                                        {stockAlerts.critical.length > 3 && (
                                            <Badge variant="error" className="text-xs">
                                                +{stockAlerts.critical.length - 3} mais
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {stockAlerts.warning.length > 0 && (
                        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">
                                        warning
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                        {stockAlerts.warning.length} {stockAlerts.warning.length === 1 ? 'Produto com Estoque Baixo' : 'Produtos com Estoque Baixo'}
                                    </h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                                        Abaixo do nível mínimo. Planeje reposição.
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {stockAlerts.warning.slice(0, 3).map(p => (
                                            <Badge key={p.id} variant="warning" className="text-xs">
                                                {p.name} ({p.stock} un)
                                            </Badge>
                                        ))}
                                        {stockAlerts.warning.length > 3 && (
                                            <Badge variant="warning" className="text-xs">
                                                +{stockAlerts.warning.length - 3} mais
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            <Card className="min-h-[500px]" noPadding>
                <div className="p-4 border-b border-border-light dark:border-border-dark flex gap-4">
                    <div className="w-full max-w-sm">
                        <Input
                            placeholder="Buscar por nome ou categoria..."
                            leftIcon="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <select
                            className="w-full px-3 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-light dark:text-text-dark cursor-pointer appearance-none"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Todas as Categorias</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Table
                    isLoading={isLoading}
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    columns={[
                        {
                            header: 'Produto',
                            accessorKey: 'name',
                            cell: (item) => {
                                const isCritical = item.stock === 0;
                                const isLow = item.stock > 0 && item.stock <= (item.minStockAlert || 10);

                                return (
                                    <div className={`flex items-center gap-3 ${isCritical ? 'opacity-60' : ''}`}>
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-400">fastfood</span>
                                            )}
                                            {isCritical && (
                                                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-red-600 text-sm">error</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-text-light dark:text-text-dark">{item.name}</p>
                                                {isCritical && (
                                                    <Badge variant="error" className="text-[10px] px-1.5 py-0.5">RUPTURA</Badge>
                                                )}
                                                {isLow && !isCritical && (
                                                    <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">BAIXO</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-light dark:text-muted-dark">{item.category}</p>
                                        </div>
                                    </div>
                                );
                            }
                        },
                        {
                            header: 'Preço',
                            accessorKey: 'price',
                            cell: (item) => <span className="font-medium">R$ {Number(item.price || 0).toFixed(2)}</span>
                        },
                        {
                            header: 'Estoque',
                            accessorKey: 'stock',
                            cell: (item) => (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleQuickStockUpdate(item, -1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                        disabled={item.stock <= 0}
                                        title="-1"
                                    >
                                        -
                                    </button>
                                    <Badge variant={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'error'} className="min-w-[60px] justify-center">
                                        {item.stock} un
                                    </Badge>
                                    <button
                                        onClick={() => handleQuickStockUpdate(item, 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                        title="+1"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => handleOpenStockModal(item)}
                                        className="ml-1 p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                                        title="Ajuste Manual"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                    </button>
                                </div>
                            )
                        },
                        {
                            header: 'Status',
                            accessorKey: 'isAvailable',
                            cell: (item) => (
                                <Badge variant={item.isAvailable ? 'success' : 'neutral'}>
                                    {item.isAvailable ? 'Ativo' : 'Inativo'}
                                </Badge>
                            )
                        },
                        {
                            header: 'Ações',
                            align: 'right',
                            cell: (item) => (
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.name)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            )
                        }
                    ]}
                />
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nome do Produto"
                            placeholder="Ex: Refri Cola 350ml"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

                        <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                            <label className="text-sm font-medium text-text-light dark:text-text-dark">Categoria</label>
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-light dark:text-text-dark cursor-pointer appearance-none"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Input
                                label="Preço (R$)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                label="Estoque Atual"
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                label="Alerta Mínimo"
                                type="number"
                                min="0"
                                value={formData.minStockAlert}
                                onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <Input
                        label="URL da Imagem (Opcional)"
                        placeholder="https://..."
                        value={formData.imageUrl || ''}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />

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

            {/* Modal de Entrada Rápida de Estoque */}
            <Modal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                title="Adicionar Estoque"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                        <p className="text-sm text-muted-light dark:text-muted-dark mb-1">Produto</p>
                        <p className="font-semibold text-text-light dark:text-text-dark">{stockProduct?.name}</p>
                        <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                            Estoque atual: <span className="font-medium">{stockProduct?.stock} unidades</span>
                        </p>
                    </div>

                    <Input
                        label="Quantidade a Adicionar"
                        type="number"
                        min="1"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                        placeholder="Ex: 50"
                        helperText={`Novo estoque: ${(stockProduct?.stock || 0) + stockQuantity} unidades`}
                    />

                    <div className="pt-2 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsStockModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddStock}
                            isLoading={isSubmitting}
                            disabled={stockQuantity <= 0}
                        >
                            Adicionar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
