import { Card } from '@/components/ui/molecules/Card';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface BalanceCardProps {
    balance: number;
    dailyLimit: number;
    credit: number;
    onRefresh?: () => void;
    loading?: boolean;
}

export function BalanceCard({
    balance,
    dailyLimit,
    credit,
    onRefresh,
    loading = false,
}: BalanceCardProps) {
    return (
        <Card variant="gradient" padding="lg" className="relative overflow-hidden mb-6">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-white/80 text-sm font-medium">Saldo Disponível</p>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="text-white hover:scale-110 transition-transform disabled:opacity-50"
                        >
                            <RefreshCw
                                className={cn('h-5 w-5', loading && 'animate-spin')}
                            />
                        </button>
                    )}
                </div>

                <h1 className="text-5xl font-bold mb-6">
                    {formatCurrency(balance)}
                </h1>

                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-white/70 text-xs uppercase tracking-wider">
                            Limite Diário
                        </span>
                        <span className="text-sm font-semibold">
                            {formatCurrency(dailyLimit)}
                        </span>
                    </div>

                    <div className="w-[1px] h-8 bg-white/20" />

                    <div className="flex flex-col">
                        <span className="text-white/70 text-xs uppercase tracking-wider">
                            Crédito
                        </span>
                        <span className="text-sm font-semibold">
                            {formatCurrency(credit)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative circle */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </Card>
    );
}

// Importar cn
import { cn } from '@/lib/utils';
