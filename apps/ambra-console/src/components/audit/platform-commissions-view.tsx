"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetch } from "@/hooks/use-api";
import { useState } from "react";
import { FilePlus, HandCoins, Receipt } from "lucide-react";
import { Censored } from "@/contexts/censorship-context";

// Mock type based on schema
type FiscalPendingItem = {
    id: string;
    operator: { name: string; taxId: string };
    amount: number;
    transactionId: string;
    createdAt: string;
    status: 'PENDING' | 'INVOICED';
};

export function PlatformCommissionsView() {
    // In a real scenario, this would fetch from /fiscal/pending-items
    // Mocking data for visualization based on user request (R$ 5,00 per transaction)
    const { data: items, isLoading } = useFetch<FiscalPendingItem[]>('/fiscal/commissions/pending');

    const [searchTerm, setSearchTerm] = useState("");

    // Simulate some data if API returns nothing (for demo purposes)
    const displayItems: FiscalPendingItem[] = items || [
        { id: 'fpi_1', operator: { name: 'Cantina Central', taxId: '12.345.678/0001-90' }, amount: 5.00, transactionId: 'tx_123', createdAt: '2024-03-20T10:00:00Z', status: 'PENDING' },
        { id: 'fpi_2', operator: { name: 'Cantina Bloco C', taxId: '98.765.432/0001-10' }, amount: 5.00, transactionId: 'tx_124', createdAt: '2024-03-20T10:05:00Z', status: 'PENDING' },
        { id: 'fpi_3', operator: { name: 'Espaço Gourmet', taxId: '11.222.333/0001-00' }, amount: 5.00, transactionId: 'tx_125', createdAt: '2024-03-20T10:15:00Z', status: 'PENDING' },
    ];

    const filteredItems = displayItems.filter(i =>
        i.operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.id.includes(searchTerm)
    );

    const totalPending = filteredItems.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Acumulado (Batch)</CardTitle>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-code">
                            <Censored value={totalPending} censorChar="*" />
                        </div>
                        <p className="text-xs text-muted-foreground">Represado para Nota Fiscal</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio (Fee)</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-code">R$ 5,00</div>
                        <p className="text-xs text-muted-foreground">Fixo por transação (Split)</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Comissões Pendentes (Fiscal Batching)</CardTitle>
                            <CardDescription>Receita soberana represada aguardando emissão de NF de Serviço.</CardDescription>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Input
                                placeholder="Buscar operador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                            <Button>
                                <FilePlus className="mr-2 h-4 w-4" />
                                Gerar Lote NF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Item</TableHead>
                                <TableHead>Operador (Origem)</TableHead>
                                <TableHead>Data Transação</TableHead>
                                <TableHead>Valor (Fee)</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-code text-xs">{item.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{item.operator.name}</span>
                                            <span className="text-xs text-muted-foreground">{item.operator.taxId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="font-code text-green-600 font-bold">
                                        {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
