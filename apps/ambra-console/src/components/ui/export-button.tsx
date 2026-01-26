/**
 * @file components/ui/export-button.tsx
 * @description Botão de exportação com dropdown para múltiplos formatos
 */

import React from 'react';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExport } from '@/hooks/use-export';

interface ExportButtonProps {
    data: any[];
    filename: string;
    formats?: ('csv' | 'json' | 'pdf')[];
    title?: string;
    disabled?: boolean;
}

export function ExportButton({
    data,
    filename,
    formats = ['csv', 'json'],
    title,
    disabled = false
}: ExportButtonProps) {
    const { exportToCSV, exportToJSON, exportToPDF } = useExport();

    const handleExport = (format: 'csv' | 'json' | 'pdf') => {
        switch (format) {
            case 'csv':
                exportToCSV(data, filename);
                break;
            case 'json':
                exportToJSON(data, filename);
                break;
            case 'pdf':
                exportToPDF(data, filename, { title });
                break;
        }
    };

    if (data.length === 0) {
        return (
            <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Exportar
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Formato de exportação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {formats.includes('csv') && (
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        CSV
                    </DropdownMenuItem>
                )}
                {formats.includes('json') && (
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                        <FileJson className="mr-2 h-4 w-4" />
                        JSON
                    </DropdownMenuItem>
                )}
                {formats.includes('pdf') && (
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
