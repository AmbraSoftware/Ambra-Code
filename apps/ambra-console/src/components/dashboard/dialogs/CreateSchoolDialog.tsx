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
});

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
            await api.post('/tenancy/schools', values);

            toast({
                title: "Escola criada com sucesso!",
                description: `A escola ${values.name} foi adicionada ao ecossistema.`,
            });

            setOpen(false);
            form.reset();
            mutate('/tenancy/schools');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro ao criar escola",
                description: error.response?.data?.message || "Ocorreu um erro inesperado.",
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
