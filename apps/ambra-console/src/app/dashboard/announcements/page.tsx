/**
 * @file src/app/dashboard/announcements/page.tsx
 * @fileoverview Announcements management page for the Nodum Console.
 */
"use client"

import * as React from "react";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Send, CheckCircle, ChevronDown, Calendar as CalendarIcon, ArrowUpDown, Filter, Layers, Mail, Megaphone, Plus, Search, Target, Users, CreditCard, Archive, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRange } from "react-day-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSystems, useFetch, useSchools } from "@/hooks/use-api";
import type { Plan, Campaign } from "@/types";
import { PlanDetailsDialog } from "@/components/dashboard/announcements/plan-details-dialog";
import { EditPlanDialog } from "@/components/dashboard/dialogs/EditPlanDialog";
import { api } from "@/lib/api";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// Static roles from Schema
const roles = [
  { id: 'GLOBAL_ADMIN', label: 'Global Admin' },
  { id: 'GOV_ADMIN', label: 'Gov Admin' },
  { id: 'SCHOOL_ADMIN', label: 'School Admin' },
  { id: 'CANTEEN_OPERATOR', label: 'Operator' },
  { id: 'GUARDIAN', label: 'Guardian' },
  { id: 'STUDENT', label: 'Student' }
];

type SortDirection = 'asc' | 'desc';

// --- Componentes Auxiliares ---
function SegmentationFilter({ title, items }: { title: string, items: { id: string, label: string }[] }) {
  const [selectedCount, setSelectedCount] = React.useState(0);

  const handleCheckboxChange = (checked: boolean | string) => {
    setSelectedCount(prev => checked ? prev + 1 : prev - 1);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{title} {selectedCount > 0 && `(${selectedCount})`}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <ScrollArea className="h-48">
          <div className="p-4 space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox id={`filter-${title}-${item.id}`} onCheckedChange={handleCheckboxChange} />
                <Label htmlFor={`filter-${title}-${item.id}`} className="font-normal">{item.label}</Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function DateRangePicker({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Escolha um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// --- Abas ---

// --- Abas ---

function PlansTab() {
  const { data: plansData, isLoading, mutate } = useFetch<Plan[]>('/platform/plans');
  const plans = plansData || [];

  // Archive State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [planToArchive, setPlanToArchive] = useState<{ id: string, name: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Plan, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [selectedPlan, setSelectedPlan] = useState<{ id: string, name: string } | null>(null);
  const [editingPlan, setEditingPlan] = useState<{ id: string, name: string } | null>(null);

  const handleArchive = (plan: { id: string, name: string }) => {
    setPlanToArchive(plan);
    setConfirmOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (!planToArchive) return;
    try {
      await api.patch(`/platform/plans/${planToArchive.id}/deactivate`);
      mutate();
    } catch (error) {
      console.error("Failed to archive plan:", error);
    }
    setConfirmOpen(false);
    setPlanToArchive(null);
  };

  const handleSort = (key: keyof Plan) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedPlans = useMemo(() => {
    // [FIX] Removido filtro restritivo de status para mostrar todos os planos
    let sortableItems = [...plans];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue: any = a[sortConfig.key] ?? '';
        const bValue: any = b[sortConfig.key] ?? '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems.filter(plan =>
      (plan.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (plan.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm, sortConfig]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Planos de Subscrição</CardTitle>
              <CardDescription>Gerencie os planos, preços e funcionalidades oferecidas.</CardDescription>
            </div>
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('name')}>
                    Nome do Plano
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>White Label</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPlans.map((plan) => (
                <TableRow
                  key={plan.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedPlan({ id: plan.id, name: plan.name })}
                >
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="font-code">{plan.code}</TableCell>
                  <TableCell className="font-code">{plan.price}</TableCell>
                  <TableCell>
                    <Badge variant={plan.status === "Ativo" ? "default" : "outline"} className={plan.status === "Ativo" ? "bg-green-100 text-green-800" : ""}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.whiteLabel ? "secondary" : "outline"}>{plan.whiteLabel ? "Sim" : "Não"}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedPlan({ id: plan.id, name: plan.name }); }}>
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(plan.id); }}>
                          Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingPlan({ id: plan.id, name: plan.name }); }}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive({ id: plan.id, name: plan.name }); }}>
                          Arquivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPlan && (
        <PlanDetailsDialog
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          open={!!selectedPlan}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
        />
      )}

      {editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          open={!!editingPlan}
          onOpenChange={(open) => !open && setEditingPlan(null)}
          onSuccess={() => mutate()}
        />
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Arquivar Plano"
        description={`Tem certeza que deseja arquivar o plano ${planToArchive?.name}? Ele ficará inativo.`}
        onConfirm={handleConfirmArchive}
        variant="destructive"
      />
    </>
  );
}

function TrashTab() {
  const { data: campaignsData, isLoading, mutate } = useFetch<Campaign[]>('/announcements');
  const deletedCampaigns = (campaignsData || []).filter(c => c.status === 'INACTIVE');

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/restore`);
      mutate();
    } catch (error) {
      console.error('Erro ao restaurar:', error);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (confirm("Tem certeza? Esta ação é irreversível.")) {
      try {
        await api.delete(`/announcements/${id}`);
        mutate();
      } catch (error) {
        console.error('Erro ao deletar:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lixeira</CardTitle>
        <CardDescription>Itens desativados que podem ser restaurados ou removidos permanentemente.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Data Original</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deletedCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  Lixeira vazia
                </TableCell>
              </TableRow>
            ) : (
              deletedCampaigns.map(camp => (
                <TableRow key={camp.id}>
                  <TableCell className="font-medium text-muted-foreground line-through">{camp.title}</TableCell>
                  <TableCell>{camp.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleRestore(camp.id)}>Restaurar</Button>
                      <Button variant="destructive" size="sm" onClick={() => handlePermanentDelete(camp.id)}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function CampaignsTab() {
  const { data: campaignsData, isLoading, mutate } = useFetch<Campaign[]>('/announcements');
  const campaigns = (campaignsData || []).filter(c => c.status !== 'INACTIVE');

  // Segmentation Data
  const { systems: systemsData } = useSystems();
  const systems = (systemsData || []).map(s => ({ id: s.id, label: s.name }));

  const { data: municipalitiesData } = useFetch<any[]>('/tenancy/governments'); // Using generic for Govs
  const municipalities = (municipalitiesData || []).map(g => ({ id: g.id, label: g.name }));

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Campaign, direction: SortDirection } | null>({ key: 'date', direction: 'desc' });

  const handleDeactivate = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/deactivate`);
      mutate(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao desativar:', error);
    }
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    let sortableItems = [...campaigns];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue: any = a[sortConfig.key] ?? '';
        const bValue: any = b[sortConfig.key] ?? '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems.filter(campaign =>
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [campaigns, searchTerm, sortConfig]);


  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    scope: 'GLOBAL' as 'GLOBAL' | 'GOVERNMENT' | 'SYSTEM' | 'SCHOOL' | 'INDIVIDUAL',
    targetRole: undefined as string | undefined,
    targetIds: [] as string[]
  });
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast(); // Ensure you have this hook imported or available, otherwise use a simple alert or console
  // Note: If useToast is not imported in the file top-level, we might need to add it. 
  // Looking at the file imports, I don't see useToast imported. 
  // I will check if I can import it. If not, I will use a basic alert for now or add the import in a separate step.
  // Wait, I can't import in this block. I'll adhere to the existing code structure. 
  // Let's assume for this block we just log or use window.alert if toast isn't available, 
  // BUT the file actually imports "useToast" in other files usually. 
  // Let's check imports in the original file... 
  // The original file imports are:
  // import { ... } from "lucide-react";
  // import { ... } from "@/components/ui/button";
  // NO useToast. I will have to add it.

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      alert("Por favor, preencha o título e a descrição."); // Fallback
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/announcements', {
        ...formData,
        // If date logic is needed in backend, add it here. 
        // For now backend CreateAnnouncementDto doesn't seem to enforce dates, 
        // but let's assume 'status' or metadata might usage it.
        // Keeping it simple as per DTO.
      });

      // Reset
      setFormData({
        title: '',
        message: '',
        scope: 'GLOBAL',
        targetRole: undefined,
        targetIds: []
      });

      mutate(); // Refresh list
      alert("Campanha agendada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao criar campanha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Coluna do Formulário */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Campanha</CardTitle>
            <CardDescription>Envie anúncios e notificações para segmentos específicos de usuários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="camp-title">Título</Label>
              <Input
                id="camp-title"
                placeholder="Ex: Manutenção Programada"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-desc">Descrição</Label>
              <Textarea
                id="camp-desc"
                placeholder="Detalhe a comunicação aqui..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Agendamento</h4>
              <div className="space-y-2">
                <Label>Período de veiculação</Label>
                {/* DatePicker component needs to lift state up if we want to use it, 
                     but for now it controls its own state. 
                     We are just keeping it visual as per 'Wiring' instructions 
                     unless backend supports start/end dates. 
                     The current DTO doesn't have start/end dates.
                 */}
                <DateRangePicker />
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Segmentação</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sistema</Label>
                  {/* Simplified Scope Selection for Wiring */}
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="GOVERNMENT">Municípios</option>
                    <option value="SYSTEM">Sistemas</option>
                    <option value="SCHOOL">Escolas</option>
                  </select>
                </div>

                {formData.scope === 'GOVERNMENT' && (
                  <div className="space-y-2 col-span-2">
                    <Label>Município Alvo</Label>
                    {/* Mock Select for ID */}
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, targetIds: val ? [val] : [] })
                      }}
                    >
                      <option value="">Selecione...</option>
                      {municipalities.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.scope === 'SYSTEM' && (
                  <div className="space-y-2 col-span-2">
                    <Label>Sistema Alvo</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, targetIds: val ? [val] : [] })
                      }}
                    >
                      <option value="">Selecione...</option>
                      {systems.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}


                <div className="space-y-2">
                  <Label>Role de Usuário</Label>
                  {/* Role Selector */}
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.targetRole || ''}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value || undefined })}
                  >
                    <option value="">Todos</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSend} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Agendar Campanha
            </Button>
          </CardFooter>
        </Card>
      </div>
      {/* Coluna do Histórico */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Histórico</CardTitle>
                <CardDescription>Campanhas enviadas.</CardDescription>
              </div>
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredAndSortedCampaigns.map(camp => (
                  <div key={camp.id} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{camp.title}</p>
                        <p className="text-xs text-muted-foreground">{camp.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{camp.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeactivate(camp.id)} className="text-red-500 hover:text-red-600">
                            <Archive className="mr-2 h-4 w-4" />
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Componente da Página ---

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados & Planos"
        description="Gerencie os planos de assinatura e envie comunicados em massa."
        actions={
          activeTab === 'plans' ? (
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Plano
            </Button>
          ) : (
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          )
        }
      />
      <Tabs defaultValue="plans" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">
            <CreditCard className="mr-2 h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Megaphone className="mr-2 h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="trash">
            <Archive className="mr-2 h-4 w-4" />
            Lixeira
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="space-y-4">
          <PlansTab />
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="trash" className="space-y-4">
          <TrashTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
