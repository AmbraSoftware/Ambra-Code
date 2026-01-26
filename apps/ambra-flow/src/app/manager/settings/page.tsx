'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { schoolAdminService, SchoolConfig } from '@/services/school-admin.service';
export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false);

    // Form State (Initial values would come from user.school.config)
    const [config, setConfig] = useState<SchoolConfig>({
        theme: { primaryColor: '#000000', logoUrl: '' },
        financial: { allowNegativeBalance: false, defaultCreditLimit: 50.00 },
        operational: { blockSalesOutsideHours: false, openingTime: '07:00', closingTime: '18:00' }
    });

    // Load Effect
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const school = await schoolAdminService.getSchool();
                if (school?.config) {
                    // Deep merge or overwrite defaults
                    setConfig(prev => ({
                        ...prev,
                        ...school.config,
                        theme: { ...prev.theme, ...school.config.theme },
                        financial: { ...prev.financial, ...school.config.financial },
                        operational: { ...prev.operational, ...school.config.operational }
                    }));
                }
            } catch (error) {
                console.error("Failed to load school config", error);
            }
        }
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await schoolAdminService.updateConfig(config);
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            alert('Erro ao salvar configurações.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações da Escola</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Personalize a identidade e as regras de negócio.</p>
                </div>
                <Button onClick={handleSave} isLoading={isLoading} icon="save">
                    Salvar Alterações
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* ID Visual */}
                <Card title="Identidade Visual">
                    <div className="space-y-4">
                        <Input
                            label="URL do Logo"
                            placeholder="https://..."
                            value={config.theme?.logoUrl || ''}
                            onChange={e => setConfig({ ...config, theme: { ...config.theme, logoUrl: e.target.value } })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor Primária</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={config.theme?.primaryColor || '#000000'}
                                    onChange={e => setConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                                    className="h-10 w-20 rounded cursor-pointer"
                                />
                                <span className="text-sm text-gray-500">{config.theme?.primaryColor}</span>

                                {/* White-label Real-time Preview */}
                                {config.theme?.primaryColor && (
                                    <style jsx global>{`
                                        :root {
                                            --primary-color: ${config.theme.primaryColor} !important;
                                        }
                                        /* Tailwind override strategy if needed, but usually css var is enough if tailwind configured */
                                        /* For now assuming tailwind config uses var(--primary-color) or we force inline styles on specific components */
                                    `}</style>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Financeiro */}
                <Card title="Regras Financeiras">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                            <div>
                                <span className="font-bold text-sm block">Permitir Saldo Negativo?</span>
                                <span className="text-xs text-gray-500">Alunos podem comprar fiado até o limite.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.financial?.allowNegativeBalance || false}
                                    onChange={e => setConfig({ ...config, financial: { ...config.financial, allowNegativeBalance: e.target.checked } })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {config.financial?.allowNegativeBalance && (
                            <Input
                                label="Limite de Crédito Padrão (R$)"
                                type="number"
                                value={config.financial?.defaultCreditLimit || 0}
                                onChange={e => setConfig({ ...config, financial: { ...config.financial, defaultCreditLimit: Number(e.target.value) } })}
                            />
                        )}
                    </div>
                </Card>

                {/* Operacional */}
                <Card title="Operacional & Turnos">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                            <div>
                                <span className="font-bold text-sm block">Bloquear fora do horário?</span>
                                <span className="text-xs text-gray-500">Impede vendas no PDV fora do turno.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.operational?.blockSalesOutsideHours || false}
                                    onChange={e => setConfig({ ...config, operational: { ...config.operational, blockSalesOutsideHours: e.target.checked } })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Abertura"
                                type="time"
                                value={config.operational?.openingTime || '07:00'}
                                onChange={e => setConfig({ ...config, operational: { ...config.operational, openingTime: e.target.value } })}
                            />
                            <Input
                                label="Fechamento"
                                type="time"
                                value={config.operational?.closingTime || '18:00'}
                                onChange={e => setConfig({ ...config, operational: { ...config.operational, closingTime: e.target.value } })}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
