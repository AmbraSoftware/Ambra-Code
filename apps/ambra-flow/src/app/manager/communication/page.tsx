'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { announcementsService, Announcement } from '@/services/announcements.service';
import { CreateAnnouncementModal } from '@/components/communication/CreateAnnouncementModal';

export default function CommunicationPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await announcementsService.getAll();
            setAnnouncements(data);
        } catch (error) {
            console.error('Failed to load announcements', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este aviso?')) return;
        try {
            await announcementsService.delete(id);
            await loadData();
        } catch (error) {
            alert('Erro ao remover aviso.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comunicação</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie avisos e notificações para alunos e responsáveis.</p>
                </div>
                <Button icon="add" onClick={() => setIsModalOpen(true)}>
                    Novo Aviso
                </Button>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Carregando avisos...</div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                        <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">campaign</span>
                        <p className="text-gray-500 dark:text-gray-400">Nenhum aviso enviado ainda.</p>
                        <Button variant="ghost" className="mt-2 text-primary" onClick={() => setIsModalOpen(true)}>
                            Criar o primeiro aviso
                        </Button>
                    </div>
                ) : (
                    announcements.map((item) => (
                        <Card key={item.id} noPadding className="overflow-hidden hover:border-primary/50 transition-colors">
                            <div className="p-4 flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.targetRole === 'STUDENT' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                        item.targetRole === 'GUARDIAN' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    <span className="material-symbols-outlined">
                                        {item.targetRole === 'STUDENT' ? 'school' : 'family_restroom'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-4">
                                            {item.title}
                                        </h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                                        {item.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-[10px] rounded border border-gray-200 dark:border-zinc-700 font-medium uppercase">
                                                {item.targetRole === 'STUDENT' ? 'Alunos' :
                                                    item.targetRole === 'GUARDIAN' ? 'Responsáveis' : 'Todos'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-[10px] rounded border border-gray-200 dark:border-zinc-700 font-medium uppercase">
                                                {item.scope === 'SCHOOL' ? 'Escola Inteira' : item.scope}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">delete</span>
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <CreateAnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { loadData(); setIsModalOpen(false); }}
            />
        </div>
    );
}
