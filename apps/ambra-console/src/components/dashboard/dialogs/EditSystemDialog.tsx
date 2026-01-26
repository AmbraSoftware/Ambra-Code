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
import { System } from "@/types";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditSystemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    system: System | null;
    onSuccess: () => void;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export function EditSystemDialog({
    open,
    onOpenChange,
    system,
    onSuccess,
}: EditSystemDialogProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (system) {
            reset({
                name: system.name,
                // Add new fields to reset
                slug: system.slug,
                description: system.description || "",
                status: (system.status === 'Ativo' || system.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE',
            });
        }
    }, [system, reset]);

    const onSubmit = async (data: any) => {
        if (!system) return;
        setLoading(true);
        try {
            await api.patch(`/platform/systems/${system.id}`, data);
            toast({
                title: "Sistema atualizado",
                description: `O sistema ${data.name} foi atualizado com sucesso.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao atualizar",
                description: "Ocorreu um erro ao tentar atualizar o sistema.",
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
                    <DialogTitle>Editar Sistema</DialogTitle>
                    <DialogDescription>
                        Faça alterações no sistema aqui. Clique em salvar quando terminar.
                    </DialogDescription>
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
                            <Label htmlFor="slug" className="text-right">
                                Slug
                            </Label>
                            <Input
                                id="slug"
                                className="col-span-3"
                                {...register("slug", { required: true })}
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
                                <option value="INACTIVE">Inativo</option>
                                <option value="ARCHIVED">Arquivado</option>
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
            </DialogContent>
        </Dialog>
    );
}
