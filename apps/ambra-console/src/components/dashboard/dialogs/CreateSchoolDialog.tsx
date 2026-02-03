"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useSystems, usePlans } from "@/hooks/use-api";
import { PlusCircle, Loader2 } from "lucide-react";
import { CreateSchoolInput } from "@/types";

const formSchema = z.object({
    systemId: z.string().uuid({ message: "Selecione um sistema válido." }),
    name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
    taxId: z.string().min(14, { message: "CNPJ inválido." }), // Simplistic check, mask would be better
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, { message: "Slug inválido (apenas letras minúsculas, números e hifens)." }),
    planId: z.string().uuid({ message: "Selecione um plano válido." }),
    adminName: z.string().min(2, { message: "Nome do admin muito curto." }),
    adminEmail: z.string().email({ message: "Email inválido." }),
    adminPassword: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
    // Configuração Híbrida: Escola pode ter Merenda e/ou Cantina
    hasMerenda: z.boolean(),
    hasCanteen: z.boolean(),
}).refine(
    (data) => data.hasMerenda || data.hasCanteen,
    {
        message: "Selecione pelo menos uma opção: Merenda ou Cantina",
        path: ["hasMerenda"], // Mostra erro no primeiro campo
    }
);

interface CreateSchoolDialogProps {
    onSuccess?: () => void;
}

export function CreateSchoolDialog({ onSuccess }: CreateSchoolDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { systems } = useSystems();
    const { plans } = usePlans();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            systemId: "",
            name: "",
            taxId: "",
            slug: "",
            planId: "",
            adminName: "",
            adminEmail: "",
            adminPassword: "",
            hasMerenda: false,
            hasCanteen: false,
        },
    });

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        form.setValue("name", name);
        if (!form.getValues("slug") || form.getValues("slug") === slugify(form.formState.defaultValues?.name || "")) {
            form.setValue("slug", slugify(name));
        }
    };

    const slugify = (text: string) => {
        return text.toString().toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-');  // Replace multiple - with single -
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Cria a escola com configuração híbrida
            const schoolPayload = {
                systemId: values.systemId,
                name: values.name,
                taxId: values.taxId,
                slug: values.slug,
                planId: values.planId,
                adminName: values.adminName,
                adminEmail: values.adminEmail,
                adminPassword: values.adminPassword,
                hasMerenda: values.hasMerenda,
                hasCanteen: values.hasCanteen,
            };

            const schoolResponse = await api.post('/tenancy/schools', schoolPayload);
            const schoolId = schoolResponse.data.schoolId;
            const createdCanteens = schoolResponse.data.canteens || [];

            // Monta mensagem de sucesso com informações das cantinas criadas
            let description = `A escola ${values.name} foi adicionada ao ecossistema.`;
            if (createdCanteens.length > 0) {
                const canteenNames = createdCanteens.map((c: any) => c.name).join(', ');
                description += ` ${createdCanteens.length} cantina(s) criada(s) automaticamente: ${canteenNames}.`;
            }

            toast({
                title: "Escola criada com sucesso!",
                description: description,
            });

            setOpen(false);
            form.reset();
            mutate('/tenancy/schools');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            // Extrai mensagem amigável do backend
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error ||
                                (error.response?.status === 409 ? "Já existe uma escola com este CNPJ ou slug cadastrado." :
                                 error.response?.status === 400 ? "Dados inválidos. Verifique os campos preenchidos." :
                                 error.response?.status === 401 ? "Você não tem permissão para realizar esta ação." :
                                 error.response?.status === 500 ? "Erro interno do servidor. Tente novamente mais tarde." :
                                 "Ocorreu um erro inesperado. Tente novamente.");
            
            toast({
                variant: "destructive",
                title: "Erro ao criar escola",
                description: errorMessage,
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Escola
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Inaugurar Nova Escola</DialogTitle>
                    <DialogDescription>
                        Preencha os dados abaixo para criar um novo tenant e seu administrador inicial.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="systemId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sistema (Vertical)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {systems.map((system) => (
                                                    <SelectItem key={system.id} value={system.id}>
                                                        {system.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="planId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plano de Assinatura</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {plans.map((plan) => (
                                                    <SelectItem key={plan.id} value={plan.id}>
                                                        {plan.name} - R$ {Number(plan.price).toFixed(2)}
                                                    </SelectItem>
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Instituição</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Colégio Vitta Unidade 1" {...field} onChange={handleNameChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug (URL)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="vitta-un1" {...field} />
                                        </FormControl>
                                        <FormDescription>nodum.app/<b>{field.value || 'slug'}</b></FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="taxId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CNPJ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="00.000.000/0000-00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Configuração Híbrida */}
                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Configuração Híbrida</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Escolas podem operar em modo híbrido, oferecendo tanto merenda governamental quanto vendas comerciais.
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="hasMerenda"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                                            <div className="space-y-1 flex-1 pr-4">
                                                <FormLabel className="text-base font-semibold">Merenda IQ</FormLabel>
                                                <FormDescription className="text-xs">
                                                    Habilita controle de estoque público e gestão de cardápios governamentais. 
                                                    Permite registrar consumo de merenda gratuita sem transações financeiras.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="hasCanteen"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                                            <div className="space-y-1 flex-1 pr-4">
                                                <FormLabel className="text-base font-semibold">Cantina Privada</FormLabel>
                                                <FormDescription className="text-xs">
                                                    Habilita financeiro e vendas comerciais. Permite cadastro de produtos, 
                                                    operadores de vendas e transações com pagamento via carteira digital.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {form.formState.errors.hasMerenda && (
                                <p className="text-sm text-destructive mt-2">
                                    {form.formState.errors.hasMerenda.message}
                                </p>
                            )}
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Administrador Inicial</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="adminName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Gestor Responsável" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="adminEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-mail de Acesso</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="admin@escola.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="adminPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Senha Provisória</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="********" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Escola
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
