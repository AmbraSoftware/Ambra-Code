"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Operator, Client } from "@/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSchools, useCanteens } from "@/hooks/use-api";

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: Operator | Client | null;
    onSuccess: () => void;
    roleType: 'Operator' | 'Client';
}

interface FormData {
    name: string;
    email?: string;
    cpfCnpj?: string;
    // New fields
    birthDate?: string;
    nfcId?: string;
    role?: string;
    schoolId?: string;
    canteenId?: string;
}

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    onSuccess,
    roleType
}: EditUserDialogProps) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Fetch lists for relations
    const { schools } = useSchools();
    // const { canteens } = useCanteens(); // Optional, might depend on selected school

    useEffect(() => {
        if (user) {
            const u = user as any;
            reset({
                name: u.name,
                email: u.email || "",
                cpfCnpj: u.cpfCnpj || u.taxId || u.document || "",
                birthDate: u.birthDate ? new Date(u.birthDate).toISOString().split('T')[0] : "",
                nfcId: u.nfcId || "",
                role: u.role || "",
                schoolId: u.schoolId || "",
                canteenId: u.canteenId || "",
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: FormData) => {
        if (!user) return;
        setLoading(true);
        try {
            await api.patch(`/users/${user.id}`, data);
            toast({
                title: "Usuário atualizado",
                description: `O usuário ${data.name} foi atualizado com sucesso.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao atualizar",
                description: "Ocorreu um erro ao tentar atualizar o usuário.",
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
                    <DialogTitle>Editar {roleType === 'Operator' ? 'Operador' : 'Cliente'}</DialogTitle>
                    <DialogDescription>
                        Faça alterações nos dados do usuário aqui.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" {...register("name", { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" {...register("email")} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cpfCnpj">CPF / Documento</Label>
                                <Input id="cpfCnpj" {...register("cpfCnpj")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Data de Nascimento</Label>
                                <Input id="birthDate" type="date" {...register("birthDate")} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nfcId">Tag NFC (Pulseira/Cartão)</Label>
                                <Input id="nfcId" {...register("nfcId")} placeholder="Ex: A4-F2-90-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Função (Role)</Label>
                                <select
                                    id="role"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("role")}
                                >
                                    <option value="STUDENT">Estudante (Client)</option>
                                    <option value="GUARDIAN">Responsável (Client)</option>
                                    <option value="CANTEEN_OPERATOR">Operador de Cantina</option>
                                    <option value="OPERATOR_ADMIN">Admin da Operadora</option>
                                    <option value="SCHOOL_ADMIN">Admin da Escola</option>
                                    <option value="GOV_ADMIN">Gestor Público (Gov)</option>
                                    <option value="SYSTEM_ADMIN">Admin do Sistema (Vertical)</option>
                                    <option value="GLOBAL_ADMIN">Super Admin (Nodum)</option>
                                    <option value="RETIRED">Inativo/Aposentado</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="schoolId">Escola Vinculada</Label>
                                <select
                                    id="schoolId"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("schoolId")}
                                >
                                    <option value="">Nenhuma</option>
                                    {schools?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="canteenId">Cantina (Opcional)</Label>
                                <Input id="canteenId" {...register("canteenId")} placeholder="ID da Cantina" />
                            </div>
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
        </Dialog >
    );
}
