'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Toggle } from '@/components/ui/atoms/Toggle';
import { Card } from '@/components/ui/molecules/Card';
import { BottomNav } from '@/components/ui/organisms/BottomNav';
import { ArrowLeft, Bell, Lock, DollarSign, Ban } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ProductCategory } from '@/types';

const CATEGORIES: { value: ProductCategory; label: string; emoji: string }[] = [
    { value: 'MEAL', label: 'Refeições', emoji: '🍽️' },
    { value: 'SNACK', label: 'Lanches', emoji: '🥪' },
    { value: 'DRINK', label: 'Bebidas', emoji: '🥤' },
    { value: 'DESSERT', label: 'Sobremesas', emoji: '🍰' },
];

export default function SettingsPage() {
    const router = useRouter();
    const [dailyLimit, setDailyLimit] = useState('30.00');
    const [lowBalanceThreshold, setLowBalanceThreshold] = useState('10.00');
    const [notifyOnLowBalance, setNotifyOnLowBalance] = useState(true);
    const [blockedCategories, setBlockedCategories] = useState<ProductCategory[]>([]);

    const handleToggleCategory = (category: ProductCategory, blocked: boolean) => {
        if (blocked) {
            setBlockedCategories((prev) => [...prev, category]);
        } else {
            setBlockedCategories((prev) => prev.filter((c) => c !== category));
        }
    };

    const handleSave = () => {
        // TODO: Integrar com API
        alert('Configurações salvas com sucesso!');
    };

    return (
        <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col">
            {/* TopAppBar */}
            <header className="sticky top-0 z-50 bg-surface-light/80 dark:bg-surface-dark/80 ios-blur border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center p-4 justify-between max-w-md mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="text-brand-primary flex size-10 shrink-0 items-center justify-center cursor-pointer tap-scale"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h2 className="text-text-primary dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
                        Configurações
                    </h2>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 pb-32 overflow-y-auto space-y-6">
                {/* Limite Diário */}
                <Card variant="default" padding="lg">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex items-center justify-center size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-text-primary dark:text-white text-base font-bold mb-1">
                                Limite Diário
                            </h3>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                                Valor máximo que pode ser gasto por dia
                            </p>
                        </div>
                    </div>

                    <Input
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(e.target.value)}
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                        label="Valor do limite"
                    />
                </Card>

                {/* Notificações */}
                <Card variant="default" padding="lg">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex items-center justify-center size-10 rounded-full bg-purple-100 dark:bg-purple-900/30 shrink-0">
                            <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-text-primary dark:text-white text-base font-bold mb-1">
                                Notificações
                            </h3>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                                Receba alertas sobre a carteira
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Toggle
                            checked={notifyOnLowBalance}
                            onChange={setNotifyOnLowBalance}
                            label="Avisar quando saldo estiver baixo"
                            description="Receba uma notificação quando o saldo atingir o limite"
                        />

                        {notifyOnLowBalance && (
                            <Input
                                type="number"
                                value={lowBalanceThreshold}
                                onChange={(e) => setLowBalanceThreshold(e.target.value)}
                                placeholder="0,00"
                                step="0.01"
                                min="0"
                                label="Saldo mínimo para alerta"
                            />
                        )}
                    </div>
                </Card>

                {/* Bloqueios Nutricionais */}
                <Card variant="default" padding="lg">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex items-center justify-center size-10 rounded-full bg-red-100 dark:bg-red-900/30 shrink-0">
                            <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-text-primary dark:text-white text-base font-bold mb-1">
                                Bloqueios Nutricionais
                            </h3>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                                Restrinja categorias de produtos
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {CATEGORIES.map((category) => (
                            <Toggle
                                key={category.value}
                                checked={blockedCategories.includes(category.value)}
                                onChange={(blocked) => handleToggleCategory(category.value, blocked)}
                                label={`${category.emoji} ${category.label}`}
                                description={blockedCategories.includes(category.value) ? 'Bloqueado' : 'Permitido'}
                            />
                        ))}
                    </div>

                    {blockedCategories.length > 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                            <p className="text-yellow-700 dark:text-yellow-400 text-xs">
                                ⚠️ <strong>{blockedCategories.length}</strong> categoria(s) bloqueada(s). O estudante não poderá comprar esses produtos.
                            </p>
                        </div>
                    )}
                </Card>

                {/* Segurança */}
                <Card variant="default" padding="lg">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex items-center justify-center size-10 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                            <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-text-primary dark:text-white text-base font-bold mb-1">
                                Segurança
                            </h3>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                                Proteja a conta do estudante
                            </p>
                        </div>
                    </div>

                    <Button variant="secondary" className="w-full">
                        Alterar Senha
                    </Button>
                </Card>

                {/* Botão Salvar */}
                <Button onClick={handleSave} className="w-full">
                    Salvar Configurações
                </Button>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
