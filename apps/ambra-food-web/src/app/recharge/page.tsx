'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/MobileLayout';
import { paymentAPI, type CashInFees } from '@/lib/api';
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';

// Matemática precisa (cents-based)
const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

export default function RechargePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [fees, setFees] = useState<CashInFees | null>(null);
  const [pixData, setPixData] = useState<{ code: string; qrCode: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Carregar taxas
    loadFees();
  }, [router]);

  const loadFees = async () => {
    try {
      const { data } = await paymentAPI.getFees();
      setFees(data);
    } catch (error) {
      console.error('Erro ao carregar taxas:', error);
    }
  };

  const calculateTotals = () => {
    const amountValue = parseFloat(amount) || 0;
    if (!fees || amountValue < 0.5) return null;

    // Trabalhar com centavos (inteiros) para precisão
    const amountCents = toCents(amountValue);
    const fixedFeeCents = toCents(fees.pix.customerFeeFixed);
    const percentFee = fees.pix.customerFeePercent;

    // Calcular taxa percentual em centavos
    const percentFeeCents = Math.round((amountCents * percentFee) / 100);

    // Total de taxas
    const totalFeesCents = fixedFeeCents + percentFeeCents;

    // Total a pagar
    const totalCents = amountCents + totalFeesCents;

    return {
      amount: fromCents(amountCents),
      fees: fromCents(totalFeesCents),
      total: fromCents(totalCents),
    };
  };

  const totals = calculateTotals();
  const quickValues = [1, 5, 10, 20, 50, 100];

  const handleQuickValue = (value: number) => {
    setAmount(value.toString());
  };

  const handleGeneratePix = async () => {
    if (!totals || totals.amount < 0.5) {
      alert('Valor mínimo: R$ 0,50');
      return;
    }

    setLoading(true);
    try {
      const { data } = await paymentAPI.createPixRecharge({
        amount: totals.amount,
        paymentMethod: 'pix',
      });

      setPixData({
        code: data.pixCode,
        qrCode: data.qrCode,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 safe-top">
        {/* Header */}
        <div className="bg-white border-b border-border sticky top-0 z-10">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Recarregar Carteira</h1>
          </div>
        </div>

        {!pixData ? (
          /* Formulário de Recarga */
          <div className="p-6 space-y-6">
            {/* Input de Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quanto você quer recarregar?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                  R$
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  step="0.01"
                  min="0.50"
                  className="w-full pl-16 pr-4 py-4 text-3xl font-bold border-2 border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Valor mínimo: R$ 0,50</p>
            </div>

            {/* Valores Rápidos */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Valores Rápidos</p>
              <div className="grid grid-cols-3 gap-2">
                {quickValues.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickValue(value)}
                    className="btn-secondary text-base"
                  >
                    R$ {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Recibo de Pré-Pagamento */}
            {totals && totals.amount >= 0.5 && (
              <div className="card-mobile bg-blue-50 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💰</span>
                  Recibo de Pré-Pagamento
                </h3>

                <div className="space-y-3">
                  {/* Crédito na Carteira */}
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">💳 Crédito na Carteira</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(totals.amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Valor que você poderá usar nas compras
                    </p>
                  </div>

                  {/* Taxa de Serviço */}
                  {totals.fees > 0 && (
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">📝 Taxa de Serviço PIX</p>
                      <p className="text-xl font-bold text-orange-600">
                        + {formatCurrency(totals.fees)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Custo da transação (não vai para carteira)
                      </p>
                    </div>
                  )}

                  {/* Separador */}
                  <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

                  {/* Total a Pagar */}
                  <div className="bg-primary/10 rounded-xl p-4 border-2 border-primary">
                    <p className="text-sm text-gray-700 font-medium mb-1">🏦 Total a Pagar no PIX</p>
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(totals.total)}
                    </p>
                  </div>

                  {/* Resumo */}
                  <div className="text-sm text-gray-600 space-y-1 pt-2">
                    <p>✅ Você paga <strong>{formatCurrency(totals.total)}</strong> no PIX</p>
                    <p>💰 Recebe <strong>{formatCurrency(totals.amount)}</strong> na carteira</p>
                    {totals.fees > 0 && <p>📝 Taxa: <strong>{formatCurrency(totals.fees)}</strong></p>}
                  </div>
                </div>
              </div>
            )}

            {/* Botão Gerar PIX */}
            <button
              onClick={handleGeneratePix}
              disabled={loading || !totals || totals.amount < 0.5}
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando...' : '🔐 Gerar Código PIX'}
            </button>
          </div>
        ) : (
          /* Tela do PIX Gerado */
          <div className="p-6 space-y-6">
            <div className="card-mobile text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">PIX Gerado!</h2>
                <p className="text-sm text-gray-600">
                  Pague <strong className="text-primary">{totals && formatCurrency(totals.total)}</strong> para receber{' '}
                  <strong className="text-green-600">{totals && formatCurrency(totals.amount)}</strong> na carteira
                </p>
              </div>

              {/* QR Code Placeholder */}
              <div className="bg-gray-100 w-64 h-64 mx-auto rounded-2xl flex items-center justify-center">
                <p className="text-gray-500 text-sm">QR Code PIX</p>
              </div>

              {/* Código Pix Copia e Cola */}
              <div>
                <p className="text-xs text-gray-600 mb-2 font-medium">Ou use o código Pix Copia e Cola:</p>
                <div className="bg-gray-50 border border-border rounded-xl p-3">
                  <p className="text-xs font-mono break-all text-gray-700 mb-3">{pixData.code}</p>
                  <button
                    onClick={handleCopyPix}
                    className={`btn-touch w-full ${
                      copied ? 'bg-green-500 text-white' : 'bg-primary text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 inline mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 inline mr-2" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instruções */}
              <div className="text-left bg-blue-50 rounded-xl p-4 text-sm text-gray-700 space-y-2">
                <p className="font-bold">📱 Como pagar:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Abra o app do seu banco</li>
                  <li>Vá em PIX → Copiar e Colar</li>
                  <li>Cole o código acima</li>
                  <li>Confirme o pagamento de {totals && formatCurrency(totals.total)}</li>
                </ol>
                <p className="text-xs text-gray-600 mt-3">
                  ⏱️ O saldo será creditado em até 1 minuto após o pagamento.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="btn-primary w-full"
              >
                Voltar para Carteira
              </button>

              <button
                onClick={() => {
                  setPixData(null);
                  setAmount('');
                }}
                className="btn-secondary w-full"
              >
                Nova Recarga
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
