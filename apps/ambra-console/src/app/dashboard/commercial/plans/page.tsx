'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, X, Shield, School, Users, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { CreatePlanDialog } from '@/components/dashboard/dialogs/CreatePlanDialog';
import { EditPlanDialog } from '@/components/dashboard/dialogs/EditPlanDialog';
import { useRouter } from 'next/navigation';

// Types
interface Plan {
  id: string;
  name: string;
  price: number;
  status: 'ACTIVE' | 'RETIRED';
  target: 'SCHOOL_SAAS' | 'GUARDIAN_PREMIUM';
  maxStudents: number;
  config?: Record<string, any>; // Novo campo para configurações
  fees?: Record<string, any>; // Novo campo para taxas específicas
  _count?: {
    schools: number;
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const router = useRouter();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/platform/plans');
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/commercial')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Hub
        </Button>
      </div>

      <PageHeader
        title="Gestão de Planos e Assinaturas"
        description="Configure os planos comerciais disponíveis para Escolas (SaaS) e Famílias (Premium)."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Planos</CardTitle>
          <CardDescription>
            Gerencie preços, limites e disponibilidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Público Alvo</TableHead>
                <TableHead>Preço (Mensal)</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Carregando catálogo...
                  </TableCell>
                </TableRow>
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Nenhum plano cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{plan.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {plan.id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.target === 'SCHOOL_SAAS' ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <School className="w-3 h-3 mr-1" /> Escolas (B2B)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Shield className="w-3 h-3 mr-1" /> Família (B2C)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {Number(plan.price) === 0 ? (
                        <Badge variant="secondary">Grátis</Badge>
                      ) : (
                        `R$ ${Number(plan.price).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                       {plan.target === 'SCHOOL_SAAS' 
                         ? `${plan.maxStudents} alunos`
                         : 'Ilimitado'}
                    </TableCell>
                    <TableCell>
                      {plan.status === 'ACTIVE' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Arquivado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreatePlanDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={fetchPlans}
      />
      
      {editingPlan && (
        <EditPlanDialog
            open={!!editingPlan}
            onOpenChange={(open) => !open && setEditingPlan(null)}
            plan={editingPlan}
            onSuccess={fetchPlans}
        />
      )}
    </div>
  );
}
