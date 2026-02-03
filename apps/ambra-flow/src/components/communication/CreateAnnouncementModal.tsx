'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { announcementsService, CreateAnnouncementDto } from '@/services/announcements.service';
import { UserRole } from '@/services/auth.service';

interface CreateAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateAnnouncementModal({ isOpen, onClose, onSuccess }: CreateAnnouncementModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CreateAnnouncementDto>({
        title: '',
        message: '',
        targetRole: 'STUDENT',
        scope: 'SCHOOL',
        targetIds: []
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await announcementsService.create({
                ...formData,
                targetRole: formData.targetRole as UserRole // Cast simples
            });
            onSuccess();
        } catch (error) {
            console.error('Create announcement error', error);
            alert('Erro ao criar aviso.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Aviso" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Título do Aviso"
                    placeholder="Ex: Cardápio Especial de Páscoa"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mensagem
                    </label>
                    <textarea
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white min-h-[100px]"
                        placeholder="Digite o conteúdo do aviso..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quem deve receber?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, targetRole: 'STUDENT' })}
                            className={`p-3 rounded-lg border text-left transition-all ${formData.targetRole === 'STUDENT'
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-blue-500">school</span>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">Alunos</span>
                            </div>
                            <p className="text-xs text-gray-500">Notificar estudantes via App</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, targetRole: 'GUARDIAN' })}
                            className={`p-3 rounded-lg border text-left transition-all ${formData.targetRole === 'GUARDIAN'
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-purple-500">family_restroom</span>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">Responsáveis</span>
                            </div>
                            <p className="text-xs text-gray-500">Notificar pais e tutores</p>
                        </button>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 mt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading} icon="send">
                        Enviar Aviso
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
