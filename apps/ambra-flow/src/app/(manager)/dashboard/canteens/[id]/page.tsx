'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { canteenService, Canteen, Operator } from '@/services/canteen.service';

// Generate static params for export mode
export function generateStaticParams() {
  // Return empty array - this page will be rendered on client with actual data
  return [];
}

export default function CanteenDetailsPage() {
    const params = useParams(); // params.id
    const router = useRouter();
    const canteenId = params.id as string;

    const [canteen, setCanteen] = useState<Canteen | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Operator Modal
    const [showOpModal, setShowOpModal] = useState(false);
    const [opName, setOpName] = useState('');
    const [opEmail, setOpEmail] = useState('');
    const [opPassword, setOpPassword] = useState('');
    const [isSavingOp, setIsSavingOp] = useState(false);

    useEffect(() => {
        if (canteenId) loadCanteen();
    }, [canteenId]);

    const loadCanteen = async () => {
        try {
            const data = await canteenService.findOne(canteenId);
            setCanteen(data);
        } catch (error) {
            console.error('Failed to load canteen', error);
            router.push('/dashboard/canteens');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOperator = async () => {
        if (!opName || !opEmail || !opPassword) return;
        setIsSavingOp(true);
        try {
            await canteenService.addOperator(canteenId, {
                name: opName,
                email: opEmail,
                passwordHash: opPassword // Backend will hash it
            });
            setShowOpModal(false);
            setOpName('');
            setOpEmail('');
            setOpPassword('');
            loadCanteen();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao adicionar operador.');
        } finally {
            setIsSavingOp(false);
        }
    };

    const handleRemoveOperator = async (operatorId: string) => {
        if (!confirm('Tem certeza que deseja remover este operador? O acesso será revogado.')) return;
        try {
            await canteenService.removeOperator(canteenId, operatorId);
            loadCanteen();
        } catch (error) {
            alert('Erro ao remover operador.');
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>;
    if (!canteen) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-zinc-800 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{canteen.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`w-2 h-2 rounded-full ${canteen.type === 'COMMERCIAL' ? 'bg-primary' : 'bg-blue-500'}`} />
                        {canteen.type === 'COMMERCIAL' ? 'Comercial' : 'Governamental (Merenda)'}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Stats / Overview */}
                <Card className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-lg mb-4">Resumo</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-lg">
                        <span className="text-gray-500 text-sm">Operadores</span>
                        <span className="font-bold text-lg">{canteen.operators?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-lg">
                        <span className="text-gray-500 text-sm">Status</span>
                        <span className="font-bold text-green-600 text-sm">ATIVO</span>
                    </div>
                </Card>

                {/* Operators List */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg">Equipe (Operadores)</h3>
                        <Button size="sm" icon="person_add" onClick={() => setShowOpModal(true)}>
                            Adicionar Operador
                        </Button>
                    </div>

                    <div className="overflow-hidden border border-border-light dark:border-border-dark rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 font-medium border-b border-border-light dark:border-border-dark">
                                <tr>
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3">Email (Login)</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {canteen.operators?.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                            Nenhum operador cadastrado.
                                        </td>
                                    </tr>
                                ) : (
                                    canteen.operators?.map(op => (
                                        <tr key={op.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{op.name}</td>
                                            <td className="px-4 py-3 text-gray-500">{op.email}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleRemoveOperator(op.id)}
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                    title="Remover Acesso"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={showOpModal}
                onClose={() => setShowOpModal(false)}
                title="Novo Operador"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                        O operardor terá acesso apenas ao PDV e à Fila desta unidade.
                    </p>
                    <Input
                        label="Nome Completo"
                        placeholder="Ex: Maria Silva"
                        value={opName}
                        onChange={(e) => setOpName(e.target.value)}
                    />
                    <Input
                        label="Email de Acesso"
                        type="email"
                        placeholder="maria.silva@escola.com"
                        value={opEmail}
                        onChange={(e) => setOpEmail(e.target.value)}
                    />
                    <Input
                        label="Senha Inicial"
                        type="password"
                        placeholder="********"
                        value={opPassword}
                        onChange={(e) => setOpPassword(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setShowOpModal(false)}>Cancelar</Button>
                        <Button onClick={handleAddOperator} isLoading={isSavingOp}>Criar Acesso</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
