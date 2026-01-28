"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Operator, Client } from "@/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSchools } from "@/hooks/use-api";
import { UserRole } from "@/types";

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: Operator | Client | null;
    onSuccess: () => void;
    roleType: 'Operator' | 'Client';
}

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome é obrigatório" }),
    email: z.string().email({ message: "Email inválido" }).optional(),
    document: z.string().optional(),
    password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).optional(),
    roles: z.array(z.nativeEnum(UserRole)).min(1, { message: "Selecione pelo menos uma função" }),
    schoolId: z.string().uuid().optional().or(z.literal('')),
    nfcId: z.string().optional(),
});

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    onSuccess,
    roleType
}: EditUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { schools } = useSchools();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            document: "",
            password: "",
            roles: [],
            schoolId: "",
            nfcId: "",
        },
    });

    useEffect(() => {
        if (user) {
            const u = user as any;
            // Carrega roles existentes (array ou single role)
            const existingRoles = u.roles || (u.role ? [u.role] : [UserRole.STUDENT]);
            
            form.reset({
                name: u.name || "",
                email: u.email || "",
                document: u.cpfCnpj || u.taxId || u.document || "",
                password: "", // Não preenche senha por segurança
                roles: existingRoles.filter((r: string) => Object.values(UserRole).includes(r as UserRole)) as UserRole[],
                schoolId: u.schoolId || "",
                nfcId: u.nfcId || "",
            });
        }
    }, [user, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        setLoading(true);
        try {
            // Payload para atualização de usuário
            const payload: any = {
                name: values.name,
                roles: values.roles, // Array de roles atualizado
            };

            // Adiciona campos opcionais se fornecidos
            if (values.email && values.email.trim()) {
                payload.email = values.email.trim();
            }
            if (values.password && values.password.length >= 6) {
                payload.password = values.password;
            }
            if (values.document && values.document.trim()) {
                payload.taxId = values.document.trim();
            }
            if (values.schoolId && values.schoolId !== "") {
                (payload as any).schoolId = values.schoolId;
            }
            if (values.nfcId && values.nfcId.trim()) {
                (payload as any).nfcId = values.nfcId.trim();
            }

            await api.patch(`/users/${user.id}`, payload);
            toast({
                title: "Usuário atualizado",
                description: `O usuário ${values.name} foi atualizado com sucesso.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            // Extrai mensagem amigável do backend
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error ||
                                (error.response?.status === 404 ? "Usuário não encontrado." :
                                 error.response?.status === 409 ? "Este email já está cadastrado para outro usuário." :
                                 error.response?.status === 400 ? "Dados inválidos. Verifique os campos preenchidos." :
                                 error.response?.status === 401 ? "Você não tem permissão para realizar esta ação." :
                                 error.response?.status === 500 ? "Erro interno do servidor. Tente novamente mais tarde." :
                                 "Ocorreu um erro ao tentar atualizar o usuário. Tente novamente.");
            
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
                    <DialogTitle>Editar {roleType === 'Operator' ? 'Operador' : 'Cliente'}</DialogTitle>
                    <DialogDescription>
                        Faça alterações nos dados do usuário aqui.
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
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="document"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF / Documento</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nova Senha (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Deixe em branco para manter" {...field} />
                                        </FormControl>
                                        <FormDescription>Deixe em branco para manter a senha atual</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="roles"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Funções (Roles)</FormLabel>
                                        <FormDescription>
                                            Selecione uma ou mais funções. Pelo menos uma é obrigatória.
                                        </FormDescription>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Admin Roles */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Administração</p>
                                            {[
                                                { value: UserRole.SUPER_ADMIN, label: "Super Admin" },
                                                { value: UserRole.SCHOOL_ADMIN, label: "Admin da Escola" },
                                                { value: UserRole.MERCHANT_ADMIN, label: "Admin da Cantina" },
                                            ].map((role) => (
                                                <FormField
                                                    key={role.value}
                                                    control={form.control}
                                                    name="roles"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(role.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, role.value])
                                                                            : field.onChange(
                                                                                  field.value?.filter(
                                                                                      (value) => value !== role.value
                                                                                  )
                                                                              );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                {role.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {/* Operator Roles */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operação</p>
                                            {[
                                                { value: UserRole.OPERATOR_SALES, label: "Operador de Vendas" },
                                                // Nota: OPERATOR_MEAL foi removido na migração de roles
                                            ].map((role) => (
                                                <FormField
                                                    key={role.value}
                                                    control={form.control}
                                                    name="roles"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(role.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, role.value])
                                                                            : field.onChange(
                                                                                  field.value?.filter(
                                                                                      (value) => value !== role.value
                                                                                  )
                                                                              );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                {role.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {/* Client Roles */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clientes</p>
                                            {[
                                                { value: UserRole.STUDENT, label: "Estudante" },
                                                { value: UserRole.GUARDIAN, label: "Responsável" },
                                            ].map((role) => (
                                                <FormField
                                                    key={role.value}
                                                    control={form.control}
                                                    name="roles"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(role.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, role.value])
                                                                            : field.onChange(
                                                                                  field.value?.filter(
                                                                                      (value) => value !== role.value
                                                                                  )
                                                                              );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                {role.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {/* Legacy Roles removidos - usar MERCHANT_ADMIN e SUPER_ADMIN */}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="schoolId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Escola Vinculada</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="">Nenhuma</SelectItem>
                                                {schools?.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nfcId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tag NFC (Pulseira/Cartão)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: A4-F2-90-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                </Form>
            </DialogContent>
        </Dialog >
    );
}
