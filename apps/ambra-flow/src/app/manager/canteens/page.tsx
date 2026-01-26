'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { canteenService, Canteen } from '@/services/canteen.service';

export default function CanteensPage() {
    const router = useRouter();
    const [canteens, setCanteens] = useState<Canteen[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newCanteenName, setNewCanteenName] = useState('');
    const [newCanteenType, setNewCanteenType] = useState<'COMMERCIAL' | 'GOVERNMENTAL'>('COMMERCIAL');

    useEffect(() => {
        loadCanteens();
    }, []);

    const loadCanteens = async () => {
        try {
            const data = await canteenService.findAll();
            setCanteens(data);
        } catch (error) {
            console.error('Failed to load canteens', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCanteenName.trim()) return;
        setIsCreating(true);
        try {
            await canteenService.create({ name: newCanteenName, type: newCanteenType });
            setShowModal(false);
            setNewCanteenName('');
            loadCanteens();
        } catch (error) {
            alert('Erro ao criar cantina.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Unidades (Cantinas)</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie as unidades físicas e seus operadores</p>
                </div>
                <Button icon="add" onClick={() => setShowModal(true)}>
                    Nova Unidade
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {canteens.map(canteen => (
                        <Card key={canteen.id} className="p-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/manager/canteens/${canteen.id}`)}>
                            <div className={`h-2 w-full ${canteen.type === 'COMMERCIAL' ? 'bg-primary' : 'bg-blue-500'}`} />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`rounded-full p-3 ${canteen.type === 'COMMERCIAL' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600'}`}>
                                        <span className="material-symbols-outlined text-2xl">store</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${canteen.type === 'COMMERCIAL' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {canteen.type === 'COMMERCIAL' ? 'Cantina' : 'Merenda'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{canteen.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{canteen._count?.operators || 0} Operadores vinculados</p>

                                <div className="flex items-center text-sm text-primary font-bold group">
                                    Gerenciar Equipe
                                    <span className="material-symbols-outlined ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nova Unidade"
            >
                <div className="space-y-4">
                    <Input
                        label="Nome da Unidade"
                        placeholder="Ex: Cantina do Bloco A"
                        value={newCanteenName}
                        onChange={(e) => setNewCanteenName(e.target.value)}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Unidade</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setNewCanteenType('COMMERCIAL')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newCanteenType === 'COMMERCIAL' ? 'border-primary bg-primary/5 text-primary' : 'border-border-light hover:border-gray-300'}`}
                            >
                                <span className="material-symbols-outlined">storefront</span>
                                <span className="text-sm font-bold">Comercial</span>
                            </button>
                            <button
                                onClick={() => setNewCanteenType('GOVERNMENTAL')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newCanteenType === 'GOVERNMENTAL' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-border-light hover:border-gray-300'}`}
                            >
                                <span className="material-symbols-outlined">school</span>
                                <span className="text-sm font-bold">Merenda</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} isLoading={isCreating}>Criar Unidade</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
