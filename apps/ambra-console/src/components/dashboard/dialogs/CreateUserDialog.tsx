"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { PlusCircle, Loader2 } from "lucide-react";
import { useSchools } from "@/hooks/use-api";

// Schema handles all potential user fields
const formSchema = z.object({
    name: z.string().min(2, { message: "Nome é obrigatório" }),
    email: z.string().email({ message: "Email inválido" }),
    document: z.string().optional(),
    password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
    role: z.string().min(1, { message: "Selecione uma função" }),
    schoolId: z.string().uuid().optional().or(z.literal('')),
    nfcId: z.string().optional(),
});

interface CreateUserDialogProps {
    onSuccess?: () => void;
    defaultRole?: string; // e.g. 'OPERATOR_ADMIN' or 'GUARDIAN'
    triggerLabel?: string;
}

export function CreateUserDialog({ onSuccess, defaultRole, triggerLabel = "Adicionar Usuário" }: CreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { schools } = useSchools();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            document: "",
            password: "",
            role: defaultRole || "STUDENT",
            schoolId: "",
            nfcId: ""
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Clean up empty strings to undefined if backend expects
            const payload = {
                ...values,
                schoolId: values.schoolId === "" ? undefined : values.schoolId,
                document: values.document === "" ? undefined : values.document,
                nfcId: values.nfcId === "" ? undefined : values.nfcId,
            };

            await api.post('/users', payload);

            toast({
                title: "Usuário criado!",
                description: `O usuário ${values.name} foi cadastrado.`,
            });

            setOpen(false);
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro ao criar usuário",
                description: error.response?.data?.message || "Ocorreu um erro inesperado.",
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                    <DialogDescription>
                        Preencha os dados de acesso e perfil.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="João da Silva" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail (Login)</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="joao@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha Inicial</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="document"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF / Documento</FormLabel>
                                        <FormControl>
                                            <Input placeholder="000.000.000-00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Função (Role)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="STUDENT">Estudante (Client)</SelectItem>
                                                <SelectItem value="GUARDIAN">Responsável (Client)</SelectItem>
                                                <SelectItem value="CANTEEN_OPERATOR">Operador de Cantina</SelectItem>
                                                <SelectItem value="OPERATOR_ADMIN">Admin da Operadora</SelectItem>
                                                <SelectItem value="SCHOOL_ADMIN">Admin da Escola</SelectItem>
                                                <SelectItem value="GOV_ADMIN">Gestor Público (Gov)</SelectItem>
                                                <SelectItem value="SYSTEM_ADMIN">Admin do Sistema (Vertical)</SelectItem>
                                                <SelectItem value="GLOBAL_ADMIN">Super Admin (Nodum)</SelectItem>
                                                <SelectItem value="RETIRED">Inativo/Aposentado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="schoolId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Escola Vinculada (Opcional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Nenhuma</SelectItem>
                                                {schools?.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="nfcId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tag NFC (ID da Pulseira/Cartão)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Opcional" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Usuário
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
