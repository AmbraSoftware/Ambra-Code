
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ShieldAlert, TrendingUp } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface RiskMetrics {
    vgv: number
    buckets: {
        "0-7": number
        "8-15": number
        "16-30": number
        "30+": number
    }
    count: number
}

export function RiskDashboardWidget() {
    const [metrics, setMetrics] = useState<RiskMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const { data } = await api.get("/risk/metrics")
                setMetrics(data)
            } catch (error) {
                console.error("Failed to fetch risk metrics", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMetrics()
    }, [])

    if (isLoading) {
        return <Card className="h-[350px] animate-pulse bg-muted/20" />
    }

    if (!metrics) return null

    const chartData = [
        { name: "0-7 dias", value: metrics.buckets["0-7"] },
        { name: "8-15 dias", value: metrics.buckets["8-15"] },
        { name: "16-30 dias", value: metrics.buckets["16-30"] },
        { name: "30+ dias", value: metrics.buckets["30+"] },
    ]

    const criticalDebt = metrics.buckets["30+"]
    const hasCriticalRisk = criticalDebt > 0

    return (
        <Card className="col-span-4 border-red-200 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-lg font-bold text-red-900 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                        Sala de Guerra (Risco)
                    </CardTitle>
                    <CardDescription>Monitoramento de Crédito e Inadimplência</CardDescription>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(metrics.vgv)}</div>
                    <p className="text-xs text-muted-foreground">VGV Financiado (Total)</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    {hasCriticalRisk && (
                        <Alert variant="destructive" className="flex-1 bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Risco Crítico Detectado</AlertTitle>
                            <AlertDescription>
                                Existem <strong>{formatCurrency(criticalDebt)}</strong> em dívidas com mais de 30 dias. O bloqueio automático foi acionado para estas carteiras.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!hasCriticalRisk && (
                        <div className="flex-1 bg-green-50 p-4 rounded-lg flex items-center gap-3 border border-green-100">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-900">Carteira Saudável</p>
                                <p className="text-sm text-green-700">Nenhum cliente em inadimplência crítica (&gt; 30 dias).</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Valor
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                            {formatCurrency(Number(payload[0].value))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#dc2626"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
