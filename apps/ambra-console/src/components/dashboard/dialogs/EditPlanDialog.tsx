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
import { Plan } from "@/types";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditPlanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: { id: string, name: string } | null; // Receiving minimal info initially
    onSuccess: () => void;
}

interface FormData {
    name: string;
    price: number;
    status: 'ACTIVE' | 'RETIRED'; // Matching Prisma Enum
    description: string;
}

export function EditPlanDialog({
    open,
    onOpenChange,
    plan,
    onSuccess,
}: EditPlanDialogProps) {
    const { register, handleSubmit, reset, setValue } = useForm<FormData>();
    const [loading, setLoading] = useState(false);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const { toast } = useToast();

    // Fetch full plan details when opening
    useEffect(() => {
        if (plan && open) {
            setFetchingDetails(true);
            api.get<Plan>(`/platform/plans/${plan.id}`)
                .then(response => {
                    const fullPlan = response.data;
                    reset({
                        name: fullPlan.name,
                        price: Number(fullPlan.price),
                        status: fullPlan.status === 'ACTIVE' ? 'ACTIVE' : 'RETIRED',
                        description: fullPlan.description || ""
                    });
                })
                .catch(err => {
                    console.error("Error fetching plan details", err);
                    toast({
                        title: "Erro",
                        description: "Não foi possível carregar os detalhes do plano.",
                        variant: "destructive"
                    });
                })
                .finally(() => setFetchingDetails(false));
        }
    }, [plan, open, reset, toast]);

    const onSubmit = async (data: FormData) => {
        if (!plan) return;
        setLoading(true);
        try {
            await api.patch(`/platform/plans/${plan.id}`, data);
            toast({
                title: "Plano atualizado",
                description: `O plano ${data.name} foi atualizado com sucesso.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao atualizar",
                description: "Ocorreu um erro ao tentar atualizar o plano.",
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
                    <DialogTitle>Editar Plano</DialogTitle>
                    <DialogDescription>
                        Altere as configurações do plano de assinatura.
                    </DialogDescription>
                </DialogHeader>
                {fetchingDetails ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
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
                                <Label htmlFor="price" className="text-right">
                                    Preço (R$)
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    className="col-span-3"
                                    {...register("price", { required: true })}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Descrição
                                </Label>
                                <Input
                                    id="description"
                                    className="col-span-3"
                                    {...register("description")}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">
                                    Status
                                </Label>
                                <select
                                    id="status"
                                    className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("status")}
                                >
                                    <option value="ACTIVE">Ativo</option>
                                    <option value="RETIRED">Arquivado (Retired)</option>
                                </select>
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
                )}
            </DialogContent>
        </Dialog>
    );
}
