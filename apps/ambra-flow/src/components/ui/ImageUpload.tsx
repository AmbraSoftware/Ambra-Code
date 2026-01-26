'use client';

import { useState, useRef } from 'react';
import { Button } from './Button';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    maxSize?: number; // MB
    className?: string;
}

export function ImageUpload({ value, onChange, maxSize = 2, className = '' }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | undefined>(value);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        // Validação de tipo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        // Validação de tamanho
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            alert(`A imagem deve ter no máximo ${maxSize}MB.`);
            return;
        }

        setIsUploading(true);

        try {
            // Para MVP: usar URL de dados (base64)
            // Em produção: fazer upload para servidor/S3
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setPreview(dataUrl);
                onChange(dataUrl);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Failed to upload image', error);
            alert('Erro ao carregar imagem.');
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = () => {
        setPreview(undefined);
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                Imagem do Produto
            </label>

            {preview ? (
                <div className="relative w-full h-48 rounded-lg border-2 border-border-light dark:border-border-dark overflow-hidden group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRemove}
                            icon="delete"
                        >
                            Remover
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-48 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-border-light dark:border-border-dark hover:border-primary/50'
                        }`}
                >
                    {isUploading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin text-primary text-4xl">
                                progress_activity
                            </span>
                            <p className="text-sm text-muted-light dark:text-muted-dark">Carregando...</p>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-muted-light dark:text-muted-dark text-4xl">
                                cloud_upload
                            </span>
                            <p className="text-sm text-muted-light dark:text-muted-dark">
                                Arraste uma imagem ou clique para selecionar
                            </p>
                            <p className="text-xs text-muted-light dark:text-muted-dark opacity-60">
                                Máximo {maxSize}MB
                            </p>
                        </>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                }}
            />
        </div>
    );
}
