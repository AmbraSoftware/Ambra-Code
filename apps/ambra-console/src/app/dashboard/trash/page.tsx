/**
 * @file src/app/dashboard/trash/page.tsx
 * @fileoverview Simplified Trash page for Ambra Console.
 * @description Unified view of all soft-deleted items across entities.
 */
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeletedItem {
  id: string;
  name: string;
  type: 'School' | 'User' | 'System' | 'Plan' | 'Campaign' | 'Operator';
  deletedAt: string;
  deletedBy?: string;
  metadata?: Record<string, any>;
}

export default function TrashPage() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DeletedItem | null>(null);
  const [actionType, setActionType] = useState<'RESTORE' | 'DELETE'>('RESTORE');
  const { toast } = useToast();

  const fetchDeletedItems = async () => {
    setLoading(true);
    try {
      // TODO: Implementar endpoint unificado /platform/trash ou agregar múltiplos endpoints
      // const { data } = await api.get('/platform/trash');
      // setItems(data);

      // Mock data por enquanto
      setItems([
        {
          id: 'school-123',
          name: 'Escola Teste Deletada',
          type: 'School',
          deletedAt: new Date(Date.now() - 86400000).toISOString(),
          deletedBy: 'admin@nodum.io',
          metadata: { taxId: '12.345.678/0001-90' }
        },
        {
          id: 'user-456',
          name: 'João Silva',
          type: 'User',
          deletedAt: new Date(Date.now() - 172800000).toISOString(),
          deletedBy: 'admin@nodum.io',
          metadata: { email: 'joao@example.com', role: 'GUARDIAN' }
        },
        {
          id: 'plan-789',
          name: 'Plano Básico Antigo',
          type: 'Plan',
          deletedAt: new Date(Date.now() - 259200000).toISOString(),
          deletedBy: 'admin@nodum.io',
          metadata: { price: 49.90 }
        }
      ]);
    } catch (error) {
      console.error('Failed to load deleted items', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os itens da lixeira.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const handleRestore = (item: DeletedItem) => {
    setSelectedItem(item);
    setActionType('RESTORE');
    setConfirmOpen(true);
  };

  const handleDelete = (item: DeletedItem) => {
    setSelectedItem(item);
    setActionType('DELETE');
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedItem) return;

    try {
      if (actionType === 'RESTORE') {
        // TODO: Implementar lógica de restauração
        // await api.post(`/platform/${selectedItem.type.toLowerCase()}/${selectedItem.id}/restore`);
        toast({
          title: "Item restaurado",
          description: `${selectedItem.name} foi restaurado com sucesso.`
        });
      } else {
        // TODO: Implementar exclusão permanente
        // await api.delete(`/platform/${selectedItem.type.toLowerCase()}/${selectedItem.id}`);
        toast({
          title: "Item removido permanentemente",
          description: `${selectedItem.name} foi excluído definitivamente.`,
          variant: "destructive"
        });
      }
      fetchDeletedItems();
    } catch (error) {
      console.error('Action failed', error);
      toast({
        title: "Erro",
        description: "Não foi possível completar a ação.",
        variant: "destructive"
      });
    }

    setConfirmOpen(false);
    setSelectedItem(null);
  };

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filtro por nome
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType && filterType !== "all") {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Filtro por data
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.deletedAt);
        return (
          itemDate.getFullYear() === selectedDate.getFullYear() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getDate() === selectedDate.getDate()
        );
      });
    }

    return filtered;
  }, [items, searchTerm, filterType, filterDate]);

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      School: 'bg-blue-100 text-blue-800',
      User: 'bg-green-100 text-green-800',
      System: 'bg-purple-100 text-purple-800',
      Plan: 'bg-orange-100 text-orange-800',
      Campaign: 'bg-pink-100 text-pink-800',
      Operator: 'bg-cyan-100 text-cyan-800'
    };
    return (
      <Badge variant="outline" className={colors[type] || ''}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lixeira"
        description="Itens excluídos que podem ser restaurados ou removidos permanentemente."
      />

      <Card>
        <CardHeader>
          <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Itens Deletados</CardTitle>
                <CardDescription>
                  {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'} encontrados
                </CardDescription>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                  placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
            />
          </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="School">Escolas</SelectItem>
                  <SelectItem value="User">Usuários</SelectItem>
                  <SelectItem value="Plan">Planos</SelectItem>
                  <SelectItem value="System">Sistemas</SelectItem>
                  <SelectItem value="Campaign">Campanhas</SelectItem>
                  <SelectItem value="Operator">Operadores</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Filtrar por data"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full sm:w-[180px]"
              />

              {(searchTerm || filterType !== "all" || filterDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                    setFilterDate("");
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data de Exclusão</TableHead>
                <TableHead>Excluído Por</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
              <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    {searchTerm ? 'Nenhum item encontrado' : 'Lixeira vazia'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.id}
                        </span>
          </div>
                  </TableCell>
                  <TableCell>
                      {getTypeBadge(item.type)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.deletedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.deletedBy || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restaurar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={actionType === 'RESTORE' ? 'Restaurar Item' : 'Excluir Permanentemente'}
        description={
          actionType === 'RESTORE'
            ? `Tem certeza que deseja restaurar "${selectedItem?.name}"? O item será reativado no sistema.`
            : `Tem certeza que deseja excluir "${selectedItem?.name}" PERMANENTEMENTE? Esta ação não pode ser desfeita.`
        }
        onConfirm={handleConfirm}
        variant={actionType === 'DELETE' ? 'destructive' : 'default'}
        confirmText={actionType === 'RESTORE' ? 'Restaurar' : 'Excluir Permanentemente'}
      />
    </div>
  );
}
