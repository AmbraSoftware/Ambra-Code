'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { UserCog, Plus, Trash2, Edit } from 'lucide-react';

type UserRole = 'OPERATOR_SALES' | 'OPERATOR_MEAL';

type CreateUserDto = {
    name: string;
    email?: string;
    password?: string;
    role: string;
    roles?: string[];
};

// Alias para compatibilidade
const ROLE_OPERATOR_SALES = 'OPERATOR_SALES';
const ROLE_OPERATOR_MEAL = 'OPERATOR_MEAL';

/**
 * Staff Management Page - Manager Mode
 * 
 * Permite que gestores criem e gerenciem operadores (OPERATOR_SALES, OPERATOR_MEAL).
 * Operadores têm acesso simplificado: apenas Nome, Login Simples e Senha.
 * 
 * @see AMBRA_CONTEXT.md - Segregação Total de Experiência
 */

interface StaffMember {
    id: string;
    name: string;
    email?: string;
    roles: string[];
    createdAt: string;
}

export default function StaffManagementPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [formData, setFormData] = useState<CreateUserDto>({
        name: '',
        email: '',
        password: '',
        role: 'OPERATOR_SALES',
    });

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setIsLoading(true);
        try {
            // Busca usuários com roles de operador
            const response = await api.get('/users', {
                params: {
                    role: 'OPERATOR_SALES,OPERATOR_MEAL',
                },
            });
            
            // Filtra apenas operadores
            const operators = response.data.filter((user: any) => {
                const roles = user.roles || [user.role].filter(Boolean);
                return roles.some((r: string) => 
                    r === 'OPERATOR_SALES' || r === 'OPERATOR_MEAL'
                );
            });
            
            setStaff(operators);
        } catch (error: any) {
            console.error('Failed to load staff', error);
            toast.error('Erro ao carregar operadores.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.password) {
            toast.error('Nome e senha são obrigatórios.');
            return;
        }

        // Validação de senha mínima
        if (formData.password.length < 8) {
            toast.error('A senha deve ter no mínimo 8 caracteres.');
            return;
        }

        try {
            // Cria usuário com role de operador
            // O backend aceita email opcional para operadores
            // Usa CreateUserDto do shared para garantir type safety
            const payload: CreateUserDto = {
                name: formData.name,
                password: formData.password,
                role: formData.role,
                // Envia roles como array (backend espera isso)
                roles: [formData.role],
            };

            // Se email foi fornecido, adiciona (opcional para operadores)
            if (formData.email && formData.email.trim()) {
                payload.email = formData.email.trim();
            }
            // Se não fornecido, o backend gera automaticamente para operadores

            await api.post('/users', payload);
            
            toast.success('Operador criado com sucesso!');
            setIsCreateModalOpen(false);
            resetForm();
            loadStaff();
        } catch (error: any) {
            console.error('Failed to create staff', error);
            const msg = error.response?.data?.message || 'Erro ao criar operador.';
            toast.error(Array.isArray(msg) ? msg[0] : msg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este operador?')) {
            return;
        }

        try {
            await api.delete(`/users/${id}`);
            toast.success('Operador removido com sucesso!');
            loadStaff();
        } catch (error: any) {
            console.error('Failed to delete staff', error);
            toast.error('Erro ao remover operador.');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'OPERATOR_SALES',
        });
    };

    const openEditModal = (member: StaffMember) => {
        setEditingStaff(member);
        setFormData({
            name: member.name,
            email: member.email || '',
            password: '', // Não preenche senha por segurança
            role: (member.roles?.[0] as any) || 'OPERATOR_SALES',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingStaff || !formData.name) {
            toast.error('Nome é obrigatório.');
            return;
        }

        try {
            const payload: any = {
                name: formData.name,
            };

            // Atualiza email se fornecido
            if (formData.email && formData.email.trim()) {
                payload.email = formData.email.trim();
            }

            // Atualiza senha apenas se fornecida
            if (formData.password && formData.password.length >= 8) {
                payload.password = formData.password;
            }

            // Atualiza role se mudou
            if (formData.role !== (editingStaff.roles?.[0] || '')) {
                payload.role = formData.role;
            }

            await api.patch(`/users/${editingStaff.id}`, payload);
            
            toast.success('Operador atualizado com sucesso!');
            setIsEditModalOpen(false);
            setEditingStaff(null);
            resetForm();
            loadStaff();
        } catch (error: any) {
            console.error('Failed to update staff', error);
            const msg = error.response?.data?.message || 'Erro ao atualizar operador.';
            toast.error(Array.isArray(msg) ? msg[0] : msg);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-text-light dark:text-text-dark tracking-tight">
                        Gestão de Operadores
                    </h1>
                    <p className="text-muted-light dark:text-muted-dark mt-1">
                        Gerencie os operadores que têm acesso ao sistema de vendas.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsCreateModalOpen(true);
                    }}
                    leftIcon={<Plus className="w-5 h-5" />}
                >
                    Novo Operador
                </Button>
            </div>

            {/* Staff List */}
            <Card title={`Operadores (${staff.length})`}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="material-symbols-outlined animate-spin text-4xl text-muted-light dark:text-muted-dark">
                            progress_activity
                        </span>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <UserCog className="text-muted-light dark:text-muted-dark w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-text-light dark:text-text-dark font-medium">Nenhum operador cadastrado</p>
                        <p className="text-muted-light dark:text-muted-dark text-sm mt-1">
                            Crie o primeiro operador para começar a usar o sistema de vendas.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border-light dark:border-border-dark">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-light dark:text-muted-dark">
                                        Nome
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-light dark:text-muted-dark">
                                        Login
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-light dark:text-muted-dark">
                                        Tipo
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-light dark:text-muted-dark">
                                        Criado em
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-light dark:text-muted-dark">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map((member) => {
                                    const roles = member.roles || [];
                                    const roleType = roles.find((r: string) => 
                                        r === ROLE_OPERATOR_SALES || 
                                        r === ROLE_OPERATOR_MEAL
                                    ) || roles[0] || 'OPERATOR';
                                    
                                    const roleLabel = roleType === ROLE_OPERATOR_SALES 
                                        ? 'Vendas' 
                                        : roleType === ROLE_OPERATOR_MEAL
                                        ? 'Merenda'
                                        : 'Operador';

                                    return (
                                        <tr
                                            key={member.id}
                                            className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-text-light dark:text-text-dark">
                                                    {member.name}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-muted-light dark:text-muted-dark">
                                                    {member.email || 'Sem email'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {roleLabel}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-muted-light dark:text-muted-dark">
                                                    {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Remover"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                }}
                title="Novo Operador"
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Login (Email) <span className="text-gray-400 text-xs">(Opcional)</span>
                        </label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="operador@escola.com (opcional)"
                        />
                        <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                            Se não fornecido, o sistema gerará um login automático.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Senha <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Mínimo 8 caracteres"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Operador <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            className="w-full p-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary outline-none transition-all"
                        >
                            <option value={ROLE_OPERATOR_SALES}>Operador de Vendas (PDV)</option>
                            <option value={ROLE_OPERATOR_MEAL}>Operador de Merenda (Check-in)</option>
                        </select>
                        <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                            Vendas: Acesso ao PDV para vendas. Merenda: Acesso ao check-in nutricional.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                resetForm();
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate}>
                            Criar Operador
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingStaff(null);
                    resetForm();
                }}
                title="Editar Operador"
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Login (Email)
                        </label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="operador@escola.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nova Senha <span className="text-gray-400 text-xs">(Deixe em branco para manter)</span>
                        </label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Mínimo 8 caracteres"
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Operador
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            className="w-full p-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary outline-none transition-all"
                        >
                            <option value={ROLE_OPERATOR_SALES}>Operador de Vendas (PDV)</option>
                            <option value={ROLE_OPERATOR_MEAL}>Operador de Merenda (Check-in)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditingStaff(null);
                                resetForm();
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate}>
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
