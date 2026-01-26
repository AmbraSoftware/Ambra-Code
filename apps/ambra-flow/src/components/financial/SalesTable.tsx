'use client';

import React from 'react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Order } from '@/services/financial.service';

interface SalesTableProps {
    orders: Order[];
    isLoading: boolean;
}

export function SalesTable({ orders, isLoading }: SalesTableProps) {
    return (
        <Table<Order>
            isLoading={isLoading}
            data={orders}
            keyExtractor={(item) => item.id}
            columns={[
                {
                    header: 'Data',
                    accessorKey: 'createdAt',
                    cell: (item) => new Date(item.createdAt).toLocaleString('pt-BR')
                },
                {
                    header: 'Pedido #',
                    accessorKey: 'orderHash',
                    cell: (item) => <span className="font-mono text-xs">{item.orderHash.slice(0, 8)}...</span>
                },
                {
                    header: 'Aluno',
                    accessorKey: 'student',
                    cell: (item) => (
                        <div>
                            <p className="font-medium text-text-light dark:text-text-dark">{item.student.name}</p>
                            <p className="text-xs text-muted-light dark:text-muted-dark uppercase">Responsável: {item.buyer.name}</p>
                        </div>
                    )
                },
                {
                    header: 'Itens',
                    cell: (item) => (
                        <div className="flex flex-col gap-1">
                            {item.items.slice(0, 2).map((i, idx) => (
                                <span key={idx} className="text-xs text-text-light dark:text-text-dark">
                                    {i.quantity}x {i.product.name}
                                </span>
                            ))}
                            {item.items.length > 2 && (
                                <span className="text-[10px] text-muted-light dark:text-muted-dark">
                                    +{item.items.length - 2} outros
                                </span>
                            )}
                        </div>
                    )
                },
                {
                    header: 'Total',
                    accessorKey: 'totalAmount',
                    cell: (item) => <span className="font-bold text-green-600">R$ {Number(item.totalAmount).toFixed(2)}</span>
                },
                {
                    header: 'Status',
                    accessorKey: 'status',
                    cell: (item) => (
                        <Badge variant={
                            item.status === 'PAID' ? 'success' :
                                item.status === 'DELIVERED' ? 'neutral' :
                                    item.status === 'CANCELLED' ? 'error' : 'warning'
                        }>
                            {item.status === 'PAID' ? 'VENDIDO' : item.status}
                        </Badge>
                    )
                }
            ]}
        />
    );
}
