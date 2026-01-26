/**
 * @file hooks/use-export.ts
 * @description Hook reutilizável para exportação de dados em múltiplos formatos
 */

import { useCallback } from 'react';

interface ExportOptions {
    filename?: string;
    title?: string;
}

export function useExport() {
    /**
     * Exporta dados para formato CSV
     */
    const exportToCSV = useCallback((data: any[], filename: string = 'export') => {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        // Extrair headers das chaves do primeiro objeto
        const headers = Object.keys(data[0]);

        // Criar linhas CSV
        const csvContent = [
            headers.join(','), // Header row
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escapar valores que contêm vírgulas ou aspas
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            )
        ].join('\n');

        // Criar blob e download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }, []);

    /**
     * Exporta dados para formato JSON
     */
    const exportToJSON = useCallback((data: any[], filename: string = 'export') => {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }, []);

    /**
     * Exporta dados para formato PDF (usando jsPDF)
     * Nota: Requer instalação de jspdf e jspdf-autotable
     */
    const exportToPDF = useCallback(async (
        data: any[],
        filename: string = 'export',
        options: ExportOptions = {}
    ) => {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        try {
            // Importação dinâmica para reduzir bundle size
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // Título do documento
            if (options.title) {
                doc.setFontSize(16);
                doc.text(options.title, 14, 20);
            }

            // Extrair headers e rows
            const headers = Object.keys(data[0]);
            const rows = data.map(row => headers.map(header => String(row[header] ?? '')));

            // Adicionar tabela usando autoTable
            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: options.title ? 30 : 20,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
                margin: { top: 20 }
            });

            // Footer com data de geração
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(
                    `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`,
                    14,
                    doc.internal.pageSize.height - 10
                );
            }

            // Download
            doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            // Fallback para JSON se PDF falhar
            exportToJSON(data, filename);
        }
    }, [exportToJSON]);

    return {
        exportToCSV,
        exportToJSON,
        exportToPDF
    };
}
