import React, { useState } from 'react';
import LegalContent from '@/components/legal/LegalContent';

type LegalConsentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
};

export default function LegalConsentModal({ isOpen, onClose, onAccept }: LegalConsentModalProps) {
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    if (!isOpen) return null;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Tolerancia de 5px
        if (scrollHeight - scrollTop - clientHeight < 5) {
            setHasScrolledToBottom(true);
        }
    };

    const isAcceptEnabled = termsAccepted && privacyAccepted;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-4xl bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl border border-border-light dark:border-border-dark flex flex-col h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Termos e Condições</h2>
                        <p className="text-sm text-muted-light dark:text-muted-dark">Leia atentamente para continuar</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'terms'
                                ? 'border-primary text-primary bg-surface-light dark:bg-surface-dark'
                                : 'border-transparent text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        Termos de Uso
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-all border-b-2 ${activeTab === 'privacy'
                                ? 'border-primary text-primary bg-surface-light dark:bg-surface-dark'
                                : 'border-transparent text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        Política de Privacidade
                    </button>
                </div>

                {/* Content - Scroll Obrigatório */}
                <LegalContent activeTab={activeTab} onScroll={handleScroll} />

                {/* Warning SE não rolar */}
                {!hasScrolledToBottom && (
                    <div className="absolute bottom-[160px] left-0 right-0 py-2 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent pointer-events-none flex justify-center">
                        <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full animate-bounce">
                            Role até o fim para aceitar
                        </span>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-6 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-[#1a120b] shrink-0">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div className="flex flex-col gap-2">
                                <label className={`flex items-center gap-3 select-none ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        disabled={!hasScrolledToBottom}
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                                    />
                                    <span className="text-sm font-medium text-text-light dark:text-text-dark">
                                        Li e concordo com os Termos de Uso
                                    </span>
                                </label>
                                <label className={`flex items-center gap-3 select-none ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        disabled={!hasScrolledToBottom}
                                        checked={privacyAccepted}
                                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                                    />
                                    <span className="text-sm font-medium text-text-light dark:text-text-dark">
                                        Li e concordo com a Política de Privacidade
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={onClose}
                                    className="flex-1 sm:flex-none px-6 py-3 rounded-lg border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={onAccept}
                                    disabled={!isAcceptEnabled}
                                    className="flex-1 sm:flex-none px-8 py-3 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 
                                               disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                               hover:bg-orange-600 active:transform active:scale-95 transition-all"
                                >
                                    Aceitar e Cadastrar
                                </button>
                            </div>
                        </div>

                        {!isAcceptEnabled && hasScrolledToBottom && (
                            <p className="text-xs text-red-500 animate-pulse">
                                * É necessário marcar ambas as caixas para continuar.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
