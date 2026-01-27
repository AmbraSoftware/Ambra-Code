"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Operator } from "@/types";

interface EditOperatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operator: Operator | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  taxId: string;
}

export function EditOperatorDialog({
  open,
  onOpenChange,
  operator,
  onSuccess,
}: EditOperatorDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (operator) {
      reset({
        name: operator.name || "",
        taxId: operator.taxId || "",
      });
    }
  }, [operator, reset]);

  const onSubmit = async (data: FormData) => {
    if (!operator) return;
    setLoading(true);
    try {
      await api.patch(`/operators/${operator.id}`, data);
      toast({
        title: "Operador atualizado",
        description: `O operador ${data.name} foi atualizado com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar operador",
        description: error.response?.data?.message || "Ocorreu um erro ao tentar atualizar o operador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Operador</DialogTitle>
          <DialogDescription>Atualize os dados do operador.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                className="col-span-3"
                {...register("name", { required: true })}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taxId" className="text-right">
                Documento
              </Label>
              <Input
                id="taxId"
                className="col-span-3"
                {...register("taxId", { required: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

