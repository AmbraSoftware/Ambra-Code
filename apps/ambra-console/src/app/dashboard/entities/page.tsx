/**
 * @file src/app/dashboard/entities/page.tsx
 * @fileoverview Entities management page for the Nodum Console.
 * @description This page allows administrators to manage core business entities: Municipalities, Systems (verticals), and Schools (tenants).
 */
"use client";

// --- Imports ---
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, Network, Building, School as SchoolIcon, Loader2, CheckCircle, XCircle, Store, Utensils, Apple } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EditSystemDialog } from "@/components/dashboard/dialogs/EditSystemDialog";
import { EditSchoolDialog } from "@/components/dashboard/dialogs/EditSchoolDialog";
import { CreateSchoolDialog } from "@/components/dashboard/dialogs/CreateSchoolDialog";
import { ContractDialog } from "@/components/dashboard/dialogs/ContractDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButton } from "@/components/ui/export-button";
import type { Municipality, System, School } from "@/types";
import { api } from "@/lib/api";
import { Censored } from "@/contexts/censorship-context";
import { CreateSystemDialog } from "@/components/dashboard/dialogs/CreateSystemDialog";
import { CreateGovernmentDialog } from "@/components/dashboard/dialogs/CreateGovernmentDialog";
import { EditGovernmentDialog } from "@/components/dashboard/dialogs/EditGovernmentDialog";
import { CreateOperatorDialog } from "@/components/dashboard/dialogs/CreateOperatorDialog";
import { EditOperatorDialog } from "@/components/dashboard/dialogs/EditOperatorDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type SortDirection = 'asc' | 'desc';

// --- Services (Move to separate file in prod) ---
const fetchSystems = async (): Promise<System[]> => {
  const { data } = await api.get('/platform/systems');
  return data;
};

const fetchSchools = async (status?: string): Promise<School[]> => {
  const params = status ? { status } : {};
  const { data } = await api.get('/tenancy/schools', { params });
  return data;
};

const fetchGovernments = async (): Promise<Municipality[]> => {
  const { data } = await api.get('/tenancy/governments');
  return data;
};

const fetchOperators = async () => {
  const { data } = await api.get('/operators');
  return data;
};

// --- Components ---

function SystemsTab() {
  const queryClient = useQueryClient();
  const { data: systems = [], isLoading, isError, error } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
    retry: 2
  });

  useEffect(() => {
    if (isError && error) {
      console.error('Erro ao carregar sistemas:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os sistemas. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [isError, error]);

  const [searchTerm, setSearchTerm] = useState("");
  const [editSystem, setEditSystem] = useState<System | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [systemToDeactivate, setSystemToDeactivate] = useState<{ id: string, name: string } | null>(null);

  const filteredSystems = useMemo(() => {
    return systems.filter(system =>
      system.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [systems, searchTerm]);

  // Mutations
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/platform/systems/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast({ title: "Sistema arquivado com sucesso" });
      setConfirmOpen(false);
    },
    onError: () => toast({ title: "Erro ao arquivar sistema", variant: "destructive" })
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/platform/systems/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast({ title: "Sistema restaurado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao restaurar sistema", variant: "destructive" })
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sistemas (Verticais)</CardTitle>
            <Input
              placeholder="Buscar sistema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredSystems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <EmptyState icon={Network} title="Nenhum sistema encontrado" description="Tente ajustar os filtros." />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSystems.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell className="font-medium">{system.name}</TableCell>
                    <TableCell>{system.slug}</TableCell>
                    <TableCell><Badge variant="outline">{system.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setEditSystem(system); setEditOpen(true); }}>Editar</DropdownMenuItem>
                          {system.status === 'ACTIVE' ? (
                            <DropdownMenuItem onClick={() => { setSystemToDeactivate(system); setConfirmOpen(true); }}>
                              Arquivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => restoreMutation.mutate(system.id)}>
                              Restaurar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditSystemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        system={editSystem}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['systems'] })}
      />
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Arquivar Sistema"
        description={`Tem certeza que deseja arquivar ${systemToDeactivate?.name}?`}
        onConfirm={() => systemToDeactivate && deactivateMutation.mutate(systemToDeactivate.id)}
        variant="destructive"
      />
    </>
  );
}

function SchoolsTab() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'active' | 'pending'>('active');
  const [searchTerm, setSearchTerm] = useState("");

  // Separate queries for better caching and performance
  const { data: schools = [], isLoading, isError, error: schoolsError } = useQuery({
    queryKey: ['schools', viewMode],
    queryFn: () => fetchSchools(viewMode === 'pending' ? 'PENDING' : undefined),
    staleTime: 1000 * 60 * 2,
    retry: 2
  });

  useEffect(() => {
    if (isError && schoolsError) {
      console.error('Erro ao carregar escolas:', schoolsError);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar as escolas. Verifique sua conexão.",
        variant: "destructive"
      });
    }
  }, [isError, schoolsError]);

  // Query for pending count badge (always active)
  const { data: pendingSchoolsCount, error: pendingError } = useQuery({
    queryKey: ['schools', 'count-pending'],
    queryFn: async () => {
      const data = await fetchSchools('PENDING');
      return data.length;
    },
    refetchInterval: 1000 * 60,
    retry: 1
  });

  useEffect(() => {
    if (pendingError) {
      console.warn('Não foi possível atualizar contador de aprovações pendentes');
    }
  }, [pendingError]);

  // Local state for modals
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [schoolToApprove, setSchoolToApprove] = useState<School | null>(null);

  const filteredSchools = useMemo(() => {
    // If viewMode is 'active', we might get some pending ones if backend returns all
    // But since we implemented server-side filter, 'schools' should be clean.
    // Client-side filtering for Search
    return schools.filter(school => {
      if (viewMode === 'active' && school.status === 'PENDING') return false; // Double check
      return school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (school.cnpj && school.cnpj.includes(searchTerm));
    });
  }, [schools, searchTerm, viewMode]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tenancy/schools/${id}`, { status: 'ACTIVE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['schools', 'count-pending'] });
      toast({ title: "Escola aprovada com sucesso!" }); // Toast padrão já tem estilo de sucesso
      setApproveDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao aprovar escola", variant: "destructive" })
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tenancy/schools/${id}`, { status: 'SUSPENDED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({ title: "Escola suspensa." });
    }
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-4 items-center">
              <CardTitle>Escolas (Tenants)</CardTitle>
              <div className="flex bg-muted/20 p-1 rounded-lg border border-border">
                <button
                  onClick={() => setViewMode('active')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'active' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Ativas
                </button>
                <button
                  onClick={() => setViewMode('pending')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Aprovações
                  {(pendingSchoolsCount || 0) > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 min-w-[1.25rem] text-[10px] flex items-center justify-center animate-pulse">
                      {pendingSchoolsCount}
                    </Badge>
                  )}
                </button>
              </div>
            </div>
            <Input
              placeholder="Buscar escola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[250px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin inline text-primary" />
                    <p className="text-muted-foreground mt-2">Carregando dados...</p>
                  </TableCell>
                </TableRow>
              ) : filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <EmptyState
                      icon={SchoolIcon}
                      title={viewMode === 'pending' ? "Tudo limpo por aqui!" : "Nenhuma escola encontrada"}
                      description={viewMode === 'pending' ? "Não há novas solicitações de cadastro pendentes." : "Tente ajustar os filtros."}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{school.name}</span>
                        <span className="text-xs text-muted-foreground">{school.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Censored value={school.taxId || school.cnpj} />
                    </TableCell>
                    <TableCell>
                      {/* @ts-ignore */}
                      <Badge variant="secondary" className="font-normal">{school.plan?.name || "Básico"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={school.status === 'PENDING' ? 'outline' : school.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={school.status === 'PENDING' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400' : ''}
                      >
                        {school.status === 'PENDING' ? 'Aguardando Aprovação' : school.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {school.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 gap-2"
                            onClick={() => { setSchoolToApprove(school); setApproveDialogOpen(true); }}
                          >
                            <CheckCircle size={14} /> Aprovar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditSchool(school); setEditOpen(true); }}>Ver Detalhes</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <XCircle size={14} className="mr-2" /> Rejeitar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditSchool(school); setEditOpen(true); }}>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {school.status === 'ACTIVE' ? (
                              <DropdownMenuItem onClick={() => suspendMutation.mutate(school.id)}>Suspender</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => approveMutation.mutate(school.id)}>Reativar</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditSchoolDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        school={editSchool}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['schools'] })}
      />

      <ConfirmationDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        title="Aprovar Escola"
        description={`Confirma a aprovação da escola ${schoolToApprove?.name}? Isso liberará o acesso imediato ao painel.`}
        confirmText="Confirmar Aprovação"
        onConfirm={() => schoolToApprove && approveMutation.mutate(schoolToApprove.id)}
        variant="default" // Green confirmation logic if supported or default
      />
    </>
  );
}

function MunicipalitiesTab() {
  const queryClient = useQueryClient();
  const { data: municipalities = [], isLoading: munLoading, isError: munIsError, error: munError } = useQuery({
    queryKey: ['municipalities'],
    queryFn: fetchGovernments,
    retry: 2
  });

  useEffect(() => {
    if (munIsError && munError) {
      console.error('Erro ao carregar municípios:', munError);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os municípios. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [munIsError, munError]);

  const [searchTerm, setSearchTerm] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editGov, setEditGov] = useState<Municipality | null>(null);
  const [contractOpen, setContractOpen] = useState(false);
  const [activeContract, setActiveContract] = useState<Municipality | null>(null);

  const filteredMunicipalities = useMemo(() => {
    return municipalities.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.taxId.includes(searchTerm)
    );
  }, [municipalities, searchTerm]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Lista de Municípios</CardTitle>
              <CardDescription>Governos e Prefeituras parceiras.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto"
              />
              <ExportButton
                data={filteredMunicipalities}
                filename="municipios"
                formats={['csv']}
                title="Exportar"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Município</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {munLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : filteredMunicipalities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <EmptyState icon={Building} title="Nenhum município encontrado" description="" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredMunicipalities.map((gov) => (
                  <TableRow key={gov.id}>
                    <TableCell className="font-medium">{gov.name}</TableCell>
                    <TableCell><Censored value={gov.taxId} /></TableCell>
                    <TableCell><Badge variant="default">{gov.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditGov(gov); setEditOpen(true); }}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setActiveContract(gov); setContractOpen(true); }}>Contrato</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <EditGovernmentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        government={editGov}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['municipalities'] })}
      />
      
      <ContractDialog
        open={contractOpen}
        onOpenChange={setContractOpen}
        municipalityName={activeContract?.name || ''}
        contractUrl={null}
        onSave={() => setContractOpen(false)}
      />
    </>
  );
}

function OperatorsTab() {
  const queryClient = useQueryClient();
  const { data: operators = [], isLoading: opLoading, isError: opIsError, error: opError } = useQuery({
    queryKey: ['operators'],
    queryFn: fetchOperators,
    retry: 2
  });

  useEffect(() => {
    if (opIsError && opError) {
      console.error('Erro ao carregar operadores:', opError);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os operadores. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [opIsError, opError]);

  const [searchTerm, setSearchTerm] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editOperator, setEditOperator] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<any>(null);

  const filteredOperators = useMemo(() => {
    return operators.filter((op: any) =>
      op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.taxId.includes(searchTerm)
    );
  }, [operators, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/operators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      toast({ title: "Operador removido com sucesso" });
      setConfirmOpen(false);
    },
    onError: (err: any) => {
        const msg = err.response?.data?.message || "Erro ao remover operador";
        toast({ title: msg, variant: "destructive" });
    }
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Operadores (Fiscais)</CardTitle>
            <Input
              placeholder="Buscar operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cantinas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
              ) : filteredOperators.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center"><EmptyState icon={Store} title="Nenhum operador encontrado" /></TableCell></TableRow>
              ) : (
                filteredOperators.map((op: any) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.name}</TableCell>
                    <TableCell><Censored value={op.taxId} /></TableCell>
                    <TableCell><Badge variant="secondary">{op._count?.canteens || 0}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditOperator(op); setEditOpen(true); }}>Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => { setOperatorToDelete(op); setConfirmOpen(true); }}>Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <EditOperatorDialog 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        operator={editOperator} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['operators'] })} 
      />

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remover Operador"
        description={`Tem certeza que deseja remover ${operatorToDelete?.name}? Esta ação é irreversível.`}
        onConfirm={() => operatorToDelete && deleteMutation.mutate(operatorToDelete.id)}
        variant="destructive"
      />
    </>
  );
}

export default function EntitiesPage() {
  const [activeTab, setActiveTab] = useState("systems");
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Entidades"
        description="Gerencie municípios, sistemas, escolas e operadores."
        actions={
          activeTab === 'systems' ? (
            <CreateSystemDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['systems'] })} />
          ) : activeTab === 'schools' ? (
            <CreateSchoolDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['schools'] })} />
          ) : activeTab === 'municipalities' ? (
            <CreateGovernmentDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['municipalities'] })} />
          ) : activeTab === 'operators' ? (
            <CreateOperatorDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['operators'] })} />
          ) : null
        }
      />

      <Tabs defaultValue="systems" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:max-w-2xl">
          <TabsTrigger value="systems" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">Sistemas</span>
          </TabsTrigger>
          <TabsTrigger value="municipalities" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Municípios</span>
          </TabsTrigger>
          <TabsTrigger value="schools" className="flex items-center gap-2">
            <SchoolIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Escolas</span>
          </TabsTrigger>
          <TabsTrigger value="operators" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Operadores</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-4"><SystemsTab /></TabsContent>
        <TabsContent value="municipalities" className="space-y-4"><MunicipalitiesTab /></TabsContent>
        <TabsContent value="schools" className="space-y-4"><SchoolsTab /></TabsContent>
        <TabsContent value="operators" className="space-y-4"><OperatorsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
