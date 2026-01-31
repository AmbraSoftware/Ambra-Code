'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { Button } from '@/components/ui/atoms/Button';
import { Badge } from '@/components/ui/atoms/Badge';
import { Card } from '@/components/ui/molecules/Card';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Product } from '@/types';

export interface MerendaIQModalProps {
    open: boolean;
    onClose: () => void;
    product?: Product;
}

export function MerendaIQModal({ open, onClose, product }: MerendaIQModalProps) {
    if (!product || !product.nutritionalInfo) {
        return (
            <Dialog open={open} onClose={onClose} title="Merenda IQ" description="Análise nutricional">
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        Informações nutricionais não disponíveis para este produto.
                    </p>
                </div>
            </Dialog>
        );
    }

    const { nutritionalInfo } = product;
    const totalCalories = nutritionalInfo.calories;
    const isHealthy = totalCalories < 300 && nutritionalInfo.fat < 10;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Merenda IQ"
            description={`Análise nutricional de ${product.name}`}
        >
            <div className="space-y-6">
                {/* Score Card */}
                <Card variant="gradient" padding="lg" className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-white text-sm font-medium mb-1">Score Nutricional</h3>
                    <p className="text-white text-4xl font-bold mb-2">
                        {isHealthy ? '8.5' : '6.0'}/10
                    </p>
                    <Badge variant={isHealthy ? 'success' : 'warning'} size="sm">
                        {isHealthy ? 'Saudável' : 'Moderado'}
                    </Badge>
                </Card>

                {/* Nutritional Info */}
                <div className="space-y-3">
                    <h4 className="text-text-primary dark:text-white text-sm font-bold">
                        Informações Nutricionais
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        <Card variant="default" padding="md">
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs mb-1">
                                Calorias
                            </p>
                            <p className="text-text-primary dark:text-white text-2xl font-bold">
                                {nutritionalInfo.calories}
                            </p>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs">
                                kcal
                            </p>
                        </Card>

                        <Card variant="default" padding="md">
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs mb-1">
                                Proteínas
                            </p>
                            <p className="text-text-primary dark:text-white text-2xl font-bold">
                                {nutritionalInfo.protein}
                            </p>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs">
                                g
                            </p>
                        </Card>

                        <Card variant="default" padding="md">
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs mb-1">
                                Carboidratos
                            </p>
                            <p className="text-text-primary dark:text-white text-2xl font-bold">
                                {nutritionalInfo.carbs}
                            </p>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs">
                                g
                            </p>
                        </Card>

                        <Card variant="default" padding="md">
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs mb-1">
                                Gorduras
                            </p>
                            <p className="text-text-primary dark:text-white text-2xl font-bold">
                                {nutritionalInfo.fat}
                            </p>
                            <p className="text-text-secondary dark:text-text-secondary-dark text-xs">
                                g
                            </p>
                        </Card>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="space-y-3">
                    <h4 className="text-text-primary dark:text-white text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-primary" />
                        Insights da IA
                    </h4>

                    <div className="space-y-2">
                        {isHealthy ? (
                            <>
                                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-green-900 dark:text-green-200 text-sm font-medium">
                                            Boa escolha!
                                        </p>
                                        <p className="text-green-700 dark:text-green-300 text-xs mt-0.5">
                                            Este produto tem baixo teor calórico e gorduras moderadas.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-blue-900 dark:text-blue-200 text-sm font-medium">
                                            Dica
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">
                                            Combine com uma fruta para uma refeição mais completa.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                    <TrendingDown className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-yellow-900 dark:text-yellow-200 text-sm font-medium">
                                            Atenção
                                        </p>
                                        <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-0.5">
                                            Este produto tem calorias moderadas. Consuma com moderação.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-blue-900 dark:text-blue-200 text-sm font-medium">
                                            Sugestão
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">
                                            Considere opções com menos calorias para uma alimentação mais equilibrada.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <Button onClick={onClose} className="w-full">
                    Entendi
                </Button>
            </div>
        </Dialog>
    );
}
