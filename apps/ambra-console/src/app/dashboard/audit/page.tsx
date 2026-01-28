'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Database, Lock, Eye, AlertCircle, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // TODO: Conectar ao endpoint /platform/audit-logs ou similar
      // const { data } = await api.get('/platform/audit-logs');
      // setLogs(data);
      
      // Mock data por enquanto
      setLogs([
        {
          id: '1',
          userId: 'user-1',
          userName: 'Admin System',
          userRole: 'SUPER_ADMIN',
          action: 'CREATE',
          entity: 'School',
          entityId: 'school-123',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date().toISOString(),
          metadata: { schoolName: 'Escola Piloto' }
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'João Silva',
          userRole: 'SCHOOL_ADMIN',
          action: 'UPDATE',
          entity: 'User',
          entityId: 'user-456',
          ipAddress: '192.168.1.101',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metadata: { field: 'roles', oldValue: 'STUDENT', newValue: 'GUARDIAN' }
        },
        {
          id: '3',
          userId: 'user-1',
          userName: 'Admin System',
          userRole: 'SUPER_ADMIN',
          action: 'DELETE',
          entity: 'Plan',
          entityId: 'plan-789',
          ipAddress: '192.168.1.100',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          metadata: { planName: 'Plano Básico' }
        }
      ]);
    } catch (error) {
      console.error('Failed to load audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge className="bg-green-100 text-green-800">Criação</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800">Atualização</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Exclusão</Badge>;
      case 'LOGIN':
        return <Badge variant="outline">Login</Badge>;
      case 'LOGOUT':
        return <Badge variant="secondary">Logout</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'SUPER_ADMIN') return <Shield className="h-4 w-4 text-destructive" />;
    if (role.includes('ADMIN')) return <Lock className="h-4 w-4 text-primary" />;
    return <User className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria Técnica & Segurança"
        description="Rastreie ações críticas, acessos e modificações de dados para compliance e segurança."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Críticas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.action === 'DELETE').length}
            </div>
            <p className="text-xs text-muted-foreground">Exclusões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acessos Admin</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.userRole.includes('ADMIN')).length}
            </div>
            <p className="text-xs text-muted-foreground">Por admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Únicos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map(l => l.ipAddress)).size}
            </div>
            <p className="text-xs text-muted-foreground">Endereços</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Auditoria</CardTitle>
          <CardDescription>
            Histórico completo de ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Carregando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Nenhum log de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex flex-col">
                        <span>{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="text-muted-foreground">{format(new Date(log.createdAt), "HH:mm:ss", { locale: ptBR })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(log.userRole)}
                        <div className="flex flex-col">
                          <span className="font-medium">{log.userName}</span>
                          <span className="text-xs text-muted-foreground">{log.userRole}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.entity}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.entityId.slice(0, 12)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ipAddress || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
