'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { financialService } from '@/services/financial.service';

interface RechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: { id: string; name: string; email: string } | null;
    onSuccess: () => void;
}

export function RechargeModal({ isOpen, onClose, user, onSuccess }: RechargeModalProps) {
    const [amount, setAmount] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRecharge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || amount <= 0) return;

        setIsSubmitting(true);
        try {
            await financialService.recharge(user.id, amount);
            onSuccess();
            onClose();
            setAmount(0);
        } catch (error) {
            console.error('Recharge failed', error);
            alert('Falha ao realizar recarga. Verifique se você tem permissão.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Recarga Manual de Saldo"
            size="sm"
        >
            <form onSubmit={handleRecharge} className="space-y-4">
                <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                    <p className="text-xs text-muted-light dark:text-muted-dark uppercase tracking-wider mb-1">Destinatário</p>
                    <p className="font-semibold text-text-light dark:text-text-dark">{user.name}</p>
                    <p className="text-sm text-muted-light dark:text-muted-dark">{user.email}</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-light dark:text-text-dark">Valor da Recarga</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark font-medium">R$</span>
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={amount || ''}
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            placeholder="0,00"
                            required
                            autoFocus
                        />
                    </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} disabled={amount <= 0}>
                        Confirmar Recarga
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
