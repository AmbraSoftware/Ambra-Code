import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wallet, ShoppingBag, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TransactionItemProps {
    transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
    const isPositive = transaction.type === 'CASH_IN';  // ✅ Alinhado com Backend

    const iconMap = {
        CASH_IN: <Wallet className="h-6 w-6" />,  // ✅ Alinhado
        PURCHASE: <ShoppingBag className="h-6 w-6" />,
        REFUND: <TrendingUp className="h-6 w-6" />,
        ADJUSTMENT: <TrendingUp className="h-6 w-6" />,  // ✅ Adicionado
    };

    const colorMap = {
        CASH_IN: 'text-green-600 bg-green-50 dark:bg-green-950/30',  // ✅ Alinhado
        PURCHASE: 'text-red-500 bg-red-50 dark:bg-red-950/30',
        REFUND: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
        ADJUSTMENT: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',  // ✅ Adicionado
    };

    return (
        <div className="flex items-center gap-4 bg-white dark:bg-surface-card-dark px-4 min-h-[80px] py-3 rounded-xl shadow-sm">
            <div className={cn(
                'flex items-center justify-center rounded-lg shrink-0 size-12',
                colorMap[transaction.type]
            )}>
                {iconMap[transaction.type]}
            </div>

            <div className="flex flex-col justify-center flex-1">
                <p className="text-text-primary dark:text-white text-base font-semibold leading-normal line-clamp-1">
                    {transaction.description}
                </p>
                <p className="text-text-secondary dark:text-text-secondary-dark text-xs font-normal leading-normal line-clamp-2">
                    {formatDate(transaction.createdAt)}
                </p>
            </div>

            <div className="shrink-0">
                <p className={cn(
                    'text-base font-bold leading-normal',
                    isPositive ? 'text-green-600' : 'text-text-primary dark:text-white'
                )}>
                    {isPositive ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </p>
            </div>
        </div>
    );
}

export interface TransactionListProps {
    transactions: Transaction[];
    onViewAll?: () => void;
}

export function TransactionList({ transactions, onViewAll }: TransactionListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1 pb-2">
                <h3 className="text-text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                    Últimas Transações
                </h3>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-brand-primary text-sm font-bold hover:underline"
                    >
                        Ver todas
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {transactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
            </div>
        </div>
    );
}
