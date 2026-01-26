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
import { useSystems, usePlans } from "@/hooks/use-api";

const formSchema = z.object({
    name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
    taxId: z.string().min(14, { message: "CNPJ inválido." }),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, { message: "Slug inválido (apenas letras minúsculas e números)." }),
    systemId: z.string().uuid({ message: "Selecione um sistema válido." }),
    planId: z.string().uuid({ message: "Selecione um plano válido." }),
});

interface CreateGovernmentDialogProps {
    onSuccess?: () => void;
}

export function CreateGovernmentDialog({ onSuccess }: CreateGovernmentDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { systems } = useSystems();
    const { plans } = usePlans();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            taxId: "",
            slug: "",
            systemId: "",
            planId: "",
        },
    });

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
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await api.post('/tenancy/governments', values); // Assuming endpoint
            toast({
                title: "Município criado!",
                description: `O município ${values.name} foi adicionado.`,
            });
            setOpen(false);
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro ao criar município",
                description: error.response?.data?.message || "Ocorreu um erro inesperado.",
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Município
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Novo Município (Governo)</DialogTitle>
                    <DialogDescription>
                        Cadastre um novo órgão governamental.
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
                                                {systems.map((s) => (
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
                                                {plans.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                                    <FormLabel>Nome do Município</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Prefeitura de Santos" {...field} onChange={handleNameChange} />
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
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <Input placeholder="pref-santos" {...field} />
                                        </FormControl>
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

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Município
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
