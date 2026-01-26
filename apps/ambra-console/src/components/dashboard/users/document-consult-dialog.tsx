/**
 * @file src/components/dashboard/users/document-consult-dialog.tsx
 * @fileoverview Dialog component for CPF/CNPJ consultation via Serasa/Asaas
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertCircle, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

interface RiskAnalysisResult {
    score: number;
    category: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dataSource: 'INTERNAL_HISTORY' | 'SERASA_MOCK';
}

interface DocumentConsultDialogProps {
    document: string;
    documentType: 'CPF' | 'CNPJ';
}

export function DocumentConsultDialog({ document, documentType }: DocumentConsultDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RiskAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleConsult = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await api.post('/risk/serasa-simulation', { document });
            setResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao consultar documento');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case 'LOW':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Baixo Risco</Badge>;
            case 'MEDIUM':
                return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="mr-1 h-3 w-3" />Médio Risco</Badge>;
            case 'HIGH':
                return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="mr-1 h-3 w-3" />Alto Risco</Badge>;
            case 'CRITICAL':
                return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Risco Crítico</Badge>;
            default:
                return <Badge>{category}</Badge>;
        }
    };

    const isPaidConsult = documentType === 'CNPJ';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4" />
                    Consultar {documentType}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Consulta de {documentType}</DialogTitle>
                    <DialogDescription>
                        Análise de risco via {isPaidConsult ? 'Serasa (Pago)' : 'Asaas (Gratuito)'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="document">Documento</Label>
                        <Input
                            id="document"
                            value={document}
                            disabled
                            className="font-code"
                        />
                    </div>

                    {isPaidConsult && (
                        <Alert>
                            <DollarSign className="h-4 w-4" />
                            <AlertDescription>
                                Esta consulta tem custo. Será cobrada via Serasa.
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {result && (
                        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Score de Risco</span>
                                <span className="text-2xl font-bold font-code">{result.score}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Categoria</span>
                                {getCategoryBadge(result.category)}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Fonte</span>
                                <Badge variant="outline" className="font-code">
                                    {result.dataSource}
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Fechar
                    </Button>
                    <Button onClick={handleConsult} disabled={loading}>
                        {loading ? 'Consultando...' : 'Consultar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
