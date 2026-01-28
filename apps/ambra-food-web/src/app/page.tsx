'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/MobileLayout';
import { walletAPI, type Wallet, type Transaction } from '@/lib/api';
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

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
      const [walletRes, transactionsRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions(5),
      ]);

      setWallet(walletRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Erro ao carregar carteira:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-6 space-y-6 safe-top">
        {/* Header */}
        <div>
          <p className="text-gray-500 text-sm">Olá,</p>
          <h1 className="text-2xl font-bold text-gray-900">{userName}</h1>
        </div>

        {/* Saldo Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5" />
              <span className="text-sm opacity-90">Saldo Disponível</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-5xl font-bold tracking-tight">
              {formatCurrency(wallet?.balance || 0)}
            </p>
          </div>

          {/* Status e Limites */}
          <div className="flex gap-4 text-sm opacity-90">
            <div>
              <p className="opacity-75">Limite Diário</p>
              <p className="font-semibold">{formatCurrency(wallet?.dailyLimit || 0)}</p>
            </div>
            <div>
              <p className="opacity-75">Crédito Disponível</p>
              <p className="font-semibold">{formatCurrency(wallet?.creditLimit || 0)}</p>
            </div>
          </div>

          {/* Alertas */}
          {wallet?.status === 'BLOCKED' && (
            <div className="mt-4 bg-red-500/20 backdrop-blur-sm border border-red-300 rounded-xl px-3 py-2">
              <p className="text-sm font-medium">⚠️ Carteira bloqueada. Entre em contato com a escola.</p>
            </div>
          )}

          {wallet && wallet.balance < 0 && (
            <div className="mt-4 bg-yellow-500/20 backdrop-blur-sm border border-yellow-300 rounded-xl px-3 py-2">
              <p className="text-sm font-medium">⚠️ Saldo negativo. Realize uma recarga.</p>
            </div>
          )}
        </div>

        {/* Ação Rápida */}
        <button
          onClick={() => router.push('/recharge')}
          className="btn-primary w-full text-lg"
        >
          💳 Recarregar Carteira
        </button>

        {/* Últimas Transações */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Últimas Transações</h2>

          {transactions.length === 0 ? (
            <div className="card-mobile text-center py-8">
              <p className="text-gray-500">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="card-mobile">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'CASH_IN'
                            ? 'bg-green-100'
                            : transaction.type === 'PURCHASE'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}
                      >
                        {transaction.type === 'CASH_IN' ? (
                          <ArrowDownCircle className="w-5 h-5 text-green-600" />
                        ) : transaction.type === 'PURCHASE' ? (
                          <ArrowUpCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <RefreshCw className="w-5 h-5 text-blue-600" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.type === 'CASH_IN'
                            ? 'text-green-600'
                            : transaction.type === 'PURCHASE'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {transaction.type === 'PURCHASE' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          transaction.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : transaction.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {transaction.status === 'COMPLETED'
                          ? 'Concluída'
                          : transaction.status === 'PENDING'
                          ? 'Pendente'
                          : 'Falhou'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
