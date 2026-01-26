/**
 * @file src/app/dashboard/trash/page.tsx
 * @fileoverview Trash page for the Nodum Console.
 * @description This page displays all soft-deleted or inactive items, allowing for restoration or permanent deletion.
 */
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, Trash, Building, Network, School, Users, Briefcase, Banknote, Megaphone, CircleDollarSign, Gavel } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { Censored } from '@/contexts/censorship-context';
// import { initialSystems, initialSchools, initialMunicipalities, initialOperators, initialClients, initialPlans } from "@/lib/mock-data";
import type { System, School as SchoolType, Municipality, Operator, Client, Plan, Campaign } from "@/types";
import { useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";


type SortDirection = 'asc' | 'desc';

// --- Reusable Table Components ---

function SystemsTab({ showInactive = false }: { showInactive?: boolean }) {
  const { data: allSystems, isLoading, mutate } = useFetch<System[]>('/platform/systems');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof System, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'RESTORE' | 'DELETE'>('RESTORE');

  const systems = useMemo(() => {
    if (!allSystems) return [];
    // Trash Page: Show INACTIVE. Entities Page: Show ACTIVE.
    return allSystems.filter(s => showInactive ? s.status !== 'ACTIVE' : s.status === 'ACTIVE');
  }, [allSystems, showInactive]);

  const handleRestoreClick = (id: string) => {
    setSelectedId(id);
    setActionType('RESTORE');
    setConfirmOpen(true);
  }

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setActionType('DELETE');
    setConfirmOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!selectedId) return;
    try {
      if (actionType === 'RESTORE') {
        await api.patch(`/platform/systems/${selectedId}`, { status: 'ACTIVE' });
      } else {
        await api.delete(`/platform/systems/${selectedId}`);
      }
      mutate();
    } catch (error) {
      console.error(`Failed to ${actionType.toLowerCase()} system:`, error);
      alert("Erro ao processar ação. Verifique se existem dependências (escolas vinculadas).");
    }
  };


  const handleSort = (key: keyof System) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedSystems = useMemo(() => {
    let sortableItems = [...systems];
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

    return sortableItems.filter(system =>
      system.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [systems, searchTerm, sortConfig]);

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando sistemas...</div>;


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Sistemas Arquivados</CardTitle>
            </div>
            <Input
              placeholder="Buscar por nome..."
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
                <TableHead>ID do Sistema</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('name')}>
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('created_at')}>
                    Criado em
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSystems.map((system) => (
                <TableRow key={system.id}>
                  <TableCell className="font-medium font-code">{system.id}</TableCell>
                  <TableCell>{system.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{system.status}</Badge>
                  </TableCell>
                  <TableCell>{system.created_at}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleRestoreClick(system.id)}>Restaurar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(system.id)}>Excluir Permanentemente</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={actionType === 'RESTORE' ? "Restaurar Sistema" : "Excluir Permanentemente"}
        description={actionType === 'RESTORE'
          ? "Tem certeza que deseja restaurar este sistema? Ele voltará a ficar ativo."
          : "Tem certeza que deseja excluir PERMANENTEMENTE este sistema? Esta ação NÃO pode ser desfeita e falhará se houver escolas vinculadas."}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}

function SchoolsTab({ showInactive = false }: { showInactive?: boolean }) {
  const { data: allSchools, isLoading, mutate } = useFetch<SchoolType[]>('/tenancy/schools');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof SchoolType, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'RESTORE' | 'DELETE'>('RESTORE');

  const schools = useMemo(() => {
    if (!allSchools) return [];
    return allSchools.filter(s => showInactive ? s.status !== 'ACTIVE' : s.status === 'ACTIVE');
  }, [allSchools, showInactive]);

  const handleRestoreClick = (id: string) => {
    setSelectedId(id);
    setActionType('RESTORE');
    setConfirmOpen(true);
  }

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setActionType('DELETE');
    setConfirmOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!selectedId) return;
    try {
      if (actionType === 'RESTORE') {
        await api.patch(`/tenancy/schools/${selectedId}`, { status: 'ACTIVE' });
      } else {
        await api.delete(`/tenancy/schools/${selectedId}`);
      }
      mutate();
    } catch (error) {
      console.error(`Failed to ${actionType.toLowerCase()} school:`, error);
      alert("Erro ao processar ação. Verifique se existem dependências (usuários/pedidos).");
    }
  };


  const handleSort = (key: keyof SchoolType) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedSchools = useMemo(() => {
    let sortableItems = [...schools];
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

    return sortableItems.filter(school =>
      (school.name.toLowerCase().includes(searchTerm.toLowerCase()) || school.cnpj?.includes(searchTerm))
    );
  }, [schools, searchTerm, sortConfig]);

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando escolas...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Escolas Arquivadas</CardTitle>
            </div>
            <Input
              placeholder="Buscar por nome ou CNPJ..."
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
                <TableHead>ID da Escola</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('name')}>
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium font-code">{school.id}</TableCell>
                  <TableCell>{school.name}</TableCell>
                  <TableCell className="font-code"><Censored value={school.cnpj} censorChar="*" /></TableCell>
                  <TableCell>
                    <Badge variant="outline">{school.status}</Badge>
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
                        <DropdownMenuItem onClick={() => handleRestoreClick(school.id)}>Restaurar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(school.id)}>Excluir Permanentemente</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={actionType === 'RESTORE' ? "Restaurar Escola" : "Excluir Permanentemente"}
        description={actionType === 'RESTORE'
          ? "Tem certeza que deseja restaurar esta escola?"
          : "Tem certeza que deseja excluir PERMANENTEMENTE esta escola? Cuidado!"}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}

function MunicipalitiesTab() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMunicipalities = useMemo(() => {
    return municipalities.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [municipalities, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Municípios Arquivados</CardTitle>
          </div>
          <Input
            placeholder="Buscar por nome ou slug..."
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
              <TableHead>Município</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status do Contrato</TableHead>
              <TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMunicipalities.map((municipality) => (
              <TableRow key={municipality.id}>
                <TableCell className="font-medium">{municipality.name}</TableCell>
                <TableCell className="font-code">{municipality.slug}</TableCell>
                <TableCell>
                  <Badge variant={"outline"}>
                    {municipality.status}
                  </Badge>
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
                      <DropdownMenuItem>Restaurar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">Excluir Permanentemente</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function OperatorsTab() {
  // Fetch ALL operators (including deleted)
  const { data: allOperators, isLoading, mutate } = useFetch<Operator[]>('/users?role=CANTEEN_OPERATOR,OPERATOR_ADMIN,SCHOOL_ADMIN&deleted=true');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Operator, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'RESTORE' | 'DELETE'>('RESTORE');

  // Filter for deleted only
  const operators = useMemo(() => {
    if (!allOperators) return [];
    return allOperators.filter(op => op.deletedAt !== null);
  }, [allOperators]);

  const handleRestoreClick = (id: string) => {
    setSelectedId(id);
    setActionType('RESTORE');
    setConfirmOpen(true);
  }

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setActionType('DELETE');
    setConfirmOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!selectedId) return;
    try {
      if (actionType === 'RESTORE') {
        await api.patch(`/users/${selectedId}/restore`);
      } else {
        await api.delete(`/users/${selectedId}/permanent`);
      }
      mutate();
    } catch (error) {
      console.error(`Failed to ${actionType.toLowerCase()} operator:`, error);
    }
  };

  const handleSort = (key: keyof Operator) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedOperators = useMemo(() => {
    let sortableItems = [...operators];
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

    return sortableItems.filter(operator =>
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (operator.taxId || operator.cpfCnpj || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [operators, searchTerm, sortConfig]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Operadores Arquivados</CardTitle>
            </div>
            <Input
              placeholder="Buscar por nome ou CPF/CNPJ..."
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
                <TableHead className="w-[250px]">
                  <Button variant="ghost" onClick={() => handleSort('name')}>
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>WalletID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOperators.map((operator) => (
                <TableRow key={operator.id}>
                  <TableCell className="font-medium">
                    {operator.name}
                  </TableCell>
                  <TableCell className="font-code"><Censored value={operator.taxId || operator.cpfCnpj || '000'} censorChar="*" /></TableCell>
                  <TableCell className="font-code">{operator.walletId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{operator.deletedAt ? 'ARQUIVADO' : 'ATIVO'}</Badge>
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
                        <DropdownMenuItem onClick={() => handleRestoreClick(operator.id)}>Restaurar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(operator.id)}>Excluir Permanentemente</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={actionType === 'RESTORE' ? "Restaurar Operador" : "Excluir Permanentemente"}
        description={actionType === 'RESTORE'
          ? "Tem certeza que deseja restaurar este operador?"
          : "Tem certeza que deseja excluir PERMANENTEMENTE este operador?"}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}

function ClientsTab() {
  // Fetch ALL clients (Guardians/Students) including deleted
  // Since we don't have a single role for clients, we might need a dedicated endpoint or search param.
  // For now, let's assume filtering by role CLIENT (if mapped) or fetching all and filtering type.
  // Actually, 'users' endpoint returns all for SCHOOL_ADMIN.
  const { data: allUsers, isLoading, mutate } = useFetch<Client[]>('/users?deleted=true');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Client, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'RESTORE' | 'DELETE'>('RESTORE');

  const clients = useMemo(() => {
    if (!allUsers) return [];
    // Filter for deleted AND is a Client (Student/Guardian)
    return allUsers.filter(u => u.deletedAt !== null && (u.role === 'STUDENT' || u.role === 'GUARDIAN'));
  }, [allUsers]);

  const handleRestoreClick = (id: string) => {
    setSelectedId(id);
    setActionType('RESTORE');
    setConfirmOpen(true);
  }

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setActionType('DELETE');
    setConfirmOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!selectedId) return;
    try {
      if (actionType === 'RESTORE') {
        await api.patch(`/users/${selectedId}/restore`);
      } else {
        await api.delete(`/users/${selectedId}/permanent`);
      }
      mutate();
    } catch (error) {
      console.error(`Failed to ${actionType.toLowerCase()} client:`, error);
    }
  };

  const handleSort = (key: keyof Client) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedClients = useMemo(() => {
    let sortableItems = [...clients];

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

    return sortableItems.filter(client =>
    (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm, sortConfig]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Clientes Arquivados</CardTitle>
            </div>
            <Input
              placeholder="Buscar por nome ou email..."
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
                <TableHead className="w-[250px]">
                  <Button variant="ghost" onClick={() => handleSort('name')}>
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('email')}>
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.name}
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.deletedAt ? 'ARQUIVADO' : 'ATIVO'}</Badge>
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
                        <DropdownMenuItem onClick={() => handleRestoreClick(client.id)}>Restaurar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(client.id)}>Excluir Permanentemente</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={actionType === 'RESTORE' ? "Restaurar Cliente" : "Excluir Permanentemente"}
        description={actionType === 'RESTORE'
          ? "Tem certeza que deseja restaurar este cliente?"
          : "Tem certeza que deseja excluir PERMANENTEMENTE este cliente?"}
        onConfirm={handleConfirmAction}
      />
    </>
  )
}

function PlansTab() {
  const { data: allPlans, isLoading, mutate } = useFetch<Plan[]>('/platform/plans');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Plan, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'RESTORE' | 'DELETE'>('RESTORE');

  const plans = useMemo(() => {
    if (!allPlans) return [];
    // Plans STATUS: ACTIVE, ARCHIVED, INACTIVE. PlatformService uses 'ARCHIVED' for trash.
    // If list returns all, we filter.
    return allPlans.filter(p => p.status !== 'ACTIVE');
  }, [allPlans]);

  const handleRestoreClick = (id: string) => {
    setSelectedId(id);
    setActionType('RESTORE');
    setConfirmOpen(true);
  }

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setActionType('DELETE');
    setConfirmOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!selectedId) return;
    try {
      if (actionType === 'RESTORE') {
        await api.patch(`/platform/plans/${selectedId}/restore`);
      } else {
        await api.delete(`/platform/plans/${selectedId}`);
      }
      mutate();
    } catch (error) {
      console.error("Failed to restore plan:", error);
    }
  };

  const handleSort = (key: keyof Plan) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedPlans = useMemo(() => {
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
      plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm, sortConfig]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Planos Arquivados</CardTitle>
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
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('price')}>
                    Preço
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="font-code">{plan.price}</TableCell>
                  <TableCell>
                    <Badge variant={"outline"}>
                      {plan.status}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => handleRestoreClick(plan.id)}>Restaurar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(plan.id)}>Excluir Permanentemente</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={actionType === 'RESTORE' ? "Restaurar Plano" : "Excluir Permanentemente"}
        description={actionType === 'RESTORE'
          ? "Tem certeza que deseja restaurar este plano?"
          : "Tem certeza que deseja excluir PERMANENTEMENTE este plano?"}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}

function CampaignsTab() {
  const { data: allCampaigns, isLoading, mutate } = useFetch<Campaign[]>('/announcements');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Campaign, direction: SortDirection } | null>({ key: 'title', direction: 'asc' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const campaigns = useMemo(() => {
    if (!allCampaigns) return [];
    return allCampaigns.filter(c => c.status === 'INACTIVE');
  }, [allCampaigns]);

  const handleRestoreClick = (id: string) => {
    setSelectedId(id);
    setConfirmOpen(true);
  }

  const handleConfirmRestore = async () => {
    if (!selectedId) return;
    try {
      await api.patch(`/announcements/${selectedId}/restore`);
      mutate();
    } catch (error) {
      console.error("Failed to restore campaign:", error);
    }
  };

  const handleSort = (key: keyof Campaign) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Campanhas Arquivadas</CardTitle>
            </div>
            <Input
              placeholder="Buscar por título..."
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
                  <Button variant="ghost" onClick={() => handleSort('title')}>
                    Título
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.title}</TableCell>
                  <TableCell>{campaign.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.status}</Badge>
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
                        <DropdownMenuItem onClick={() => handleRestoreClick(campaign.id)}>Restaurar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" disabled>Excluir Permanentemente</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Restaurar Campanha"
        description="Tem certeza que deseja restaurar esta campanha?"
        onConfirm={handleConfirmRestore}
      />
    </>
  );
}


// --- Main Page Component ---

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState("entities");

  const handleEmptyTrash = async () => {
    if (!confirm("Tem certeza que deseja esvaziar a lixeira desta seção? Esta ação é irreversível e excluirá TODOS os itens arquivados nesta categoria.")) return;
    try {
      await api.delete(`/platform/trash?type=${activeTab}`);
      alert("Lixeira esvaziada com sucesso.");
      // Trigger revalidation ideally, but simpler to reload or let user navigate.
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao esvaziar lixeira.");
    }
  }

  return (
    <div className="flex flex-col gap-8 space-y-6">
      <PageHeader
        title="Lixeira"
        description="Gerencie itens arquivados e inativos do sistema."
        actions={
          <Button variant="destructive" onClick={handleEmptyTrash}>
            <Trash className="mr-2 h-4 w-4" />
            Limpar Lixeira
          </Button>
        }
      />
      <Tabs defaultValue="entities" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="entities"><Building className="mr-2 h-4 w-4" /> Entidades</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" /> Anúncios</TabsTrigger>
        </TabsList>

        {/* Entidades */}
        <TabsContent value="entities">
          <Tabs defaultValue="systems" className="w-full">
            <TabsList>
              <TabsTrigger value="systems"><Network className="mr-2 h-4 w-4" />Sistemas</TabsTrigger>
              <TabsTrigger value="schools"><School className="mr-2 h-4 w-4" />Escolas</TabsTrigger>
              <TabsTrigger value="municipalities"><Building className="mr-2 h-4 w-4" />Municípios</TabsTrigger>
            </TabsList>
            <TabsContent value="systems" className="mt-4"><SystemsTab showInactive={true} /></TabsContent>
            <TabsContent value="schools" className="mt-4"><SchoolsTab showInactive={true} /></TabsContent>
            <TabsContent value="municipalities" className="mt-4"><MunicipalitiesTab /></TabsContent>
          </Tabs>
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="users">
          <Tabs defaultValue="operators" className="w-full">
            <TabsList>
              <TabsTrigger value="operators"><Briefcase className="mr-2 h-4 w-4" />Operadores</TabsTrigger>
              <TabsTrigger value="clients"><Users className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
            </TabsList>
            <TabsContent value="operators" className="mt-4"><OperatorsTab /></TabsContent>
            <TabsContent value="clients" className="mt-4"><ClientsTab /></TabsContent>
          </Tabs>
        </TabsContent>

        {/* Anúncios */}
        <TabsContent value="announcements">
          <Tabs defaultValue="plans" className="w-full">
            <TabsList>
              <TabsTrigger value="plans"><CircleDollarSign className="mr-2 h-4 w-4" />Planos</TabsTrigger>
              <TabsTrigger value="campaigns"><Megaphone className="mr-2 h-4 w-4" />Campanhas</TabsTrigger>
            </TabsList>
            <TabsContent value="plans" className="mt-4"><PlansTab /></TabsContent>
            <TabsContent value="campaigns" className="mt-4"><CampaignsTab /></TabsContent>
          </Tabs>
        </TabsContent>

      </Tabs>
    </div>
  )
}
