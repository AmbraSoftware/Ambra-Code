'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Pencil, Trash2, Tag, Calendar, Building2, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { usePlans } from '@/hooks/use-api';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  validUntil: string;
  maxUses?: number;
  usedCount?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  audience: 'B2B' | 'B2C'; // Novo campo
  planId?: string; // Novo campo (opcional)
  planName?: string; // Para exibição
  createdAt: string;
}

export default function DiscountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { plans } = usePlans();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 0,
    validUntil: '',
    maxUses: '',
    audience: 'B2B' as 'B2B' | 'B2C',
    planId: ''
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/global-admin/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Failed to load coupons', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os cupons.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      validUntil: '',
      maxUses: '',
      audience: 'B2B',
      planId: ''
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingCoupon(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      validUntil: format(new Date(coupon.validUntil), 'yyyy-MM-dd'),
      maxUses: coupon.maxUses?.toString() || '',
      audience: coupon.audience,
      planId: coupon.planId || ''
    });
    setEditingCoupon(coupon);
    setIsCreateOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        planId: formData.planId || undefined
      };

      if (editingCoupon) {
        // TODO: await api.put(`/platform/coupons/${editingCoupon.id}`, payload);
        toast({
          title: "Cupom atualizado",
          description: `O cupom ${formData.code} foi atualizado com sucesso.`
        });
      } else {
        // TODO: await api.post('/platform/coupons', payload);
        toast({
          title: "Cupom criado",
          description: `O cupom ${formData.code} foi criado com sucesso.`
        });
      }
      fetchCoupons();
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save coupon', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cupom.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;
    try {
      await api.delete(`/global-admin/coupons/${deletingCoupon.id}`);
      toast({
        title: "Cupom removido",
        description: `O cupom ${deletingCoupon.code} foi removido.`
      });
      fetchCoupons();
      setDeletingCoupon(null);
    } catch (error) {
      console.error('Failed to delete coupon', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível remover o cupom.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expirado</Badge>;
      case 'DISABLED':
        return <Badge variant="destructive">Desabilitado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAudienceBadge = (audience: 'B2B' | 'B2C') => {
    if (audience === 'B2B') {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Building2 className="w-3 h-3 mr-1" />
          B2B (Escolas)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <Users2 className="w-3 h-3 mr-1" />
        B2C (Pais/Alunos)
      </Badge>
    );
  };

  // Filtrar planos por audience
  const availablePlans = plans.filter(p => {
    if (formData.audience === 'B2B') {
      return p.target === 'SCHOOL_SAAS';
    } else {
      return p.target === 'GUARDIAN_PREMIUM';
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/commercial')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Hub
        </Button>
      </div>

      <PageHeader
        title="Cupons de Desconto"
        description="Gerencie cupons promocionais segmentados por público (B2B/B2C) e planos."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cupom
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Cupons Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os cupons de desconto com segmentação de público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Público</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                    Nenhum cupom cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      {getAudienceBadge(coupon.audience)}
                    </TableCell>
                    <TableCell>
                      {coupon.planName ? (
                        <span className="text-sm">{coupon.planName}</span>
                      ) : (
                        <Badge variant="secondary">Global</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.type === 'PERCENTAGE' ? 'Percentual' : 'Valor Fixo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(coupon.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {coupon.usedCount || 0} / {coupon.maxUses || '∞'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(coupon.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(coupon)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCoupon(coupon)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Atualize os dados do cupom de desconto' : 'Crie um novo cupom de desconto segmentado'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* PÚBLICO ALVO - OBRIGATÓRIO */}
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-sm font-semibold">Público Alvo (Obrigatório)</Label>
              <RadioGroup
                value={formData.audience}
                onValueChange={(value: 'B2B' | 'B2C') => setFormData({ ...formData, audience: value, planId: '' })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent"
                     onClick={() => setFormData({ ...formData, audience: 'B2B', planId: '' })}>
                  <RadioGroupItem value="B2B" id="b2b" />
                  <Label htmlFor="b2b" className="cursor-pointer flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-medium">B2B (SaaS)</p>
                      <p className="text-xs text-muted-foreground">Escolas e Gestores</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent"
                     onClick={() => setFormData({ ...formData, audience: 'B2C', planId: '' })}>
                  <RadioGroupItem value="B2C" id="b2c" />
                  <Label htmlFor="b2c" className="cursor-pointer flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium">B2C (App)</p>
                      <p className="text-xs text-muted-foreground">Pais e Alunos</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                {formData.audience === 'B2B' 
                  ? '💼 Desconto na Mensalidade do Sistema (Planos SaaS)' 
                  : '🍎 Desconto no Ambra Food Premium ou Taxas de Recarga'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código do Cupom *</Label>
                <Input
                  id="code"
                  placeholder="ESCOLA10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Desconto</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor do Desconto</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={formData.type === 'PERCENTAGE' ? '10' : '50.00'}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.type === 'PERCENTAGE' ? 'Percentual de desconto (0-100)' : 'Valor fixo em reais'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Válido Até *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            {/* RESTRIÇÃO DE PLANO (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="planId">Restringir ao Plano (Opcional)</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) => setFormData({ ...formData, planId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global (Todos os planos)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Global (Todos os planos)</SelectItem>
                  {availablePlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.planId 
                  ? 'Cupom válido apenas para o plano selecionado' 
                  : 'Cupom pode ser usado em qualquer plano'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Usos Máximos (opcional)</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                placeholder="100"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para uso ilimitado
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deletingCoupon}
        onOpenChange={(open) => !open && setDeletingCoupon(null)}
        title="Remover Cupom"
        description={`Tem certeza que deseja remover o cupom "${deletingCoupon?.code}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
