'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardService, DashboardMetrics } from '@/services/dashboard.service';
import { StockAlertsWidget } from '@/components/dashboard/StockAlertsWidget';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ShoppingCart, TrendingUp, Users, DollarSign, Package, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function ManagerDashboardPage() {
    const router = useRouter();
    const [userName, setUserName] = useState('Gestor');
    const [userRole, setUserRole] = useState('');
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLinkSchoolModalOpen, setIsLinkSchoolModalOpen] = useState(false);
    const [schoolCode, setSchoolCode] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserName(user.name?.split(' ')[0] || 'Gestor');
                setUserRole(user.role);

                // Check if Operator needs to link school
                if (user.role === 'OPERATOR_ADMIN' && !user.schoolId) {
                    setIsLinkSchoolModalOpen(true);
                }
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [metricsData, salesData] = await Promise.all([
                dashboardService.getMetrics(),
                dashboardService.getSalesChart('week')
            ]);
            setMetrics(metricsData);
            setChartData(salesData || []);
        } catch (error) {
            console.error('Failed to load dashboard data', error);
            toast.error('Erro ao carregar dados do dashboard.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLinkSchool = async () => {
        if (!schoolCode) return;
        setIsLinking(true);
        try {
            const result = await dashboardService.linkSchool(schoolCode);
            toast.success('Escola vinculada com sucesso!');
            
            // Update local user context
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.schoolId = result.schoolId;
                user.schoolName = result.schoolName;
                localStorage.setItem('user', JSON.stringify(user));
            }
            
            setIsLinkSchoolModalOpen(false);
            loadData(); // Reload to reflect changes
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Código inválido ou escola não encontrada.');
        } finally {
            setIsLinking(false);
        }
    };

    const calculateTrend = (current?: number, previous?: number) => {
        if (!current || !previous || previous === 0) return '+0%';
        const percent = ((current - previous) / previous) * 100;
        return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}%`;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-text-light dark:text-text-dark tracking-tight">
                        Olá, {userName}! 👋
                    </h1>
                    <p className="text-muted-light dark:text-muted-dark mt-1">
                        Aqui está o resumo da sua operação hoje.
                    </p>
                </div>
                <div>
                    <Link href="/pos">
                        <Button variant="primary" size="lg" className="shadow-lg shadow-primary/25" leftIcon={<ShoppingCart className="w-5 h-5" />}>
                            Novo Pedido
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Vendas Hoje"
                    value={isLoading ? '...' : `R$ ${metrics?.revenue?.lastDay?.toFixed(2) || '0.00'}`}
                    trend={isLoading ? '' : calculateTrend(metrics?.revenue?.lastDay, metrics?.revenue?.lastWeek)}
                    trendUp={(metrics?.revenue?.lastDay || 0) >= (metrics?.revenue?.lastWeek || 0)}
                    icon={DollarSign}
                    variant="green"
                />
                <MetricCard
                    title="Pedidos (24h)"
                    value={isLoading ? '...' : metrics?.orders?.lastDay || 0}
                    trend={isLoading ? '' : calculateTrend(metrics?.orders?.lastDay, metrics?.orders?.lastWeek)}
                    trendUp={(metrics?.orders?.lastDay || 0) >= (metrics?.orders?.lastWeek || 0)}
                    icon={ShoppingCart}
                    variant="blue"
                />
                <MetricCard
                    title="Alunos Ativos"
                    value={isLoading ? '...' : metrics?.users?.active24h || 0}
                    trend="vs. ontem"
                    trendUp={true}
                    icon={Users}
                    variant="orange"
                />
                <MetricCard
                    title="Ticket Médio"
                    value={isLoading ? '...' : `R$ ${(metrics?.revenue?.lastDay && metrics?.orders?.lastDay) ? (metrics.revenue.lastDay / metrics.orders.lastDay).toFixed(2) : '0.00'}`}
                    trend="Estabilidade"
                    trendUp={true}
                    icon={TrendingUp}
                    variant="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <Card className="lg:col-span-2 h-[400px]" title="Vendas da Semana">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FC5407" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#FC5407" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#FC5407" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Stock Alerts (Existing Widget) */}
                <div className="lg:col-span-1">
                    <StockAlertsWidget />
                </div>
            </div>

            {/* Recent Orders */}
            <Card title="Últimos Pedidos" actions={<Button variant="link" size="sm">Ver todos</Button>}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <Package className="text-muted-light dark:text-muted-dark w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-text-light dark:text-text-dark font-medium">Nenhum pedido recente</p>
                    <p className="text-muted-light dark:text-muted-dark text-sm mt-1">As vendas aparecerão aqui em tempo real.</p>
                </div>
            </Card>

            {/* Link School Modal for Operators */}
            <Modal
                isOpen={isLinkSchoolModalOpen}
                onClose={() => {}} // Prevent closing without linking? Or allow close to see empty dashboard?
                title="Vincular à Escola"
                size="md"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mt-0.5">link</span>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-bold mb-1">Associação Necessária</p>
                            <p>Para operar sua cantina, você precisa vincular sua conta a uma escola cadastrada no sistema. Solicite o <strong>Código da Escola</strong> ao diretor.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Código da Escola
                        </label>
                        <input
                            type="text"
                            value={schoolCode}
                            onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                            placeholder="EX: SCH-1234"
                            className="w-full p-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark uppercase font-mono tracking-wider focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button 
                            onClick={handleLinkSchool} 
                            disabled={!schoolCode}
                            className="w-full sm:w-auto"
                        >
                            Vincular Escola
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function MetricCard({ title, value, trend, trendUp, icon: Icon, variant }: any) {
    const variants: Record<string, string> = {
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    };

    return (
        <Card noPadding className="p-6 transition-all hover:scale-[1.02] hover:shadow-md cursor-default">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-light dark:text-muted-dark mb-1">{title}</p>
                    <h4 className="text-2xl font-black text-text-light dark:text-text-dark tracking-tight">{value}</h4>
                    <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {trend && (trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />)}
                        {trend}
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${variants[variant] || variants.blue}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </Card>
    )
}
