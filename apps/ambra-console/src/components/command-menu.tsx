"use client"

import * as React from "react"
import { Building, Calculator, CreditCard, Search, User, UserPlus, Calendar as CalendarIcon, Mail, Smile, Settings, Rocket } from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useFetch } from "@/hooks/use-api"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)

    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    // Debounced Search
    React.useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                // Expected Backend Response: { results: [ { type: 'USER'|'SCHOOL'|'TX', id, title, subtitle } ] }
                const { data } = await api.get(`/platform/search?q=${query}`);
                setResults(data.results || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (item: any) => {
        setOpen(false);
        if (item.type === 'SCHOOL') router.push(`/dashboard/entities?tab=schools&q=${item.id}`);
        if (item.type === 'USER') router.push(`/dashboard/users?q=${item.id}`);
        if (item.type === 'TX') router.push(`/dashboard/financial-audit?tab=transactions&q=${item.id}`);
        if (item.type === 'SYSTEM') router.push(`/dashboard/entities?tab=systems&q=${item.id}`); // Assuming Systems tab works with q
        if (item.type === 'PLAN') router.push(`/dashboard/entities?tab=plans&q=${item.id}`); // Assuming Plans tab exists or will exist
    }

    const users = results.filter(r => r.type === 'USER');
    const schools = results.filter(r => r.type === 'SCHOOL');
    const txs = results.filter(r => r.type === 'TX');
    const systems = results.filter(r => r.type === 'SYSTEM');
    const plans = results.filter(r => r.type === 'PLAN');

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="relative flex justify-start items-center w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground sm:pr-12 md:w-[200px] lg:w-[336px]"
            >
                <span className="hidden lg:inline-flex">Search documentation...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." onValueChange={setQuery} />
                <CommandList>
                    {loading && <div className="py-6 text-center text-sm text-muted-foreground">Searching sovereign network...</div>}

                    {!loading && results.length === 0 && query.length > 2 && (
                        <CommandEmpty>No results found.</CommandEmpty>
                    )}

                    {schools.length > 0 && (
                        <CommandGroup heading="Escolas (Tenants)">
                            {schools.map(item => (
                                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                                    <Building className="mr-2 h-4 w-4" />
                                    <span>{item.title}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{item.subtitle}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {systems.length > 0 && (
                        <CommandGroup heading="Sistemas (Verticais)">
                            {systems.map(item => (
                                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                                    <Rocket className="mr-2 h-4 w-4" />
                                    <span>{item.title}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{item.slug}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {plans.length > 0 && (
                        <CommandGroup heading="Planos (Features)">
                            {plans.map(item => (
                                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>{item.title}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{item.description || item.slug}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {users.length > 0 && (
                        <CommandGroup heading="Usuários">
                            {users.map(item => (
                                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{item.title}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{item.subtitle}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {txs.length > 0 && (
                        <CommandGroup heading="Transações">
                            {txs.map(item => (
                                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>{item.title}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{item.meta}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    <CommandSeparator />

                    {query.length === 0 && (
                        <CommandGroup heading="Suggestions">
                            <CommandItem onSelect={() => router.push('/dashboard/entities')}>
                                <Building className="mr-2 h-4 w-4" />
                                <span>Gestão de Entidades</span>
                            </CommandItem>
                            <CommandItem onSelect={() => router.push('/dashboard/financial-audit')}>
                                <Calculator className="mr-2 h-4 w-4" />
                                <span>Auditoria Fiscal</span>
                            </CommandItem>
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
