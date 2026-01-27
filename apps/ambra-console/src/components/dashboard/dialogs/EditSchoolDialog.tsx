"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { School } from "@/types";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlans, useSystems } from "@/hooks/use-api"; // Assuming usage
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface EditSchoolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    school: School | null;
    onSuccess: () => void;
}

interface FormData {
    name: string;
    taxId: string; // CNPJ (somente leitura, não enviado ao backend)
    slug: string;
    customDomain?: string; // Ainda não implementado no backend
    status: string;
    active: boolean; // Ainda não implementado no backend
    planId: string;
    // Nota: taxId, customDomain e active são exibidos mas não enviados no PATCH
}

export function EditSchoolDialog({
    open,
    onOpenChange,
    school,
    onSuccess,
}: EditSchoolDialogProps) {
    const { register, handleSubmit, reset, setValue, watch, control } = useForm<FormData>();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { plans } = usePlans();

    useEffect(() => {
        if (school) {
            reset({
                name: school.name,
                taxId: school.taxId,
                slug: school.slug,
                customDomain: school.customDomain || "",
                status: school.status,
                active: school.active,
                planId: school.planId,
            });
        }
    }, [school, reset]);

    const onSubmit = async (data: FormData) => {
        if (!school) return;
        setLoading(true);
        try {
            // Backend aceita apenas: name, slug, planId, status, config
            // Removendo campos não aceitos (taxId, customDomain, active)
            const payload = {
                name: data.name,
                slug: data.slug,
                planId: data.planId,
                status: data.status,
                // customDomain e taxId não são aceitos pelo UpdateSchoolDto
                // active também não é aceito diretamente
            };

            await api.patch(`/tenancy/schools/${school.id}`, payload);
            toast({
                title: "Escola atualizada",
                description: `A escola ${data.name} foi atualizada.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            // Extrai mensagem amigável do backend
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error ||
                                (error.response?.status === 404 ? "Escola não encontrada." :
                                 error.response?.status === 409 ? "Já existe uma escola com este slug cadastrado." :
                                 error.response?.status === 400 ? "Dados inválidos. Verifique os campos preenchidos." :
                                 error.response?.status === 401 ? "Você não tem permissão para realizar esta ação." :
                                 error.response?.status === 500 ? "Erro interno do servidor. Tente novamente mais tarde." :
                                 "Ocorreu um erro ao tentar atualizar a escola. Tente novamente.");
            
            toast({
                title: "Erro ao atualizar",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Escola</DialogTitle>
                    <DialogDescription>
                        Gerencie os dados cadastrais e o status da escola.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Escola</Label>
                                <Input id="name" {...register("name", { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">CNPJ</Label>
                                <Input id="taxId" {...register("taxId")} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input id="slug" {...register("slug", { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customDomain">Domínio Personalizado</Label>
                                <Input id="customDomain" {...register("customDomain")} placeholder="escola.com.br" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="planId">Plano de Assinatura</Label>
                                <Select
                                    onValueChange={(val) => setValue('planId', val)}
                                    defaultValue={watch('planId')}
                                    value={watch('planId')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    onValueChange={(val) => setValue('status', val)}
                                    defaultValue={watch('status')}
                                    value={watch('status')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="ACTIVE">Ativa</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspensa</SelectItem>
                                        <SelectItem value="BLOCKED">Bloqueada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="active"
                                checked={watch('active')}
                                onCheckedChange={(checked) => setValue('active', checked as boolean)}
                            />
                            <Label htmlFor="active" className="cursor-pointer">
                                Escola Ativa no Sistema
                            </Label>
                            <p className="text-xs text-muted-foreground ml-2">(Desativar impede login de todos os usuários)</p>
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
