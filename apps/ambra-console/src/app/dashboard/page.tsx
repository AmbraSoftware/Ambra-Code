/**
 * @file src/app/dashboard/page.tsx
 * @fileoverview Main dashboard overview page for the Nodum Console.
 * @description This page displays key performance indicators (KPIs) and operational health metrics.
 */
"use client"

import { DollarSign, BarChart, Banknote, Landmark, Users, Activity } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { PageHeader } from '@/components/page-header';
import { RevenueCompositionChart } from '@/components/dashboard/revenue-composition-chart';
import { Censored } from '@/contexts/censorship-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useDashboard } from '@/hooks/use-dashboard';

export default function OverviewPage() {
  const { user } = useAuth();
  const { metrics, isFetching } = useDashboard(user);

  if (isFetching || !metrics) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Sincronizando com o Nodo Soberano...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Visão Geral" description="Saúde operacional, liquidez financeira e estabilidade da infraestrutura." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="MRR (Receita Recorrente)"
          value={<Censored value={metrics.mrr} censorChar='*' />}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          change="Calculado via Planos" // Static label for now
          valueClassName="font-code"
          tooltip="Receita Mensal Recorrente baseada nas assinaturas ativas das Escolas."
        />
        <MetricCard
          title="GMV (Volume Bruto)"
          value={<Censored value={metrics.gmv} censorChar='*' />}
          icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
          change="---"
          valueClassName="font-code text-muted-foreground"
          tooltip="Volume Bruto de Mercadorias transacionado em todo o ecossistema."
        />
        <MetricCard
          title="Net Revenue (Lucro Líquido)"
          value={<Censored value={metrics.netRevenue} censorChar='*' />}
          icon={<Banknote className="h-4 w-4 text-muted-foreground" />}
          change="---"
          valueClassName="font-code text-muted-foreground"
          tooltip="Receita Líquida após dedução de taxas e splits."
        />
        <MetricCard
          title="Float Financeiro"
          value={<Censored value={metrics.financialFloat} censorChar='*' />}
          icon={<Landmark className="h-4 w-4 text-muted-foreground" />}
          change="---"
          valueClassName="font-code text-muted-foreground"
          tooltip="Valor total atualmente custodiado nas carteiras (Wallet) do sistema."
        />
        <MetricCard
          title="Escolas Ativas" // Changed from Operators to Schools as per Backend
          value={metrics.totalSchools}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          change="Total do ecossistema"
          valueClassName="font-code"
          tooltip="Número de tenants (escolas) com status Ativo."
        />
        <MetricCard
          title="Usuários Finais"
          value={metrics.endUsers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          change="Total de alunos"
          valueClassName="font-code"
          tooltip="Contagem total de Alunos e Responsáveis cadastrados."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7 lg:gap-8">
        <Card className="lg:col-span-5">
          <SalesChart data={metrics.salesHistory} />
        </Card>
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-8">
          <RevenueCompositionChart data={metrics.revenueComposition} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Uptime do Sistema
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-code">99.98%</div>
              <p className="text-xs text-muted-foreground">
                Últimos 90 dias
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
