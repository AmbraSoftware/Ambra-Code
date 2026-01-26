/**
 * @file components/dashboard/announcements/plan-details-dialog.tsx
 * @description Dialog para exibir detalhes de assinantes de um plano
 */
"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import { useFetch } from "@/hooks/use-api";

interface PlanSubscriber {
    schoolId: string;
    schoolName: string;
    lastPayment: Date | null;
    nextPayment: Date;
    amount: number;
    platformFee: number;
    status: 'ACTIVE' | 'OVERDUE' | 'CANCELLED';
    daysUntilNextPayment: number;
}

interface PlanMetrics {
    totalSubscribers: number;
    mrr: number;
    platformRevenue: number;
    activeSubscribers: number;
    overdueSubscribers: number;
}

interface PlanDetailsResponse {
    plan: {
        id: string;
        name: string;
        code: string;
        price: number;
    };
    subscribers: PlanSubscriber[];
    metrics: PlanMetrics;
}

interface PlanDetailsDialogProps {
    planId: string;
    planName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PlanDetailsDialog({ planId, planName, open, onOpenChange }: PlanDetailsDialogProps) {
    const { data, isLoading } = useFetch<PlanDetailsResponse>(
        open ? `/platform/plans/${planId}/subscribers` : null
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '—';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            ACTIVE: { variant: 'default' as const, className: 'bg-green-100 text-green-800', label: 'Ativo' },
            OVERDUE: { variant: 'destructive' as const, className: '', label: 'Atrasado' },
            CANCELLED: { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800', label: 'Cancelado' },
        };
        const config = variants[status as keyof typeof variants] || variants.ACTIVE;
        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{planName} - Detalhes de Assinantes</DialogTitle>
                    <DialogDescription>
                        Visualize todos os assinantes deste plano e métricas financeiras
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-24" />
                            ))}
                        </div>
                        <Skeleton className="h-96" />
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Métricas */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Assinantes</p>
                                            <p className="text-2xl font-bold">{data.metrics.totalSubscribers}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {data.metrics.activeSubscribers} ativos
                                            </p>
                                        </div>
                                        <Users className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">MRR Total</p>
                                            <p className="text-2xl font-bold">{formatCurrency(data.metrics.mrr)}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Receita mensal recorrente
                                            </p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Receita Plataforma</p>
                                            <p className="text-2xl font-bold">{formatCurrency(data.metrics.platformRevenue)}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Seu faturamento mensal
                                            </p>
                                        </div>
                                        <DollarSign className="h-8 w-8 text-yellow-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
                                            <p className="text-2xl font-bold">{data.metrics.overdueSubscribers}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Requerem atenção
                                            </p>
                                        </div>
                                        <AlertCircle className="h-8 w-8 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabela de Assinantes */}
                        <Card>
                            <CardContent className="pt-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Escola</TableHead>
                                            <TableHead>Última Cobrança</TableHead>
                                            <TableHead>Próxima Cobrança</TableHead>
                                            <TableHead>Dias Restantes</TableHead>
                                            <TableHead>Valor Pago</TableHead>
                                            <TableHead>Receita Plataforma</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.subscribers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                    Nenhum assinante encontrado para este plano
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.subscribers.map((subscriber) => (
                                                <TableRow key={subscriber.schoolId}>
                                                    <TableCell className="font-medium">{subscriber.schoolName}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDate(subscriber.lastPayment)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDate(subscriber.nextPayment)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={subscriber.daysUntilNextPayment < 0 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                                                            {subscriber.daysUntilNextPayment < 0
                                                                ? `${Math.abs(subscriber.daysUntilNextPayment)} dias atrasado`
                                                                : `${subscriber.daysUntilNextPayment} dias`
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="font-code">{formatCurrency(subscriber.amount)}</TableCell>
                                                    <TableCell className="font-code font-semibold text-green-600">
                                                        {formatCurrency(subscriber.platformFee)}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Erro ao carregar dados
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
