'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, ArrowRight, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommercialHubPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hub Comercial"
        description="Configure preços, planos e taxas da plataforma Ambra."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Planos */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/commercial/plans')}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Planos de Assinatura</CardTitle>
                  <CardDescription className="mt-1">
                    Gerencie catálogo B2B (Escolas) e B2C (Famílias)
                  </CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure preços, limites de alunos e permissões por plano.
            </p>
          </CardContent>
        </Card>

        {/* Taxas */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/commercial/fees')}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Taxas de Recarga</CardTitle>
                  <CardDescription className="mt-1">
                    Configure custos de Cash-In (Boleto/PIX)
                  </CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Defina quem paga as taxas de recarga de carteira.
            </p>
          </CardContent>
        </Card>

        {/* Cupons */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/commercial/discounts')}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Tag className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Cupons de Desconto</CardTitle>
                  <CardDescription className="mt-1">
                    Gerencie códigos promocionais
                  </CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Crie cupons percentuais ou de valor fixo com validade.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
