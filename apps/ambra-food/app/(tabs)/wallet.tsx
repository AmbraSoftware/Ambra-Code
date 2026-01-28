import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Clock, AlertCircle } from 'lucide-react-native';
import { walletAPI } from '../../services/api';
import type { Wallet, Transaction } from '../../types';
import { TransactionType } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  const loadWalletData = async () => {
    try {
      // Busca dados do usuário
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name.split(' ')[0]); // Primeiro nome apenas
      }

      // Busca carteira e transações em paralelo
      const [walletData, transactionsData] = await Promise.all([
        walletAPI.getMyWallet(),
        walletAPI.getMyTransactions(),
      ]);

      setWallet(walletData);
      setTransactions(transactionsData.slice(0, 5)); // Últimas 5 transações
    } catch (error: any) {
      console.error('Erro ao carregar dados da carteira:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados da carteira. Tente novamente.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWalletData();
  }, []);

  useEffect(() => {
    loadWalletData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.RECHARGE:
        return <ArrowUpCircle size={20} color="#4CAF50" />;
      case TransactionType.PURCHASE:
        return <ArrowDownCircle size={20} color="#FF5252" />;
      default:
        return <Clock size={20} color="#9E9E9E" />;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.RECHARGE:
        return 'Recarga';
      case TransactionType.PURCHASE:
        return 'Compra';
      case TransactionType.REFUND:
        return 'Estorno';
      case TransactionType.WITHDRAWAL:
        return 'Saque';
      default:
        return 'Transação';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text className="mt-4 text-gray-500">Carregando carteira...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-white px-6 pt-4 pb-6">
          <Text className="text-gray-500 text-sm">Olá, {userName}!</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">Minha Carteira</Text>
        </View>

        {/* Saldo Principal - BEM GRANDE */}
        <View className="bg-primary mx-6 mt-4 rounded-3xl p-8 shadow-lg">
          <View className="flex-row items-center mb-3">
            <WalletIcon size={24} color="white" />
            <Text className="text-white/80 text-sm ml-2 font-medium">Saldo Disponível</Text>
          </View>
          
          <Text className="text-white text-6xl font-bold mb-4">
            {wallet ? formatCurrency(wallet.balance) : 'R$ 0,00'}
          </Text>

          {/* Alerta de saldo negativo/bloqueio */}
          {wallet?.isDebtBlocked && (
            <View className="bg-red-500/20 rounded-xl p-3 flex-row items-center mt-2">
              <AlertCircle size={16} color="white" />
              <Text className="text-white text-xs ml-2 flex-1">
                Carteira bloqueada. Entre em contato com a escola.
              </Text>
            </View>
          )}

          {wallet?.negativeSince && !wallet.isDebtBlocked && (
            <View className="bg-yellow-500/20 rounded-xl p-3 flex-row items-center mt-2">
              <AlertCircle size={16} color="white" />
              <Text className="text-white text-xs ml-2 flex-1">
                Saldo negativo desde {formatDate(wallet.negativeSince)}
              </Text>
            </View>
          )}
        </View>

        {/* Botão de Recarga - DESTAQUE */}
        <View className="px-6 mt-6">
          <TouchableOpacity
            className="bg-secondary py-5 rounded-2xl items-center shadow-md active:opacity-80"
            onPress={() => router.push('/(tabs)/wallet-recharge')}
            disabled={wallet?.isDebtBlocked}
          >
            <Text className="text-white font-bold text-xl">
              💳 Recarregar Carteira
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              Via PIX - Instantâneo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Informações Adicionais */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-500 text-sm">Limite Diário</Text>
              <Text className="text-gray-900 font-semibold">
                {wallet ? formatCurrency(wallet.dailySpendLimit) : '-'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500 text-sm">Limite de Crédito</Text>
              <Text className="text-gray-900 font-semibold">
                {wallet ? formatCurrency(wallet.creditLimit) : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Últimas Transações */}
        <View className="px-6 mt-6 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Últimas Transações</Text>
          
          {transactions.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Clock size={48} color="#9E9E9E" />
              <Text className="text-gray-500 mt-3 text-center">
                Nenhuma transação ainda
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-2xl overflow-hidden">
              {transactions.map((transaction, index) => (
                <View
                  key={transaction.id}
                  className={`p-4 flex-row items-center ${
                    index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="mr-3">
                    {getTransactionIcon(transaction.type)}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      {getTransactionLabel(transaction.type)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                  <Text
                    className={`font-bold text-lg ${
                      transaction.type === TransactionType.RECHARGE
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === TransactionType.RECHARGE ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.netAmount))}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
