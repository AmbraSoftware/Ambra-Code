'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, AlertCircle, Banknote, CreditCard, TrendingUp, TrendingDown, Building2, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PaymentMethodFee {
  gatewayCost: number; // Custo que pagamos ao gateway
  
  // Taxa ao Cliente (Pai/Responsável)
  chargeCustomer: boolean;
  customerFeeFixed: number;
  customerFeePercent: number;
  
  // Taxa ao Merchant (Escola)
  chargeMerchant: boolean;
  merchantFeeFixed: number;
  merchantFeePercent: number;
}

interface CashInFeeConfig {
  boleto: PaymentMethodFee;
  pix: PaymentMethodFee;
}

export default function FeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<CashInFeeConfig>({
    boleto: {
      gatewayCost: 3.49,
      chargeCustomer: true,
      customerFeeFixed: 4.00,
      customerFeePercent: 0,
      chargeMerchant: false,
      merchantFeeFixed: 0,
      merchantFeePercent: 2.5
    },
    pix: {
      gatewayCost: 0.99,
      chargeCustomer: true,
      customerFeeFixed: 2.00,
      customerFeePercent: 0,
      chargeMerchant: true,
      merchantFeeFixed: 0,
      merchantFeePercent: 1.5
    }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/global-admin/cash-in-fees', fees);
      toast({
        title: "Taxas atualizadas",
        description: "As configurações de taxas de recarga foram salvas com sucesso."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as taxas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCustomerFee = (method: 'boleto' | 'pix', amount: number) => {
    const config = fees[method];
    if (!config.chargeCustomer) return 0;
    
    const fixedFee = config.customerFeeFixed;
    const percentFee = (amount * config.customerFeePercent) / 100;
    return fixedFee + percentFee;
  };

  const calculateMerchantFee = (method: 'boleto' | 'pix', amount: number) => {
    const config = fees[method];
    if (!config.chargeMerchant) return 0;
    
    const fixedFee = config.merchantFeeFixed;
    const percentFee = (amount * config.merchantFeePercent) / 100;
    return fixedFee + percentFee;
  };

  const calculateSpread = (method: 'boleto' | 'pix', amount: number) => {
    const config = fees[method];
    const customerFee = calculateCustomerFee(method, amount);
    const merchantFee = calculateMerchantFee(method, amount);
    const totalRevenue = customerFee + merchantFee;
    const gatewayCost = config.gatewayCost;
    
    return totalRevenue - gatewayCost;
  };

  const renderMethodConfig = (method: 'boleto' | 'pix', icon: React.ReactNode, title: string) => {
    const config = fees[method];
    const spread = calculateSpread(method, 100);
    const isProfit = spread > 0;
    const customerFee = calculateCustomerFee(method, 100);
    const merchantFee = calculateMerchantFee(method, 100);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${method === 'boleto' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
              {icon}
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                Configuração de custos e taxas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GRUPO 1: Custo de Referência */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Grupo 1: Custo de Referência (Gateway)
            </p>
            <div className="space-y-2">
              <Label htmlFor={`${method}-gateway-cost`}>Custo Base do Gateway (R$)</Label>
              <Input
                id={`${method}-gateway-cost`}
                type="number"
                step="0.01"
                min="0"
                value={config.gatewayCost}
                onChange={(e) => setFees({
                  ...fees,
                  [method]: { ...config, gatewayCost: parseFloat(e.target.value) || 0 }
                })}
              />
              <p className="text-xs text-muted-foreground">
                Valor que pagamos ao Asaas por transação
              </p>
            </div>
          </div>

          <Separator />

          {/* GRUPO 2: Taxa ao Cliente */}
          <div className="space-y-4 p-4 border-2 border-orange-200 bg-orange-50/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                Grupo 2: Taxa ao Cliente (Pai/Responsável)
              </p>
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor={`${method}-charge-customer`}>
                  Cobrar Taxa do Cliente?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cliente paga taxa adicional ao fazer recarga
                </p>
              </div>
              <Switch
                id={`${method}-charge-customer`}
                checked={config.chargeCustomer}
                onCheckedChange={(checked) => setFees({
                  ...fees,
                  [method]: { ...config, chargeCustomer: checked }
                })}
              />
            </div>

            {config.chargeCustomer && (
              <>
                <Separator className="my-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${method}-customer-fixed`}>Taxa Fixa (R$)</Label>
                    <Input
                      id={`${method}-customer-fixed`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.customerFeeFixed}
                      onChange={(e) => setFees({
                        ...fees,
                        [method]: { ...config, customerFeeFixed: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${method}-customer-percent`}>Taxa Percentual (%)</Label>
                    <Input
                      id={`${method}-customer-percent`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={config.customerFeePercent}
                      onChange={(e) => setFees({
                        ...fees,
                        [method]: { ...config, customerFeePercent: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* GRUPO 3: Taxa ao Merchant */}
          <div className="space-y-4 p-4 border-2 border-purple-200 bg-purple-50/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Grupo 3: Taxa ao Merchant (Escola)
              </p>
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor={`${method}-charge-merchant`}>
                  Cobrar Taxa do Merchant?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Escola paga comissão sobre a recarga
                </p>
              </div>
              <Switch
                id={`${method}-charge-merchant`}
                checked={config.chargeMerchant}
                onCheckedChange={(checked) => setFees({
                  ...fees,
                  [method]: { ...config, chargeMerchant: checked }
                })}
              />
            </div>

            {config.chargeMerchant && (
              <>
                <Separator className="my-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${method}-merchant-fixed`}>Taxa Fixa (R$)</Label>
                    <Input
                      id={`${method}-merchant-fixed`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.merchantFeeFixed}
                      onChange={(e) => setFees({
                        ...fees,
                        [method]: { ...config, merchantFeeFixed: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${method}-merchant-percent`}>Taxa Percentual (%)</Label>
                    <Input
                      id={`${method}-merchant-percent`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={config.merchantFeePercent}
                      onChange={(e) => setFees({
                        ...fees,
                        [method]: { ...config, merchantFeePercent: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* GRUPO 4: Simulador de Rentabilidade */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Simulador de Rentabilidade</p>
              {isProfit ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">Cenário: Recarga de R$ 100,00</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-background rounded">
                <span className="text-muted-foreground">Cliente paga:</span>
                <span className="font-semibold">
                  R$ {(100 + customerFee).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-background rounded">
                <span className="text-muted-foreground">Crédito na carteira:</span>
                <span className="font-semibold text-green-600">
                  R$ 100,00
                </span>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-muted-foreground">Breakdown Financeiro:</p>
                
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-muted-foreground">Taxa Gateway (Custo):</span>
                  <span className="font-medium text-destructive">
                    -R$ {config.gatewayCost.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-muted-foreground">Taxa Cliente (Receita):</span>
                  <span className="font-medium text-orange-600">
                    +R$ {customerFee.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-muted-foreground">Taxa Merchant (Receita):</span>
                  <span className="font-medium text-purple-600">
                    +R$ {merchantFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <Separator className="my-2" />

              <div className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                isProfit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div>
                  <p className="text-xs text-muted-foreground">Spread da Plataforma</p>
                  <p className="text-xs font-medium mt-0.5">
                    {isProfit ? 'Lucro na transação' : spread === 0 ? 'Break-even' : 'Prejuízo absorvido'}
                  </p>
                </div>
                <span className={`text-xl font-bold ${
                  isProfit ? 'text-green-600' : spread === 0 ? 'text-muted-foreground' : 'text-destructive'
                }`}>
                  {spread >= 0 ? '+' : ''}R$ {spread.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/commercial')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Hub
        </Button>
      </div>

      <PageHeader
        title="Configuração de Taxas de Recarga (Cash-In)"
        description="Configure custos do gateway, taxas ao cliente e ao merchant. Visualize o spread total por transação."
      />

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sobre Spread de Taxas</AlertTitle>
        <AlertDescription>
          O <strong>Spread</strong> é a diferença entre a receita total (taxa cliente + taxa merchant) 
          e o custo do gateway. Um spread positivo representa lucro na recarga. 
          Um spread negativo significa que você está subsidiando o custo.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {renderMethodConfig(
          'boleto',
          <Banknote className="h-5 w-5 text-blue-600" />,
          'Boleto Bancário'
        )}
        {renderMethodConfig(
          'pix',
          <CreditCard className="h-5 w-5 text-green-600" />,
          'PIX'
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
