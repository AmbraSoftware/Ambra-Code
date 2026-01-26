
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

import { useFetch } from "@/hooks/use-api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper to map Audit Log to Incident UI
const mapLogToIncident = (log: any) => {
    let type = 'info';
    let status = 'Monitorando';

    if (log.action.includes('ERROR') || log.action.includes('FAILED')) {
        type = 'warning';
        status = 'Alerta';
    } else if (log.action.includes('SUCCESS') || log.action.includes('CREATED')) {
        type = 'success';
        status = 'Resolvido';
    }

    return {
        id: log.id,
        status,
        title: log.action,
        description: log.details || 'Sem detalhes disponíveis.',
        timestamp: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR }),
        type
    };
};

export function IncidentLog() {
    const { data: logs = [], isLoading } = useFetch<any[]>('/audit/global-recent');
    const incidents = logs.map(mapLogToIncident);


    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case 'info':
                return <Info className="h-5 w-5 text-blue-500" />
            default:
                return null;
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Log de Incidentes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[244px] pr-4">
                    <div className="space-y-6 relative">
                        {/* Linha do tempo vertical */}
                        <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-border -z-10" />

                        {incidents.map(incident => (
                            <div key={incident.id} className="flex items-start gap-4">
                                <div className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-full bg-background mt-0.5",
                                    incident.type === 'success' && 'text-green-500',
                                    incident.type === 'warning' && 'text-yellow-500',
                                    incident.type === 'info' && 'text-blue-500'
                                )}>
                                    {getIcon(incident.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-foreground flex items-center">
                                        <span>{incident.title}</span>
                                        {incident.status !== 'Operational' && (
                                            <Badge variant="outline" className={cn(
                                                "ml-2 text-xs",
                                                incident.type === 'warning' && "border-yellow-500/50 text-yellow-600",
                                                incident.type === 'info' && "border-blue-500/50 text-blue-600",
                                            )}>
                                                {incident.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{incident.description}</p>
                                    <p className="text-xs text-muted-foreground/80 mt-1">{incident.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
