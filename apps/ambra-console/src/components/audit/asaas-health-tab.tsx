"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Link as LinkIcon, AlertCircle, CheckCircle } from "lucide-react";
import { useFetch } from "@/hooks/use-api";
import { School, Operator } from "@/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";

// Extended types to include Asaas fields if not in core types yet
type SchoolWithAsaas = School & { asaasCustomerId?: string; subscriptionId?: string };
type OperatorWithAsaas = Operator & { asaasId?: string; asaasWalletId?: string };

export function AsaasHealthTab() {
    const { data: schools, isLoading: isLoadingSchools } = useFetch<SchoolWithAsaas[]>('/tenancy/schools');
    const { data: operators, isLoading: isLoadingOperators } = useFetch<OperatorWithAsaas[]>('/users?role=MERCHANT_ADMIN,OPERATOR_SALES,OPERATOR_MEAL'); // Adjust endpoint as needed

    const [searchTerm, setSearchTerm] = useState("");

    const entities = [
        ...(schools || []).map(s => ({ ...s, type: 'Escola', asaasId: s.asaasCustomerId, wallet: 'N/A' })),
        ...(operators || []).map(o => ({ ...o, type: 'Operador', asaasId: o.asaasId, wallet: o.asaasWalletId }))
    ].filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.asaasId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatus = (entity: any) => {
        if (!entity.asaasId) return "Pendente";
        if (entity.type === 'Operador' && !entity.wallet) return "Parcial"; // Has user ID but no wallet
        return "Conectado";
    };

    const getBadge = (status: string) => {
        switch (status) {
            case "Conectado":
                return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" /> Conectado</Badge>;
            case "Pendente":
                return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Pendente</Badge>;
            case "Parcial":
                return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><AlertCircle className="mr-1 h-3 w-3" /> Incompleto</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Saúde da Conexão Asaas</CardTitle>
                        <CardDescription>Monitore a integração financeira de todas as escolas e operadores.</CardDescription>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-auto"
                        />
                        <Button variant="outline" size="icon">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Entidade</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Asaas ID (Customer)</TableHead>
                            <TableHead>Wallet ID (Subconta)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingSchools || isLoadingOperators ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Carregando conexões...</TableCell>
                            </TableRow>
                        ) : entities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhuma entidade encontrada.</TableCell>
                            </TableRow>
                        ) : (
                            entities.map((entity, idx) => (
                                <TableRow key={`${entity.id}-${idx}`}>
                                    <TableCell className="font-medium">{entity.name}</TableCell>
                                    <TableCell><Badge variant="outline">{entity.type}</Badge></TableCell>
                                    <TableCell className="font-code text-xs">{entity.asaasId || '—'}</TableCell>
                                    <TableCell className="font-code text-xs">{entity.wallet || '—'}</TableCell>
                                    <TableCell>{getBadge(getStatus(entity))}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" disabled={!!entity.asaasId}>
                                            <LinkIcon className="mr-2 h-3 w-3" />
                                            {entity.asaasId ? 'Sincronizado' : 'Conectar'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
