"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { PlusCircle, Loader2 } from "lucide-react";
import { useSchools } from "@/hooks/use-api";
import { UserRole, CreateUserDto } from "@/types";

// Schema com suporte a multi-role
const formSchema = z.object({
    name: z.string().min(2, { message: "Nome é obrigatório" }),
    email: z.string().email({ message: "Email inválido" }).optional(),
    document: z.string().optional(),
    password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
    roles: z.array(z.nativeEnum(UserRole)).min(1, { message: "Selecione pelo menos uma função" }),
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
            roles: defaultRole ? [defaultRole as UserRole] : [UserRole.STUDENT],
            schoolId: "",
            nfcId: ""
        },
    });

    // Watch selected roles for UI
    const selectedRoles = form.watch("roles") || [];

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Usa CreateUserDto do shared para type safety
            const payload: CreateUserDto = {
                name: values.name,
                email: values.email && values.email.trim() ? values.email.trim() : undefined,
                password: values.password,
                roles: values.roles, // Array de roles
                role: values.roles[0], // Mantém role para compatibilidade (primeira role)
                taxId: values.document && values.document.trim() ? values.document.trim() : undefined,
                // Campos opcionais
                canteenId: undefined, // Será definido depois se necessário
            };

            // Adiciona campos opcionais se fornecidos
            if (values.schoolId && values.schoolId !== "") {
                (payload as any).schoolId = values.schoolId;
            }
            if (values.nfcId && values.nfcId.trim()) {
                (payload as any).nfcId = values.nfcId.trim();
            }

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
            // Extrai mensagem amigável do backend
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error ||
                                (error.response?.status === 409 ? "Este email já está cadastrado no sistema." :
                                 error.response?.status === 400 ? "Dados inválidos. Verifique os campos preenchidos." :
                                 error.response?.status === 401 ? "Você não tem permissão para realizar esta ação." :
                                 error.response?.status === 500 ? "Erro interno do servidor. Tente novamente mais tarde." :
                                 "Ocorreu um erro inesperado. Tente novamente.");
            
            toast({
                variant: "destructive",
                title: "Erro ao criar usuário",
                description: errorMessage,
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

                        <FormField
                            control={form.control}
                            name="roles"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Funções (Roles)</FormLabel>
                                        <FormDescription>
                                            Selecione uma ou mais funções para o usuário. Pelo menos uma é obrigatória.
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
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={role.value}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
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
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Operator Roles */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operação</p>
                                            {[
                                                { value: UserRole.OPERATOR_SALES, label: "Operador de Vendas" },
                                                { value: 'OPERATOR_MEAL' as any, label: "Operador de Merenda" },
                                                // CANTEEN_OPERATOR removido - usar OPERATOR_SALES ou OPERATOR_MEAL
                                            ].map((role) => (
                                                <FormField
                                                    key={role.value}
                                                    control={form.control}
                                                    name="roles"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={role.value}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
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
                                                        );
                                                    }}
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
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={role.value}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
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
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Legacy Roles removidos - usar MERCHANT_ADMIN e SUPER_ADMIN */}
                                    </div>
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
