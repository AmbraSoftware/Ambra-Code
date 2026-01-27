import React from 'react';
import { useRouter } from 'next/navigation';

type PendingActivationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    profileType?: 'school' | 'operator';
};

export default function PendingActivationModal({ isOpen, onClose, profileType = 'school' }: PendingActivationModalProps) {
    const router = useRouter();
    if (!isOpen) return null;

    const isOperator = profileType === 'operator';

    const handleAction = () => {
        if (isOperator) {
            router.push('/login');
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="fixed inset-0 bg-background-dark/60 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true"></div>
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-border-light dark:border-border-dark animate-in fade-in zoom-in-95 duration-200">
                    {/* Header Color Bar */}
                    <div className={`h-2 w-full ${isOperator ? 'bg-green-500' : 'bg-primary'}`}></div>
                    
                    <div className="px-6 pb-6 pt-8 sm:p-8 sm:pb-6">
                        <div className="flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className={`mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full mb-5 ${isOperator ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary/10'}`}>
                                <span className={`material-symbols-outlined text-4xl ${isOperator ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                                    {isOperator ? 'storefront' : 'check_circle'}
                                </span>
                            </div>

                            <div className="mt-2">
                                <h3 className="text-2xl font-bold leading-tight text-text-light dark:text-text-dark" id="modal-title">
                                    {isOperator ? 'Conta Criada!' : 'Cadastro Efetuado!'}
                                </h3>

                                {isOperator ? (
                                    /* FLUXO OPERADOR (Canteen School Choice) */
                                    <>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1 mb-4 uppercase tracking-wide">
                                            Pronto para Começar
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                                            Sua cantina foi registrada com sucesso. Para iniciar as vendas, você precisará <strong>vincular sua conta a uma escola</strong> no próximo passo.
                                        </p>
                                        
                                        <div className="bg-surface-light dark:bg-black/20 rounded-lg p-4 text-left border border-border-light dark:border-border-dark flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <span className="material-symbols-outlined text-primary text-sm">school</span>
                                                </div>
                                                <div className="text-sm text-text-light dark:text-text-dark font-medium">
                                                    Escolha sua Escola
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 ml-11">
                                                Ao acessar o painel, selecione a escola onde sua cantina opera para sincronizar alunos e turmas.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    /* FLUXO ESCOLA (Pendente) */
                                    <>
                                        <p className="text-sm font-medium text-primary mt-1 mb-4 uppercase tracking-wide">
                                            Aguardando Ativação
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            Sua conta foi criada e está pendente de aprovação pelo administrador. Você será notificado por e-mail quando estiver ativa.
                                        </p>
                                        <div className="mt-6 bg-background-light dark:bg-black/20 rounded-lg p-3 text-left border border-border-light dark:border-border-dark flex items-start gap-3">
                                            <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">info</span>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                <span className="block font-bold text-text-light dark:text-text-dark mb-0.5">Prazo estimado</span>
                                                Nossa equipe analisa novos cadastros em até <span className="font-medium">24 horas úteis</span>.
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse bg-gray-50 dark:bg-black/10 border-t border-border-light dark:border-border-dark">
                        <button
                            type="button"
                            onClick={handleAction}
                            className={`inline-flex w-full justify-center rounded-lg px-3 py-2.5 text-sm font-bold text-white shadow-sm sm:w-auto transition-colors cursor-pointer ${
                                isOperator 
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none' 
                                    : 'bg-primary hover:bg-primary-hover'
                            }`}
                        >
                            {isOperator ? 'Acessar e Vincular' : 'Entendi'}
                            {isOperator && <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
