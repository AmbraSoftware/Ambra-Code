'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentAPI } from '@/lib/api';
import { Button } from '@/components/ui/atoms/Button';
import { Card } from '@/components/ui/molecules/Card';
import { Badge } from '@/components/ui/atoms/Badge';
import { BottomNav } from '@/components/ui/organisms/BottomNav';
import { ArrowLeft, Copy, CheckCircle2, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Matemática precisa (cents-based)
const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

const DEFAULT_PIX_FEE = 2.99;

export default function RechargePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [pixData, setPixData] = useState<{
    code: string;
    qrCode: string;
    creditAmount: number;
    totalAmount: number;
    feeAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const calculateTotals = () => {
    const amountValue = parseFloat(amount) || 0;
    if (amountValue < 0.5) return null;

    // Trabalhar com centavos (inteiros) para precisão
    const amountCents = toCents(amountValue);
    // MVP Web: endpoint de fees é SUPER_ADMIN. Para evitar recibo "Taxa 0",
    // usamos uma estimativa segura (fallback) até termos endpoint público por plano.
    const totalFeesCents = toCents(DEFAULT_PIX_FEE);
    const totalCents = amountCents + totalFeesCents;

    return {
      amount: fromCents(amountCents),
      fees: fromCents(totalFeesCents),
      total: fromCents(totalCents),
    };
  };

  const totalsFromBackend = pixData
    ? {
        amount: pixData.creditAmount,
        fees: pixData.feeAmount,
        total: pixData.totalAmount,
      }
    : null;

  const totals = calculateTotals();
  const quickValues = [1, 5, 10, 20, 50, 100];

  const handleQuickValue = (value: number) => {
    setAmount(value.toString());
  };

  const handleGeneratePix = async () => {
    if (!totals || totals.amount < 0.5) {
      setError('Valor mínimo: R$ 0,50');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const dependentId = user?.id as string | undefined;

      if (!dependentId) {
        setError('Usuário não encontrado. Faça login novamente.');
        window.location.href = '/login';
        return;
      }

      const { data } = await paymentAPI.createPixRecharge({
        dependentId,
        amount: totals.amount,
      });

      const creditAmount = typeof data.netAmount === 'number' ? data.netAmount : totals.amount;
      const totalAmount = typeof data.totalAmount === 'number'
        ? data.totalAmount
        : (typeof data.grossAmount === 'number' ? data.grossAmount : creditAmount);
      const feeAmount = typeof data.fees === 'number'
        ? data.fees
        : Math.max(0, Number((totalAmount - creditAmount).toFixed(2)));

      setPixData({
        code: data.pixCopyPaste || data.pixCode,
        qrCode: data.qrCode,
        creditAmount,
        totalAmount,
        feeAmount,
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Não foi possível gerar o PIX. Tente novamente.');
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

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-surface-light/80 dark:bg-surface-dark/80 ios-blur border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="text-brand-primary flex size-10 shrink-0 items-center justify-center cursor-pointer tap-scale"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-text-primary dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
            Recarregar Carteira
          </h2>
        </div>
      </header>

      {!pixData ? (
        /* Formulário de Recarga */
        <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Input de Valor */}
          <div className="mb-6">
            <label className="block text-text-primary dark:text-white text-sm font-medium mb-2">
              Quanto você quer recarregar?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 dark:text-gray-500">
                R$
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                step="0.01"
                min="0.50"
                className="w-full pl-16 pr-4 py-4 text-3xl font-bold border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-text-primary dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Valor mínimo: R$ 0,50</p>
          </div>

          {/* Valores Rápidos */}
          <div className="mb-8">
            <p className="text-text-primary dark:text-white text-sm font-medium mb-3">Valores Rápidos</p>
            <div className="grid grid-cols-3 gap-2">
              {quickValues.map((value) => (
                <button
                  key={value}
                  onClick={() => handleQuickValue(value)}
                  className="h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors tap-scale font-semibold"
                >
                  R$ {value}
                </button>
              ))}
            </div>
          </div>

          {/* Recibo de Pré-Pagamento */}
          {totals && totals.amount >= 0.5 && (
            <Card variant="default" padding="none" className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <div className="p-4 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-blue-900 dark:text-blue-200 text-base font-bold">
                    Recibo de Pré-Pagamento
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Crédito na Carteira */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">💳 Crédito na Carteira</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totals.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Valor que você poderá usar nas compras
                  </p>
                </div>

                {/* Taxa de Serviço */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">📝 Taxa de Serviço PIX</p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {totals.fees > 0 ? `+ ${formatCurrency(totals.fees)}` : formatCurrency(0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Custo da transação (não vai para carteira)
                  </p>
                </div>

                {/* Separador */}
                <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-4"></div>

                {/* Total a Pagar */}
                <div className="bg-brand-primary/10 dark:bg-brand-primary/20 rounded-xl p-4 border-2 border-brand-primary">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">🏦 Total a Pagar no PIX</p>
                  <p className="text-4xl font-bold text-brand-primary">
                    {formatCurrency(totals.total)}
                  </p>
                </div>

                {/* Resumo */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pt-2">
                  <p>✅ Você paga <strong>{formatCurrency(totals.total)}</strong> no PIX</p>
                  <p>💰 Recebe <strong>{formatCurrency(totals.amount)}</strong> na carteira</p>
                  <p>📝 Taxa: <strong>{formatCurrency(totals.fees)}</strong></p>
                </div>
              </div>
            </Card>
          )}

          {/* Botão Gerar PIX */}
          <Button
            onClick={handleGeneratePix}
            disabled={loading || !totals || totals.amount < 0.5}
            loading={loading}
            className="w-full"
          >
            🔐 Gerar Código PIX
          </Button>
        </main>
      ) : (
        /* Tela do PIX Gerado */
        <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
          <Card variant="default" padding="lg" className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary dark:text-white mb-1">PIX Gerado!</h2>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                Pague <strong className="text-brand-primary">{totalsFromBackend && formatCurrency(totalsFromBackend.total)}</strong> para receber{' '}
                <strong className="text-green-600 dark:text-green-400">{totalsFromBackend && formatCurrency(totalsFromBackend.amount)}</strong> na carteira
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-gray-100 dark:bg-gray-800 w-64 h-64 mx-auto rounded-2xl flex items-center justify-center overflow-hidden">
              <img
                src={`data:image/png;base64,${pixData.qrCode}`}
                alt="QR Code PIX"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Código Pix Copia e Cola */}
            <div>
              <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-2 font-medium">
                Ou use o código Pix Copia e Cola:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <p className="text-xs font-mono break-all text-text-primary dark:text-white mb-3">
                  {pixData.code}
                </p>
                <Button
                  onClick={handleCopyPix}
                  variant={copied ? 'secondary' : 'primary'}
                  className="w-full"
                  icon={copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 w-5" />}
                >
                  {copied ? 'Copiado!' : 'Copiar Código'}
                </Button>
              </div>
            </div>

            {/* Instruções */}
            <Card variant="default" padding="md" className="text-left bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <p className="font-bold text-text-primary dark:text-white mb-2">📱 Como pagar:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary dark:text-text-secondary-dark">
                <li>Abra o app do seu banco</li>
                <li>Vá em PIX → Copiar e Colar</li>
                <li>Cole o código acima</li>
                <li>Confirme o pagamento de {totalsFromBackend && formatCurrency(totalsFromBackend.total)}</li>
              </ol>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                ⏱️ O saldo será creditado em até 1 minuto após o pagamento.
              </p>
            </Card>
          </Card>

          {/* Botões */}
          <div className="space-y-3 mt-6">
            <Button onClick={() => router.push('/')} className="w-full">
              Voltar para Carteira
            </Button>

            <Button
              onClick={() => {
                setPixData(null);
                setAmount('');
              }}
              variant="secondary"
              className="w-full"
            >
              Nova Recarga
            </Button>
          </div>
        </main>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
