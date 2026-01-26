'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { usersService, CreateUserDto } from '@/services/users.service';

interface ImportUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: 'STUDENT' | 'GUARDIAN';
    onSuccess: () => void;
}

type Step = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'RESULT';

interface Mapping {
    dbField: keyof CreateUserDto;
    csvHeader: string;
}

const FIELD_LABELS: Record<string, string> = {
    name: 'Nome Completo',
    email: 'E-mail',
    taxId: 'CPF/TaxID',
    mobilePhone: 'Celular',
    password: 'Senha (Opcional)',
};

const REQUIRED_FIELDS = ['name', 'email'];

export function ImportUsersModal({ isOpen, onClose, role, onSuccess }: ImportUsersModalProps) {
    const [step, setStep] = useState<Step>('UPLOAD');
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importResult, setImportResult] = useState<{ created: number; errors: any[]; details: any[] } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const availableFields = role === 'STUDENT'
        ? ['name', 'email', 'password']
        : ['name', 'email', 'taxId', 'mobilePhone', 'password'];

    // HEURISTICS ENGINE (Zero Cost AI)
    const smartMapHeaders = (headers: string[]) => {
        const newMapping: Record<string, string> = {};
        const normalizedHeaders = headers.map(h => ({ original: h, normalized: h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") }));

        const synonyms: Record<string, string[]> = {
            name: ['nome', 'aluno', 'estudante', 'student', 'full name', 'responsavel', 'usuario'],
            email: ['email', 'e-mail', 'mail', 'correio', 'login'],
            taxId: ['cpf', 'doc', 'documento', 'tax_id', 'taxid'],
            mobilePhone: ['celular', 'telefone', 'phone', 'whatsapp', 'tel', 'mobile'],
            password: ['senha', 'password', 'pass']
        };

        availableFields.forEach(field => {
            const fieldSynonyms = synonyms[field] || [];
            // Find best match
            const match = normalizedHeaders.find(h =>
                fieldSynonyms.some(s => h.normalized.includes(s) || h.normalized === s)
            );
            if (match) {
                newMapping[field] = match.original;
            }
        });
        return newMapping;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const selectedFile = files[0];
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                const headers = results.meta.fields || [];
                setCsvHeaders(headers);
                setCsvData(results.data);
                const suggestedMapping = smartMapHeaders(headers);
                setMapping(suggestedMapping);
                setStep('MAPPING');
            },
            error: (err: any) => {
                alert('Erro ao ler CSV: ' + err.message);
            }
        });
    };

    const handleImport = async () => {
        setIsSubmitting(true);
        try {
            // Transform Data
            const usersToImport: CreateUserDto[] = csvData.map(row => {
                const user: any = { role };
                Object.entries(mapping).forEach(([dbField, csvHeader]) => {
                    if (csvHeader && row[csvHeader]) {
                        user[dbField] = row[csvHeader].trim();
                    }
                });
                // Defaults
                if (!user.password) user.password = 'Mudar123!'; // Default password
                return user as CreateUserDto;
            });

            // Filter valid users (basic check)
            const validUsers = usersToImport.filter(u => u.name && u.email);

            if (validUsers.length === 0) {
                alert('Nenhum usuário válido encontrado para importar.');
                setIsSubmitting(false);
                return;
            }

            const result = await usersService.bulkCreate({ users: validUsers });
            setImportResult(result);
            setStep('RESULT');
            if (result.created > 0) {
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao importar usuários.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setStep('UPLOAD');
        setFile(null);
        setCsvData([]);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const renderContent = () => {
        switch (step) {
            case 'UPLOAD':
                return (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
                        <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">upload_file</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                            Arraste seu arquivo CSV aqui ou clique para selecionar.<br />
                            <span className="text-xs text-gray-500">Formato recomendado: UTF-8</span>
                        </p>
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                            Selecionar Arquivo
                        </Button>
                        <div className="mt-4 text-xs text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => {
                            // Generate Template
                            const headers = availableFields.map(f => FIELD_LABELS[f]).join(',');
                            const blob = new Blob([headers], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `template_importacao_${role.toLowerCase()}.csv`;
                            a.click();
                        }}>
                            Baixar Modelo CSV Exemplo
                        </div>
                    </div>
                );

            case 'MAPPING':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Confirme o mapeamento das colunas do seu arquivo. O sistema tentou identificar automaticamente.
                        </p>
                        <div className="grid gap-3">
                            {availableFields.map(field => (
                                <div key={field} className="flex items-center gap-4">
                                    <div className="w-1/3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {FIELD_LABELS[field]} {REQUIRED_FIELDS.includes(field) && <span className="text-red-500">*</span>}
                                    </div>
                                    <div className="w-8 flex justify-center">
                                        <span className="material-symbols-outlined text-gray-400">arrow_right_alt</span>
                                    </div>
                                    <div className="flex-1">
                                        <select
                                            className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                                            value={mapping[field] || ''}
                                            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                                        >
                                            <option value="">Ignorar / Não Mapeado</option>
                                            {csvHeaders.map(header => (
                                                <option key={header} value={header}>{header}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={reset}>Voltar</Button>
                            <Button onClick={() => setStep('PREVIEW')} disabled={!mapping['name'] || !mapping['email']}>
                                Continuar
                            </Button>
                        </div>
                    </div>
                );

            case 'PREVIEW':
                const previewRows = csvData.slice(0, 5);
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Previsão da importação ({csvData.length} registros encontrados). Verifique os dados abaixo.
                        </p>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-zinc-800 text-xs uppercase">
                                    <tr>
                                        {availableFields.map(f => mapping[f] && <th key={f} className="px-3 py-2">{FIELD_LABELS[f]}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row, i) => (
                                        <tr key={i} className="border-t border-gray-200 dark:border-zinc-700">
                                            {availableFields.map(f => mapping[f] && <td key={f} className="px-3 py-2">{row[mapping[f]]}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={() => setStep('MAPPING')}>Voltar</Button>
                            <Button onClick={handleImport} isLoading={isSubmitting}>
                                Importar {csvData.length} Usuários
                            </Button>
                        </div>
                    </div>
                );

            case 'RESULT':
                if (!importResult) return null;
                const hasErrors = importResult.errors.length > 0;
                return (
                    <div className="text-center space-y-4">
                        <div className={`inline-flex p-3 rounded-full ${hasErrors ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            <span className="material-symbols-outlined text-4xl">
                                {hasErrors ? 'warning' : 'check_circle'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold">Processamento Concluído</h3>
                        <div className="grid grid-cols-2 gap-4 text-left max-w-xs mx-auto bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500">Sucessos</p>
                                <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Falhas</p>
                                <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                            </div>
                        </div>

                        {hasErrors && (
                            <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs text-left bg-red-50 dark:bg-red-900/10">
                                {importResult.errors.map((e, i) => (
                                    <div key={i} className="text-red-700 dark:text-red-400 mb-1">
                                        <b>{e.email}:</b> {e.error}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-center gap-3 pt-2">
                            {hasErrors && (
                                <Button variant="outline" onClick={() => {
                                    // Download Error Log
                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + ["Email,Erro"].join(",") + "\n"
                                        + importResult.errors.map(e => `${e.email},${e.error}`).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    window.open(encodedUri);
                                }}>
                                    Baixar Relatório de Erros
                                </Button>
                            )}
                            <Button onClick={() => { reset(); onClose(); }}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Importar ${role === 'STUDENT' ? 'Alunos' : 'Responsáveis'} (CSV)`}
            size="lg"
        >
            {renderContent()}
        </Modal>
    );
}
