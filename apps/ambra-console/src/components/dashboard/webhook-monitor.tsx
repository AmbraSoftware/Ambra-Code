
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, XCircle, Clock, Server, UserPlus, FileSignature } from "lucide-react";
import { cn } from '@/lib/utils';

type WebhookLog = {
  id: number;
  service: string;
  event: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: Date;
};

const initialLogsData: Omit<WebhookLog, 'timestamp'>[] = [
  { id: 1, service: 'auth.users', event: 'user.created', status: 'SUCCESS' },
  { id: 2, service: 'platform.invoices', event: 'invoice.paid', status: 'SUCCESS' },
  { id: 3, service: 'schools.sync', event: 'school.plan_changed', status: 'SUCCESS' },
  { id: 4, service: 'platform.payouts', event: 'payout.processing', status: 'PENDING' },
  { id: 5, service: 'auth.operators', event: 'operator.permissions.updated', status: 'FAILED' },
];

const services = ['auth.users', 'platform.invoices', 'schools.sync', 'platform.payouts', 'operators.wallets'];
const events = ['created', 'updated', 'deleted', 'paid', 'failed', 'processing', 'plan_changed'];
const statuses: WebhookLog['status'][] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED', 'PENDING'];

export function WebhookMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const initialLogs = initialLogsData.map((log, index) => ({
      ...log,
      timestamp: new Date(Date.now() - 1000 * 5 * (initialLogsData.length - index)),
    }));
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const newLog: WebhookLog = {
        id: Date.now(),
        service: services[Math.floor(Math.random() * services.length)],
        event: events[Math.floor(Math.random() * events.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        timestamp: new Date(),
      };
      setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 49)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [logs]);
  
  const getEventIcon = (event: string) => {
    if (event.includes('created')) return <UserPlus className="h-4 w-4 text-muted-foreground" />;
    if (event.includes('plan_changed')) return <FileSignature className="h-4 w-4 text-muted-foreground" />;
    return <Server className="h-4 w-4 text-muted-foreground" />;
  }

  const getStatusBadge = (status: WebhookLog['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"><CheckCircle className="mr-1 h-3 w-3" /> Sucesso</Badge>;
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Falhou</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"><Clock className="mr-1 h-3 w-3" /> Pendente</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Eventos do Sistema</CardTitle>
        <CardDescription>Feed em tempo real de eventos importantes da plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96" ref={scrollAreaRef}>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 text-sm">
                <div className="mt-1">
                    {getEventIcon(log.event)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground font-code">
                    {log.service}<span className="text-muted-foreground">.</span>{log.event}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isClient && <span>{log.timestamp.toLocaleTimeString()}</span>}
                     <ArrowRight className="h-3 w-3" />
                     {getStatusBadge(log.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
