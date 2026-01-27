'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usersService, User, CreateUserDto } from '@/services/users.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ImportUsersModal } from '@/components/manager/ImportUsersModal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const ALLERGIES_OPTIONS = [
    'Amendoim', 'Lactose', 'Glúten', 'Ovos', 'Peixe', 'Mariscos', 'Soja', 'Nozes'
];

// Zod Schema for User
const createUserSchema = z.object({
    name: z.string().min(3, 'Nome muito curto'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter 6+ caracteres'),
    role: z.enum(['STUDENT', 'GUARDIAN']),
    mobilePhone: z.string().optional(),
    taxId: z.string().optional(),
    // Student Profile
    class: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    dailyLimit: z.any().optional().transform(val => val ? Number(val) : undefined)
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UsersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentFilter = searchParams.get('filter') || 'all';

    const [activeTab, setActiveTab] = useState<'students' | 'guardians'>('students');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState<{ total: number; negativeBalance: number; inactive30d: number }>({
        total: 0,
        negativeBalance: 0,
        inactive30d: 0,
    });

    const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            role: 'STUDENT',
            allergies: []
        }
    });

    const selectedAllergies = watch('allergies') || [];

    useEffect(() => {
        loadData();
        if (activeTab === 'students') {
            loadStats();
        }
    }, [currentFilter, activeTab]);

    const loadStats = async () => {
        try {
            const response = await usersService.getStats();
            setStats(response);
        } catch (error) {
            console.error('Failed to load stats', error);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const apiFilter = currentFilter === 'all' ? undefined : currentFilter;
            const role = activeTab === 'students' ? 'STUDENT' : 'GUARDIAN';

            const data = await usersService.getAll({
                role,
                filter: activeTab === 'students' ? apiFilter : undefined
            });
            // Force re-render with new reference
            setUsers([...data]);
        } catch (error) {
            console.error('Failed to load users', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (filter: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filter === 'all') {
            params.delete('filter');
        } else {
            params.set('filter', filter);
        }
        router.push(`/dashboard/users?${params.toString()}`);
    };

    const handleOpenModal = () => {
        reset({
            name: '',
            email: '',
            password: '',
            role: activeTab === 'students' ? 'STUDENT' : 'GUARDIAN',
            mobilePhone: '',
            taxId: '',
            class: '',
            allergies: [],
            dailyLimit: undefined
        });
        setIsModalOpen(true);
    };

    const onSubmit = async (data: CreateUserForm) => {
        try {
            const payload: CreateUserDto = {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                mobilePhone: data.mobilePhone,
                taxId: data.taxId,
                profile: data.role === 'STUDENT' ? {
                    class: data.class,
                    restrictions: data.allergies, // Mapping allergies to restrictions
                    dailyLimit: data.dailyLimit ? Number(data.dailyLimit) : undefined
                } : undefined
            };

            await usersService.create(payload);
            setIsModalOpen(false);
            toast.success('Usuário cadastrado com sucesso!');
            
            await Promise.all([
                loadData(),
                activeTab === 'students' ? loadStats() : Promise.resolve()
            ]);
        } catch (error) {
            console.error('Failed to create user', error);
            toast.error('Erro ao cadastrar usuário.');
        }
    };

    const toggleAllergy = (allergy: string) => {
        const current = selectedAllergies;
        if (current.includes(allergy)) {
            setValue('allergies', current.filter(a => a !== allergy));
        } else {
            setValue('allergies', [...current, allergy]);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return;

        try {
            await usersService.delete(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Não foi possível remover o usuário.');
        }
    };

    const handleExportCSV = () => {
        try {
            if (!users.length) {
                alert('Não há dados para exportar.');
                return;
            }

            const isStudent = activeTab === 'students';
            const headers = isStudent
                ? ['ID', 'Nome', 'Email', 'Saldo (R$)', 'Turma', 'Status']
                : ['ID', 'Nome', 'Email', 'CPF/TaxID', 'Celular', 'Dependentes'];

            const csvRows = [
                headers.join(','),
                ...users.map(u => {
                    if (isStudent) {
                        const balance = Number(u.wallet?.balance || 0).toFixed(2);
                        return [
                            `"${u.id}"`,
                            `"${u.name}"`,
                            `"${u.email}"`,
                            balance,
                            `"${u.profile?.class || ''}"`,
                            u.createdAt // Using as placeholder for status if no deletedAt
                        ].join(',');
                    } else {
                        return [
                            `"${u.id}"`,
                            `"${u.name}"`,
                            `"${u.email}"`,
                            `"${u.taxId || ''}"`,
                            `"${u.mobilePhone || ''}"`,
                            u.dependents?.length || 0
                        ].join(',');
                    }
                })
            ].join('\n');

            const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export CSV', error);
            alert('Erro ao gerar arquivo CSV.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Usuários</h1>
                    <p className="text-muted-light dark:text-muted-dark">Gerencie alunos, responsáveis e permissões.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        icon="download"
                        variant="outline"
                        onClick={handleExportCSV}
                    >
                        Exportar CSV
                    </Button>
                    <Button
                        icon="upload"
                        variant="outline"
                        onClick={() => setIsImportModalOpen(true)}
                    >
                        Importar
                    </Button>
                    <Button
                        icon="person_add"
                        onClick={handleOpenModal}
                    >
                        {activeTab === 'students' ? 'Novo Aluno' : 'Novo Responsável'}
                    </Button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-border-light dark:border-border-dark">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'students'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                        }`}
                >
                    Alunos
                </button>
                <button
                    onClick={() => setActiveTab('guardians')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'guardians'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                        }`}
                >
                    Responsáveis
                </button>
            </div>

            <Card className="min-h-[500px]" noPadding>
                <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="w-full max-w-sm">
                        <Input
                            placeholder="Buscar por nome ou e-mail..."
                            leftIcon="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {activeTab === 'students' && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${currentFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-zinc-800 text-muted-light dark:text-muted-dark hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                            >
                                <span>Todos</span>
                                {stats.total > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${currentFilter === 'all' ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                        {stats.total}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => handleFilterChange('negative_balance')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${currentFilter === 'negative_balance' ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100'}`}
                            >
                                <span>Saldo Negativo</span>
                                {stats.negativeBalance > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${currentFilter === 'negative_balance' ? 'bg-white/20' : 'bg-red-600/20 text-red-700 dark:text-red-400'}`}>
                                        {stats.negativeBalance}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => handleFilterChange('inactive_30d')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${currentFilter === 'inactive_30d' ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100'}`}
                            >
                                <span>Inativos (30 dias)</span>
                                {stats.inactive30d > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${currentFilter === 'inactive_30d' ? 'bg-white/20' : 'bg-amber-600/20 text-amber-700 dark:text-amber-400'}`}>
                                        {stats.inactive30d}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <Table<User>
                    isLoading={isLoading}
                    data={filteredUsers}
                    keyExtractor={(item) => item.id}
                    columns={
                        activeTab === 'students'
                            ? [
                                {
                                    header: 'Aluno',
                                    accessorKey: 'name',
                                    cell: (item) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-light dark:text-text-dark">{item.name}</p>
                                                <p className="text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-tight">{item.email}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Saldo',
                                    accessorKey: 'wallet',
                                    cell: (item) => {
                                        const balance = Number(item.wallet?.balance ?? 0);
                                        const isNegativeFilter = currentFilter === 'negative_balance';
                                        return (
                                            <span
                                                className={`font-bold ${balance < 0 ? 'text-red-500' : 'text-green-600'} ${isNegativeFilter && balance < 0 ? 'px-2 py-1 rounded bg-red-50 dark:bg-red-900/20' : ''}`}
                                            >
                                                R$ {balance.toFixed(2)}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    header: 'Turma',
                                    cell: (item) => (
                                        <Badge variant="neutral" className="font-medium">
                                            {item.profile?.class || 'S/ Turma'}
                                        </Badge>
                                    )
                                },
                                {
                                    header: 'Ações',
                                    align: 'right',
                                    cell: (item) => (
                                        <div className="flex justify-end gap-2">
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
                            ]
                            : [
                                {
                                    header: 'Responsável',
                                    accessorKey: 'name',
                                    cell: (item) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-light dark:text-text-dark">{item.name}</p>
                                                <p className="text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-tight">{item.email}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Contato',
                                    accessorKey: 'mobilePhone', // Assumindo que virá no futuro, ou usamos email
                                    cell: (item) => item.mobilePhone || '-'
                                },
                                {
                                    header: 'CPF/TaxID',
                                    accessorKey: 'taxId',
                                    cell: (item) => item.taxId || '-'
                                },
                                {
                                    header: 'Ações',
                                    align: 'right',
                                    cell: (item) => (
                                        <div className="flex justify-end gap-2">
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
                            ]
                    }
                />
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={activeTab === 'students' ? "Novo Aluno" : "Novo Responsável"}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Nome Completo"
                        placeholder="Ex: Ana Silva"
                        {...register('name')}
                        error={errors.name?.message}
                    />
                    <Input
                        label="E-mail"
                        type="email"
                        placeholder="ana@email.com"
                        {...register('email')}
                        error={errors.email?.message}
                    />
                    <Input
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        error={errors.password?.message}
                    />

                    {activeTab === 'students' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Turma/Série"
                                    placeholder="Ex: 5º Ano A"
                                    {...register('class')}
                                />
                                <Input
                                    label="Limite Diário (R$)"
                                    type="number"
                                    placeholder="0.00"
                                    {...register('dailyLimit')}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-light dark:text-text-dark">Restrições Alimentares</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ALLERGIES_OPTIONS.map(allergy => (
                                        <div 
                                            key={allergy}
                                            onClick={() => toggleAllergy(allergy)}
                                            className={`cursor-pointer px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                                                selectedAllergies.includes(allergy) 
                                                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
                                                : 'bg-white border-border-light text-muted-light dark:bg-zinc-800 dark:border-border-dark dark:text-muted-dark hover:border-primary/50'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedAllergies.includes(allergy) ? 'bg-red-500 border-red-500' : 'border-gray-400'}`}>
                                                {selectedAllergies.includes(allergy) && <span className="text-white text-[10px] material-symbols-outlined">check</span>}
                                            </div>
                                            {allergy}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'guardians' && (
                        <>
                            <Input
                                label="CPF (Apenas números)"
                                placeholder="000.000.000-00"
                                {...register('taxId')}
                                error={errors.taxId?.message}
                            />
                            <Input
                                label="Celular"
                                placeholder="(11) 90000-0000"
                                {...register('mobilePhone')}
                                error={errors.mobilePhone?.message}
                            />
                        </>
                    )}

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
                            {activeTab === 'students' ? 'Cadastrar Aluno' : 'Cadastrar Responsável'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ImportUsersModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                role={activeTab === 'students' ? 'STUDENT' : 'GUARDIAN'}
                onSuccess={() => { loadData(); loadStats(); }}
            />


        </div>
    );
}
