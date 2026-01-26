"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FileText, Upload, Download, Eye, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    municipalityName: string;
    contractUrl?: string | null; // URL if exists
    onSave: (file: File) => void;
}

export function ContractDialog({
    open,
    onOpenChange,
    municipalityName,
    contractUrl,
    onSave,
}: ContractDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isEditMode, setIsEditMode] = useState(!contractUrl); // If no URL, start in edit/upload mode

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSave = () => {
        if (file) {
            onSave(file);
            setIsEditMode(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contrato: {municipalityName}
                    </DialogTitle>
                    <DialogDescription>
                        Gerencie o documento contratual deste município.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto border rounded-md bg-muted/20 p-4 flex items-center justify-center">
                    {!isEditMode && contractUrl ? (
                        <div className="w-full h-full flex flex-col items-center">
                            {/* Mock Viewer for PDF */}
                            <div className="w-full h-full bg-white dark:bg-zinc-900 border rounded shadow-sm p-8 text-center overflow-auto">
                                <p className="text-sm text-muted-foreground mb-4">Pré-visualização do Documento</p>
                                <div className="mx-auto w-32 h-44 bg-gray-100 border flex items-center justify-center mb-4">
                                    <FileText className="h-12 w-12 text-gray-400" />
                                </div>
                                <p className="font-medium text-lg mb-2">Contrato_Servicos_{municipalityName}.pdf</p>
                                <Badge variant="outline">Assinado Digitalmente</Badge>

                                <div className="mt-8 text-left max-w-md mx-auto space-y-2 text-xs text-muted-foreground font-mono">
                                    <p>CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS</p>
                                    <p>CLÁUSULA 1ª - DO OBJETO...</p>
                                    <p>O presente contrato tem como objeto a prestação de serviços de gestão de merenda escolar...</p>
                                    <p>[...]</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <Label htmlFor="contract-file" className="text-base font-medium cursor-pointer hover:underline text-primary">
                                    Clique para selecionar o PDF
                                </Label>
                                <Input
                                    id="contract-file"
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    {file ? `Selecionado: ${file.name}` : "Nenhum arquivo selecionado"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between items-center sm:justify-between">
                    <div className="flex gap-2">
                        {contractUrl && !isEditMode && (
                            <Button variant="outline" onClick={() => setIsEditMode(true)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Substituir
                            </Button>
                        )}
                        {contractUrl && (
                            <Button variant="secondary">
                                <Download className="mr-2 h-4 w-4" />
                                Baixar
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Fechar
                        </Button>
                        {isEditMode && (
                            <Button onClick={handleSave} disabled={!file}>
                                Salvar Documento
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
