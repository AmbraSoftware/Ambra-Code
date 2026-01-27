/**
 * @file src/app/dashboard/financial-audit/page.tsx
 * @fileoverview Audit page for the Nodum Console.
 * @description This page provides a comprehensive view of system health, security, financial costs, and legal documentation.
 */
"use client";

import { PageHeader } from "@/components/page-header";
import { WebhookMonitor } from "@/components/dashboard/webhook-monitor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Shield, CircleDollarSign, Gavel, Server, Cpu, AlertTriangle, FileDown, MoreHorizontal, PlusCircle, ArrowUpDown, Link as LinkIcon } from "lucide-react";
import { HealthStatusCard } from "@/components/audit/health-status-card";
import { SystemLoadChart } from "@/components/audit/system-load-chart";
import { IncidentLog } from "@/components/audit/incident-log";
import { AsaasHealthTab } from "@/components/audit/asaas-health-tab";
import { PlatformCommissionsView } from "@/components/audit/platform-commissions-view";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskDashboardWidget } from "@/components/dashboard/RiskDashboardWidget";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Censored } from "@/contexts/censorship-context";
import { useFetch } from "@/hooks/use-api";
import type { OperationalCost, FiscalDocument } from "@/types";

type SortDirection = 'asc' | 'desc';


function SystemTab() {
    return (
        <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <HealthStatusCard
                    title="API Gateway"
                    value="99.99%"
                    status="Operational"
                    icon={<Server className="h-6 w-6" />}
                />
                <HealthStatusCard
                    title="Banco de Dados Principal"
                    value="12ms"
                    status="Healthy"
                    icon={<Server className="h-6 w-6" />}
                />
                <HealthStatusCard
                    title="Cache Redis"
                    value="42% Mem"
                    status="Optimized"
                    icon={<Cpu className="h-6 w-6" />}
                />
                <HealthStatusCard
                    title="Motor de Webhooks"
                    value="Ocioso"
                    status="Healthy"
                    icon={<Shield className="h-6 w-6" />}
                />
            </div>
            <WebhookMonitor />
        </div>
    )
}

function SecurityTab() {
    return (
        <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <HealthStatusCard
                    title="API Gateway"
                    value="99.98%"
                    status="Operational"
                    icon={<Server className="h-6 w-6" />}
                />
                <HealthStatusCard
                    title="Banco de Dados Principal"
                    value="12ms"
                    status="Healthy"
                    icon={<Server className="h-6 w-6" />}
                />
                <HealthStatusCard
                    title="Cache Redis"
                    value="42% Mem"
                    status="Optimized"
                    icon={<Cpu className="h-6 w-6" />}
                />
                <HealthStatusCard
                    title="Cadeia de Auditoria"
                    value="Seguro"
                    status="Valid"
                    icon={<Shield className="h-6 w-6" />}
                />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-2">
                    <SystemLoadChart />
                </div>
                <div>
                    <IncidentLog />
                </div>
            </div>
        </div>
    )
}

function FinancialTab() {
    const { data: operationalCosts = [], isLoading } = useFetch<OperationalCost[]>('/finance/costs'); // Placeholder endpoint
    // const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>(initialOperationalCosts);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof OperationalCost, direction: SortDirection } | null>({ key: 'cost', direction: 'desc' });

    const handleSort = (key: keyof OperationalCost) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedCosts = useMemo(() => {
        let sortableItems = [...operationalCosts];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                // @ts-ignore
                const aValue = a[sortConfig.key];
                // @ts-ignore
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortableItems.filter(cost =>
            cost.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cost.provider.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [operationalCosts, searchTerm, sortConfig]);

    return (
        <div className="mt-6 space-y-6">
            {/* [v4.2] War Room - Risk Monitor */}
            <div className="grid gap-4 md:grid-cols-4">
                <RiskDashboardWidget />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    title="Custo Operacional (Estimado)"
                    value="R$ 0,00"
                    icon={<CircleDollarSign className="h-4 w-4 text-muted-foreground" />}
                    change="Integração Pendente"
                    valueClassName="font-code"
                />
                <MetricCard
                    title="Custo por Transação (CPT)"
                    value="R$ 0,00"
                    icon={<CircleDollarSign className="h-4 w-4 text-muted-foreground" />}
                    change="Média dos últimos 30 dias"
                    valueClassName="font-code"
                />
                <MetricCard
                    title="Próxima Fatura"
                    value="Em dia"
                    icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                    change="Sem pendências"
                    valueClassName="font-code"
                />
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Detalhamento de Custos</CardTitle>
                            <CardDescription>Lista de todos os custos operacionais recorrentes da plataforma.</CardDescription>
                        </div>
                        <Input
                            placeholder="Buscar por categoria ou provedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-auto"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('category')}>
                                        Categoria
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('provider')}>
                                        Provedor
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('cost')}>
                                        Custo Mensal
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Última Fatura</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedCosts.map((cost) => (
                                <TableRow key={cost.id}>
                                    <TableCell className="font-medium">{cost.category}</TableCell>
                                    <TableCell>{cost.provider}</TableCell>
                                    <TableCell className="font-code"><Censored value={cost.cost} censorChar="*" /></TableCell>
                                    <TableCell>
                                        <Badge variant={cost.status === "Pago" ? "secondary" : "outline"} className={
                                            cost.status === "Pago" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                                                cost.status === "Pendente" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" : ""
                                        }>
                                            {cost.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{cost.lastInvoice}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Ver detalhes</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function LegalTab() {
    const { data: invoices, isLoading } = useFetch<any[]>('/fiscal/invoices');

    // Adapter: Backend Invoice -> Frontend FiscalDocument
    const fiscalDocuments: FiscalDocument[] = (invoices || []).map((inv: any) => ({
        id: inv.id,
        tenant: inv.schoolId || 'N/A', // Backend returns schoolId
        value: Number(inv.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), // Convert to formatted string
        issueDate: new Date(inv.createdAt).toISOString().split('T')[0],
        status: (inv.status === 'PENDING' ? 'Processando' : 'Emitida') as 'Processando' | 'Emitida', // Cast status
        url: '#'
    }));

    // const [fiscalDocuments, setFiscalDocuments] = useState<FiscalDocument[]>(initialFiscalDocuments);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof FiscalDocument, direction: SortDirection } | null>({ key: 'issueDate', direction: 'desc' });

    const handleSort = (key: keyof FiscalDocument) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedDocs = useMemo(() => {
        let sortableItems = [...fiscalDocuments];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                // @ts-ignore
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                // @ts-ignore
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortableItems.filter(doc =>
            doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.tenant.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [fiscalDocuments, searchTerm, sortConfig]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Emitida":
                return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Emitida</Badge>;
            case "Processando":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Processando</Badge>;
            case "Cancelada":
                return <Badge variant="destructive">Cancelada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="mt-6 space-y-6">
            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="invoices">Notas Escolares</TabsTrigger>
                    <TabsTrigger value="commissions">Minhas Comissões (Fiscal Batch)</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-6 mt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Automação Fiscal"
                            value="Ativa"
                            icon={<Gavel className="h-4 w-4 text-green-500" />}
                            change="Notas Fiscais Mensais"
                            valueClassName="text-green-600"
                        />
                    </div>
                    <PageHeader
                        title="Auditoria de Documentos Fiscais"
                        description="Gerencie e audite todas as notas fiscais emitidas pelo sistema."
                        actions={
                            <div className="flex w-full sm:w-auto gap-2">
                                <Input
                                    placeholder="Buscar por doc ou tenant..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-auto"
                                />
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Emitir Documento
                                </Button>
                            </div>
                        }
                    />
                    <Card>
                        <CardHeader>
                            <CardTitle>Últimos Documentos Emitidos</CardTitle>
                            <CardDescription>Lista das últimas 50 notas fiscais geradas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Documento</TableHead>
                                        <TableHead>Escola/Tenant</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort('issueDate')}>
                                                Data de Emissão
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedDocs.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium font-code">{doc.id}</TableCell>
                                            <TableCell>{doc.tenant}</TableCell>
                                            <TableCell className="font-code"><Censored value={doc.value} censorChar="*" /></TableCell>
                                            <TableCell>{doc.issueDate}</TableCell>
                                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem><FileDown className="mr-2 h-4 w-4" />Baixar PDF</DropdownMenuItem>
                                                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Cancelar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="commissions" className="mt-4">
                    <PlatformCommissionsView />
                </TabsContent>
            </Tabs>
        </div>
    )
}


export default function FinancialAuditPage() {
    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Auditoria"
                description="Monitore a saúde, segurança e eventos do sistema."
            />
            <Tabs defaultValue="system">
                <TabsList className="mb-4">
                    <TabsTrigger value="system"><Bell className="mr-2 h-4 w-4" /> Sistema</TabsTrigger>
                    <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Segurança</TabsTrigger>
                    <TabsTrigger value="financial"><CircleDollarSign className="mr-2 h-4 w-4" /> Financeiro</TabsTrigger>
                    <TabsTrigger value="asaas"><LinkIcon className="mr-2 h-4 w-4" /> Asaas Connect</TabsTrigger>
                    <TabsTrigger value="legal"><Gavel className="mr-2 h-4 w-4" /> Jurídico & Fiscal</TabsTrigger>
                </TabsList>
                <TabsContent value="system">
                    <SystemTab />
                </TabsContent>
                <TabsContent value="security">
                    <SecurityTab />
                </TabsContent>
                <TabsContent value="financial">
                    <FinancialTab />
                </TabsContent>
                <TabsContent value="asaas">
                    <AsaasHealthTab />
                </TabsContent>
                <TabsContent value="legal">
                    <LegalTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
