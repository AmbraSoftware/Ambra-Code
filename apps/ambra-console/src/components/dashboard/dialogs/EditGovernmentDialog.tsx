"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Municipality } from "@/types"; // Check if this type matches
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditGovernmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    government: Municipality | null;
    onSuccess: () => void;
}

interface FormData {
    name: string;
    slug: string;
    taxId: string;
}

export function EditGovernmentDialog({
    open,
    onOpenChange,
    government,
    onSuccess,
}: EditGovernmentDialogProps) {
    const { register, handleSubmit, reset } = useForm<FormData>();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (government) {
            reset({
                name: government.name,
                slug: government.slug,
                taxId: government.taxId,
            });
        }
    }, [government, reset]);

    const onSubmit = async (data: FormData) => {
        if (!government) return;
        setLoading(true);
        try {
            await api.patch(`/tenancy/governments/${government.id}`, data);
            toast({
                title: "Município atualizado",
                description: `As informações de ${data.name} foram salvas.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.response?.data?.message || "Erro desconhecido.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Município</DialogTitle>
                    <DialogDescription>
                        Atualize os dados do órgão governamental.
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
                            <Label htmlFor="taxId" className="text-right">
                                CNPJ
                            </Label>
                            <Input
                                id="taxId"
                                className="col-span-3"
                                {...register("taxId")}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
