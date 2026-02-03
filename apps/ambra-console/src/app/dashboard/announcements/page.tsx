/**
 * @file src/app/dashboard/announcements/page.tsx
 * @fileoverview Announcements management page for the Ambra Console.
 * Gerencia APENAS anúncios e comunicações em massa.
 */
"use client"

import * as React from "react";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Send, CheckCircle, ChevronDown, Calendar as CalendarIcon, ArrowUpDown, Megaphone, Search, Target, Users, Mail, Archive, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSystems, useFetch, useSchools } from "@/hooks/use-api";
import type { Campaign } from "@/types";
import { api } from "@/lib/api";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// Static roles from Schema
const roles = [
  { id: 'SUPER_ADMIN', label: 'Super Admin' },
  { id: 'GOV_ADMIN', label: 'Gov Admin' },
  { id: 'SCHOOL_ADMIN', label: 'School Admin' },
  { id: 'OPERATOR_SALES', label: 'Operador de Vendas' },
  { id: 'OPERATOR_MEAL', label: 'Operador de Merenda' },
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
                  {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione as datas</span>
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

// --- Aba de Campanhas (ÚNICA ABA) ---
function CampaignsTab() {
  const { systems } = useSystems();
  const { schools } = useSchools();
  const { data: campaignsData, isLoading, mutate } = useFetch<Campaign[]>('/announcements');
  const campaigns = campaignsData || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Campaign, direction: SortDirection } | null>({ key: 'title', direction: 'asc' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [campaignToDeactivate, setCampaignToDeactivate] = useState<{ id: string, title: string } | null>(null);

  const { toast } = useToast();

  const handleDeactivate = (camp: { id: string, title: string }) => {
    setCampaignToDeactivate(camp);
    setConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!campaignToDeactivate) return;
    try {
      await api.patch(`/announcements/${campaignToDeactivate.id}/deactivate`);
      mutate();
      toast({
        title: "Campanha desativada",
        description: `A campanha "${campaignToDeactivate.title}" foi arquivada.`
      });
    } catch (error) {
      console.error("Failed to deactivate campaign:", error);
      toast({
        title: "Erro ao desativar",
        description: "Não foi possível arquivar a campanha.",
        variant: "destructive"
      });
    }
    setConfirmOpen(false);
    setCampaignToDeactivate(null);
  };

  const handleSort = (key: keyof Campaign) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'Enviado' || c.status === 'Agendado');

  const filteredAndSortedCampaigns = useMemo(() => {
    let sortableItems = [...activeCampaigns];
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
      (campaign.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [activeCampaigns, searchTerm, sortConfig]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Campanhas de Comunicação</CardTitle>
              <CardDescription>Envie anúncios segmentados para usuários específicos.</CardDescription>
            </div>
            <Input
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('title')}>
                      Título
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Segmentação</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Nenhuma campanha encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.title}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === "Enviado" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(campaign as any).targetRoles?.length || 0} roles, {(campaign as any).targetSchools?.length || 0} escolas
                      </TableCell>
                      <TableCell className="text-sm">
                        {(campaign as any).scheduledDate 
                          ? format(new Date((campaign as any).scheduledDate), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : 'Não agendada'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Duplicar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeactivate(campaign)} className="text-destructive hover:text-destructive">
                              <Archive className="mr-2 h-4 w-4" />
                              Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação (implementar posteriormente) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
            <DialogDescription>
              Crie uma campanha de comunicação segmentada
            </DialogDescription>
          </DialogHeader>
          {/* Formulário aqui */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button>Criar Campanha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Arquivar Campanha"
        description={`Tem certeza que deseja arquivar a campanha "${campaignToDeactivate?.title}"? Ela ficará inativa.`}
        onConfirm={handleConfirmDeactivate}
        variant="destructive"
      />
    </>
  );
}

// --- Componente da Página ---
export default function AnnouncementsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados & Anúncios"
        description="Gerencie comunicações em massa e anúncios para usuários específicos."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        }
      />
      <CampaignsTab />

      {/* Create Dialog (placeholder) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
            <DialogDescription>
              Crie uma campanha de comunicação segmentada
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Formulário de criação de campanha será implementado aqui.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button>Criar Campanha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
