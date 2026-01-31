'use client';

import { HTMLAttributes, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

export function Dialog({
    open,
    onClose,
    title,
    description,
    children,
    className,
    ...props
}: DialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog Content */}
            <div
                className={cn(
                    'relative w-full max-w-lg bg-white dark:bg-surface-card-dark rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col',
                    className
                )}
                {...props}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                {title && (
                                    <h2 className="text-text-primary dark:text-white text-xl font-bold leading-tight">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="text-text-secondary dark:text-text-secondary-dark text-sm mt-1">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors tap-scale"
                            >
                                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
