"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { School, MapPin, Users, Calendar, CreditCard } from "lucide-react";

interface SchoolDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    school: {
        id: string;
        name: string;
        cnpj: string;
        slug: string;
        status: string;
        planName?: string;
        systemName?: string;
        createdAt?: string;
        municipalityName?: string;
        userCount?: number;
    } | null;
}

export function SchoolDetailsDialog({
    open,
    onOpenChange,
    school,
}: SchoolDetailsDialogProps) {
    if (!school) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <School className="h-5 w-5" />
                        Detalhes da Escola
                    </DialogTitle>
                    <DialogDescription>
                        Informações completas sobre a unidade escolar.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                        <div>
                            <h3 className="font-semibold text-lg">{school.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">{school.slug}</p>
                        </div>
                        <Badge variant={school.status === 'ACTIVE' || school.status === 'Ativo' ? 'default' : 'secondary'}>
                            {school.status}
                        </Badge>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            CNPJ / Tax ID
                        </h4>
                        <p className="font-mono text-sm">{school.cnpj || 'Não informado'}</p>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Município / Governo
                        </h4>
                        <p className="text-sm">{school.municipalityName || 'Não vinculado'}</p>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Data de Criação
                        </h4>
                        <p className="text-sm">
                            {school.createdAt
                                ? new Intl.DateTimeFormat('pt-BR').format(new Date(school.createdAt))
                                : '—'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Usuários Ativos
                        </h4>
                        <p className="text-sm">{school.userCount || 0}</p>
                    </div>

                    <div className="col-span-2 border-t pt-4 mt-2">
                        <h4 className="font-medium mb-2">Configurações do Sistema</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-muted-foreground">Plano Atual</span>
                                <p className="text-sm font-medium">{school.planName || 'Standard'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Sistema (Vertical)</span>
                                <p className="text-sm font-medium">{school.systemName || 'Nodum Kernel'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
