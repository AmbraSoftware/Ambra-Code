'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  target: 'SCHOOL_SAAS' | 'GUARDIAN_PREMIUM';
  maxStudents: number;
  maxCanteens: number;
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePlanDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      target: 'SCHOOL_SAAS',
      maxStudents: 100,
      maxCanteens: 1,
      price: 0,
    },
  });

  const target = watch('target');

  const onSubmit = async (data: PlanFormData) => {
    setLoading(true);
    try {
      await api.post('/platform/plans', {
        ...data,
        price: Number(data.price),
        maxStudents: Number(data.maxStudents),
        maxCanteens: Number(data.maxCanteens),
      });

      toast({
        title: 'Plano criado com sucesso!',
        description: `O plano ${data.name} já está disponível.`,
      });

      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao criar plano',
        description: error.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Plano de Assinatura</DialogTitle>
          <DialogDescription>
            Crie um novo plano comercial para Escolas (SaaS) ou Pais (Premium).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Plano</Label>
            <Input placeholder="Ex: Enterprise Gold" {...register('name', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Público (Target)</Label>
            <Select
              onValueChange={(val: any) => setValue('target', val)}
              defaultValue="SCHOOL_SAAS"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o público" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHOOL_SAAS">Escolas (SaaS B2B)</SelectItem>
                <SelectItem value="GUARDIAN_PREMIUM">Pais e Alunos (B2C)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { required: true, min: 0 })}
              />
            </div>
            
            {target === 'SCHOOL_SAAS' && (
              <>
                <div className="space-y-2">
                  <Label>Max. Alunos</Label>
                  <Input
                    type="number"
                    {...register('maxStudents', { required: true, min: 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max. Cantinas</Label>
                  <Input
                    type="number"
                    {...register('maxCanteens', { required: true, min: 1 })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição / Diferenciais</Label>
            <Textarea
              placeholder="Descreva os benefícios deste plano..."
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
