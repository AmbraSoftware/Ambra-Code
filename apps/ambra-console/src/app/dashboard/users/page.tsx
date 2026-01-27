/**
 * @file src/app/dashboard/users/page.tsx
 * @fileoverview Users management page for the Nodum Console.
 */
"use client";

import React, { useState, useMemo } from "react";
import { CreateUserDialog } from "@/components/dashboard/dialogs/CreateUserDialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Users, Briefcase, ArrowUpDown, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Censored } from "@/contexts/censorship-context";
import { ClientOnly } from "@/components/client-only";
import { useUsers, useFetch } from "@/hooks/use-api";
import type { Operator, Client } from "@/types";
import { DocumentConsultDialog } from "@/components/dashboard/users/document-consult-dialog";
import { ExportButton } from "@/components/ui/export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";

// --- Tab Components ---
import { api } from "@/lib/api";

type SortDirection = 'asc' | 'desc';

import { EditUserDialog } from "@/components/dashboard/dialogs/EditUserDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// ... existing imports

function OperatorsTab() {
  const { data: operators = [], isLoading, isError, mutate } = useFetch<Operator[]>('/users?role=OPERATOR_SALES,OPERATOR_MEAL,MERCHANT_ADMIN,SCHOOL_ADMIN');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Operator, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [editUser, setEditUser] = useState<Operator | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Error feedback
  React.useEffect(() => {
    if (isError) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os operadores. Verifique sua conexão.",
        variant: "destructive"
      });
    }
  }, [isError, toast]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<{ id: string, name: string } | null>(null);

  const handleEdit = (operator: Operator) => {
    setEditUser(operator);
    setEditOpen(true);
  };

  const handleDeactivateClick = (id: string, name: string) => {
    setUserToDeactivate({ id, name });
    setConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await api.delete(`/users/${userToDeactivate.id}`);
      mutate();
      toast({
        title: "Operador desativado",
        description: `${userToDeactivate.name} foi desativado com sucesso.`
      });
      setConfirmOpen(false);
    } catch (error) {
      console.error("Erro ao desativar:", error);
      toast({
        title: "Erro ao desativar operador",
        description: "Não foi possível desativar o operador. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/users/${id}/restore`);
      mutate();
    } catch (error) {
      console.error("Erro ao restaurar:", error);
    }
  };

  const filteredAndSortedOperators = useMemo(() => {
    let sortableItems = [...operators];

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // @ts-ignore
        const aValue = a[sortConfig.key] ?? '';
        // @ts-ignore
        const bValue = b[sortConfig.key] ?? '';
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
      operator.taxId.includes(searchTerm)
    );
  }, [operators, searchTerm, sortConfig]);

  const handleSort = (key: keyof Operator) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Operadores</CardTitle>
            <Input
              placeholder="Buscar por nome ou CPF..."
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
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer">Nome <ArrowUpDown className="inline h-4 w-4" /></TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOperators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <EmptyState icon={Briefcase} title="Nenhum operador encontrado" description="Adicione um novo operador para começar." />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedOperators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium">{operator.name}</TableCell>
                    <TableCell><Censored value={operator.taxId} /></TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          operator.status === 'Ativo'
                            ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400'
                            : 'border-border text-muted-foreground bg-muted'
                        }
                      >
                        {operator.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { /* Detail Dialog */ }}>
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(operator.id)}>
                            Copiar ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(operator)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivateClick(operator.id, operator.name)}>
                            Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {/* ... End Loop ... */}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editUser}
        onSuccess={() => mutate()}
        roleType="Operator"
      />
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Arquivar Operador"
        description={`Tem certeza que deseja arquivar o operador ${userToDeactivate?.name}?`}
        onConfirm={handleConfirmDeactivate}
        variant="destructive"
      />
    </>
  );
}

function ClientsTab() {
  const { data: clients = [], isLoading, isError, mutate } = useFetch<Client[]>('/users?role=GUARDIAN');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Client, direction: SortDirection } | null>({ key: 'name', direction: 'asc' });
  const [editUser, setEditUser] = useState<Client | null>(null);

  // Error feedback
  React.useEffect(() => {
    if (isError) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os clientes. Verifique sua conexão.",
        variant: "destructive"
      });
    }
  }, [isError, toast]);
  const [editOpen, setEditOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clientToDeactivate, setClientToDeactivate] = useState<{ id: string, name: string } | null>(null);


  const handleEdit = (client: Client) => {
    setEditUser(client);
    setEditOpen(true);
  };

  const handleDeactivateClick = (id: string, name: string) => {
    setClientToDeactivate({ id, name });
    setConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!clientToDeactivate) return;
    try {
      await api.delete(`/users/${clientToDeactivate.id}`);
      mutate();
      toast({
        title: "Cliente removido",
        description: `${clientToDeactivate.name} foi removido com sucesso.`,
      });
      setConfirmOpen(false);
    } catch (error: any) {
      console.error("Erro ao desativar:", error);
      const errorMessage = error.response?.data?.message || 
                          (error.response?.status === 404 ? "Cliente não encontrado." :
                           error.response?.status === 403 ? "Você não tem permissão para remover este cliente." :
                           "Erro ao remover cliente. Tente novamente.");
      toast({ title: "Erro ao remover", description: errorMessage, variant: "destructive" });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/users/${id}/restore`);
      mutate();
    } catch (error) {
      console.error("Erro ao restaurar:", error);
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
        // @ts-ignore
        const aValue = a[sortConfig.key] ?? '';
        // @ts-ignore
        const bValue = b[sortConfig.key] ?? '';
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
          <div className="flex justify-between items-center">
            <CardTitle>Clientes (Pais/Alunos)</CardTitle>
            <Input
              placeholder="Buscar por nome ou email..."
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
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer">Nome <ArrowUpDown className="inline h-4 w-4" /></TableHead>
                <TableHead onClick={() => handleSort('email')} className="cursor-pointer">Email <ArrowUpDown className="inline h-4 w-4" /></TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Ainda não há clientes cadastrados." />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell><Badge variant="outline">{client.role}</Badge></TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.status === 'Ativo'
                            ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400'
                            : 'border-border text-muted-foreground bg-muted'
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { /* Detail Dialog */ }}>
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
                            Copiar ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(client)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivateClick(client.id, client.name)}>
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
        </CardContent>
      </Card>
      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editUser}
        onSuccess={() => mutate()}
        roleType="Client"
      />
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Arquivar Cliente"
        description={`Tem certeza que deseja arquivar o cliente ${clientToDeactivate?.name}?`}
        onConfirm={handleConfirmDeactivate}
        variant="destructive"
      />
    </>
  )
}

// --- Page Component ---

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("operators");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Usuários"
        description="Gerencie operadores do sistema e clientes (pais/alunos)."
        actions={
          activeTab === 'operators' ? (
            <CreateUserDialog
              defaultRole="MERCHANT_ADMIN"
              triggerLabel="Adicionar Operador"
              onSuccess={() => {/* mutate handled inside tabs usually */ }}
            />
          ) : activeTab === 'clients' ? (
            <CreateUserDialog
              defaultRole="GUARDIAN"
              triggerLabel="Adicionar Cliente"
            />
          ) : null
        }
      />

      <Tabs defaultValue="operators" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="operators" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Operadores
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operators" className="space-y-4">
          <OperatorsTab />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
