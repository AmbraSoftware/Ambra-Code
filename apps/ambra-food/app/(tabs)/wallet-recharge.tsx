import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Clipboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, DollarSign, QrCode, Copy, CheckCircle, Receipt, Info, Percent, Crown } from 'lucide-react-native';
import { paymentAPI } from '../../services/api';
import type { PixRechargeResponse, CashInFees } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletRechargeScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFees, setLoadingFees] = useState(true);
  const [pixData, setPixData] = useState<PixRechargeResponse | null>(null);
  const [fees, setFees] = useState<CashInFees | null>(null);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState('');

  const normalizeFeeAmount = (rawFees: PixRechargeResponse['fees']): number | null => {
    if (typeof rawFees === 'number') return rawFees;
    if (rawFees && typeof rawFees === 'object' && typeof (rawFees as any).total === 'number') {
      return (rawFees as any).total;
    }
    return null;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Busca dados do usuário
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      }

      // Busca taxas de recarga
      const feesData = await paymentAPI.getCashInFees();
      setFees(feesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar as taxas de recarga.');
    } finally {
      setLoadingFees(false);
    }
  };

  const calculateTotal = (): number => {
    const value = parseFloat(amount) || 0;
    if (!fees) return value;

    const pixFee = fees.pix;
    let total = value;

    if (pixFee.chargeCustomer) {
      total += pixFee.customerFeeFixed;
      total += (value * pixFee.customerFeePercent) / 100;
    }

    return total;
  };

  const calculateFee = (): number => {
    const value = parseFloat(amount) || 0;
    if (!fees) return 0;

    const pixFee = fees.pix;
    let fee = 0;

    if (pixFee.chargeCustomer) {
      fee += pixFee.customerFeeFixed;
      fee += (value * pixFee.customerFeePercent) / 100;
    }

    return fee;
  };

  const getFinalTotals = () => {
    const inputAmount = parseFloat(amount) || 0;
    const backendGross = pixData?.grossAmount ?? pixData?.totalAmount;
    const backendFee = normalizeFeeAmount(pixData?.fees);

    const totalAmount = backendGross ?? calculateTotal();
    const feeAmount = backendFee ?? calculateFee();
    const creditAmount = inputAmount;
    const netAmount = pixData?.netAmount ?? creditAmount;

    return {
      totalAmount,
      feeAmount,
      creditAmount,
      netAmount,
    };
  };

  const handleGeneratePix = async () => {
    const value = parseFloat(amount);

    if (!value || value <= 0) {
      Alert.alert('Erro', 'Digite um valor válido para recarga.');
      return;
    }

    // Valor mínimo reduzido para testes (R$ 0,50)
    if (value < 0.50) {
      Alert.alert('Erro', 'O valor mínimo para recarga é R$ 0,50.');
      return;
    }

    if (value > 1000) {
      Alert.alert('Erro', 'O valor máximo para recarga é R$ 1.000,00.');
      return;
    }

    setLoading(true);
    try {
      // No MVP, o dependentId é o próprio userId (STUDENT recarga para si mesmo)
      // GUARDIAN recarga para o filho - isso seria implementado depois com seletor
      const pixResponse = await paymentAPI.createPixRecharge({
        dependentId: userId,
        amount: value,
      });

      setPixData(pixResponse);
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      const msg = error.response?.data?.message || 'Não foi possível gerar o código PIX. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.pixCopyPaste) {
      Clipboard.setString(pixData.pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('Sucesso', 'Código PIX copiado para a área de transferência!');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loadingFees) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text className="mt-4 text-gray-500">Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pixData) {
    const finalTotals = getFinalTotals();
    // Tela de PIX Gerado
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center py-4">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#212121" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 ml-4">PIX Gerado</Text>
          </View>

          {/* Success Icon */}
          <View className="items-center mt-6">
            <View className="bg-green-100 rounded-full p-6 mb-4">
              <CheckCircle size={64} color="#4CAF50" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(finalTotals.totalAmount)}
            </Text>
            <Text className="text-gray-500">Valor total a pagar</Text>
          </View>

          <View className="bg-white border border-gray-200 rounded-2xl p-5 mt-6">
            <View className="flex-row items-center mb-3">
              <Receipt size={18} color="#111827" />
              <Text className="ml-2 font-semibold text-gray-900">Resumo da operação</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Você paga</Text>
              <Text className="font-bold text-gray-900">{formatCurrency(finalTotals.totalAmount)}</Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-600">Crédito liberado</Text>
              <Text className="font-bold text-green-600">{formatCurrency(finalTotals.creditAmount)}</Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-600">Taxa</Text>
              <Text className="font-semibold text-gray-900">{formatCurrency(finalTotals.feeAmount)}</Text>
            </View>

            <View className="mt-3 bg-gray-50 rounded-xl p-3">
              <View className="flex-row items-start">
                <Info size={16} color="#6B7280" />
                <Text className="ml-2 text-xs text-gray-600 leading-4 flex-1">
                  A taxa é cobrada no pagamento e não vira saldo. Ela aparece aqui para facilitar auditoria e conferência.
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-gray-100 rounded-2xl p-8 items-center mt-6">
            {pixData.qrCode ? (
              <Image
                source={{ uri: `data:image/png;base64,${pixData.qrCode}` }}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
              />
            ) : (
              <QrCode size={200} color="#212121" />
            )}
            <Text className="text-gray-500 text-sm mt-4 text-center">
              Escaneie o QR Code acima com o app do seu banco
            </Text>
          </View>

          {/* Código Copiável */}
          <View className="mt-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Ou copie o código PIX:
            </Text>
            <TouchableOpacity
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center"
              onPress={handleCopyPix}
            >
              <Text className="flex-1 text-gray-600 text-xs" numberOfLines={1}>
                {pixData.pixCopyPaste}
              </Text>
              {copied ? (
                <CheckCircle size={20} color="#4CAF50" />
              ) : (
                <Copy size={20} color="#9E9E9E" />
              )}
            </TouchableOpacity>
          </View>

          {/* Instruções */}
          <View className="bg-blue-50 rounded-xl p-4 mt-6">
            <Text className="text-blue-900 font-semibold mb-2">
              Como pagar:
            </Text>
            <Text className="text-blue-800 text-sm leading-5">
              1. Abra o app do seu banco{'\n'}
              2. Escolha "Pagar com PIX"{'\n'}
              3. Escaneie o QR Code ou cole o código{'\n'}
              4. Confirme o pagamento{'\n'}
              5. Seu saldo será atualizado em até 1 minuto!
            </Text>
          </View>

          {/* Botão Voltar */}
          <TouchableOpacity
            className="bg-gray-100 py-4 rounded-xl items-center mt-6 mb-8"
            onPress={() => router.back()}
          >
            <Text className="text-gray-700 font-semibold">Voltar para Carteira</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Tela de Input de Valor
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#212121" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 ml-4">Recarregar Carteira</Text>
        </View>

        {/* Valor Input - DESTAQUE */}
        <View className="mt-8">
          <Text className="text-gray-500 text-sm mb-2">Quanto você quer recarregar?</Text>
          <View className="flex-row items-center bg-gray-50 border-2 border-primary rounded-2xl p-6">
            <DollarSign size={32} color="#4CAF50" />
            <TextInput
              className="flex-1 text-4xl font-bold text-gray-900 ml-2"
              placeholder="0,00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          <Text className="text-gray-400 text-xs mt-2">Mínimo: R$ 0,50 • Máximo: R$ 1.000,00</Text>
        </View>

        {/* Card de Simulação (Dinâmico) */}
        {parseFloat(amount) > 0 && (
          <View className="bg-white border border-gray-200 rounded-2xl p-5 mt-4">
            <View className="flex-row items-center mb-3">
              <Receipt size={18} color="#111827" />
              <Text className="ml-2 font-semibold text-gray-900">Simulação</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Valor do Crédito</Text>
              <Text className="font-bold text-gray-900">{formatCurrency(parseFloat(amount) || 0)}</Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-600">Taxa de Serviço</Text>
              <Text className="font-semibold text-gray-900">
                {formatCurrency(calculateFee() > 0 ? calculateFee() : 2.99)}
              </Text>
            </View>

            <View className="mt-2">
              <TouchableOpacity className="self-start" activeOpacity={0.8}>
                <Text className="text-xs text-gray-600">
                  Cansado de taxas? Seja Premium 👑 e isente-se.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Valores Rápidos - Incluindo valores de teste */}
        <View className="mt-6">
          <Text className="text-gray-700 text-sm font-semibold mb-3">Valores Rápidos:</Text>
          <View className="flex-row flex-wrap gap-3">
            {[1, 5, 10, 20, 50, 100].map((value) => (
              <TouchableOpacity
                key={value}
                className="bg-gray-100 px-6 py-3 rounded-xl active:bg-primary active:opacity-80"
                onPress={() => setAmount(value.toString())}
              >
                <Text className="text-gray-700 font-semibold">R$ {value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>



        {/* Botão Gerar PIX */}
        <TouchableOpacity
          className={`py-5 rounded-2xl items-center mt-8 mb-8 ${
            loading || parseFloat(amount) <= 0 ? 'bg-gray-300' : 'bg-secondary'
          }`}
          onPress={handleGeneratePix}
          disabled={loading || parseFloat(amount) <= 0}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-xl">Gerar Código PIX</Text>
              <Text className="text-white/80 text-sm mt-1">Pagamento instantâneo</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info sobre PIX */}
        <View className="bg-blue-50 rounded-xl p-4 mb-8">
          <View className="flex-row items-center mb-1">
            <Info size={16} color="#1E3A8A" />
            <Text className="text-blue-900 font-semibold ml-2">Seguro e rápido</Text>
          </View>
          <Text className="text-blue-800 text-sm">
            Pagamento via PIX é instantâneo e seguro. Seu saldo será atualizado automaticamente após a confirmação.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
