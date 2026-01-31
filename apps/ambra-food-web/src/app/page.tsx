'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, walletAPI, type Wallet, type Transaction as APITransaction } from '@/lib/api';
import { Transaction } from '@/types';
import { BalanceCard } from '@/components/ui/organisms/BalanceCard';
import { TransactionList } from '@/components/ui/organisms/TransactionList';
import { BottomNav } from '@/components/ui/organisms/BottomNav';
import { Button } from '@/components/ui/atoms/Button';
import { Bell, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se está autenticado
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setUserName(user.name || 'Usuário');

    loadWalletData();
  }, [router]);

  const loadWalletData = async () => {
    try {
      setApiError(null);
      const [walletRes, transactionsRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions(5),
      ]);

      setWallet(walletRes.data);

      // Converter transações da API para o tipo do Design System
      const mappedTransactions: Transaction[] = transactionsRes.data.map((t: APITransaction) => ({
        id: t.id,
        walletId: walletRes.data.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: new Date(t.createdAt),
        status: t.status,
      }));

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Erro ao carregar carteira:', error);
      setApiError(
        `Não foi possível conectar na API (${API_BASE_URL}). Verifique se o backend está rodando.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-light dark:bg-surface-dark">
        <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col">
      {/* TopAppBar */}
      <header className="flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between pt-8 safe-area-top">
        <div className="flex flex-col flex-1">
          <h2 className="text-text-primary dark:text-text-primary-dark text-xl font-bold leading-tight tracking-[-0.015em]">
            Olá, {userName}
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>
        <div className="flex w-12 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white dark:bg-surface-card-dark shadow-sm text-text-primary dark:text-white">
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-32">
        {/* Balance Card */}
        <BalanceCard
          balance={wallet?.balance || 0}
          dailyLimit={wallet?.dailyLimit || 0}
          credit={wallet?.creditLimit || 0}
          onRefresh={handleRefresh}
          loading={refreshing}
        />

        {apiError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">
              {apiError}
            </p>
            <div className="mt-3">
              <Button variant="secondary" onClick={handleRefresh}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {/* Alertas */}
        {wallet?.status === 'BLOCKED' && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">
              ⚠️ Carteira bloqueada. Entre em contato com a escola.
            </p>
          </div>
        )}

        {wallet && wallet.balance < 0 && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
            <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium">
              ⚠️ Saldo negativo. Realize uma recarga.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex mb-8">
          <Button
            className="w-full"
            onClick={() => router.push('/recharge')}
          >
            💳 Recarregar Carteira
          </Button>
        </div>

        {/* Transaction List */}
        {transactions.length === 0 ? (
          <div className="bg-white dark:bg-surface-card-dark rounded-xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma transação ainda</p>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onViewAll={() => router.push('/transactions')}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
