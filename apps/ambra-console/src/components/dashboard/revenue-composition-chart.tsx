/**
 * @file src/components/dashboard/revenue-composition-chart.tsx
 * @fileoverview Revenue composition chart component for the Nodum Console dashboard.
 * @description Displays a pie chart breaking down revenue by source (e.g., transaction fees vs. subscriptions).
 */
"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
// Mock data import removed


const chartConfig = {
  value: {
    label: "Receita",
  },
  "Taxas de Transação": {
    label: "Taxas de Transação",
    color: "hsl(var(--chart-1))",
  },
  "Subscrições": {
    label: "Subscrições",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export function RevenueCompositionChart({ data = [] }: { data?: any[] }) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Composição de Receita</CardTitle>
          <CardDescription className="text-xs">Dados insuficientes</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          Aguardando dados...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição de Receita</CardTitle>
        <CardDescription className="text-xs">Taxa de transação vs. Subscrições</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={2}
                  labelLine={false}
                  label={false}
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      // Calculate percentage relative to totalValue from parent scope
                      const percentage = totalValue > 0 ? ((data.value as number) / totalValue) * 100 : 0;

                      return (
                        <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl font-code">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.payload.fill }} />
                            <span className="font-medium text-foreground">{data.name}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-medium">{Number(data.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Share:</span>
                            <span className="font-medium">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex w-full flex-col gap-2 text-sm">
            <div className="font-medium text-muted-foreground">Legenda</div>
            <div className="grid gap-2">
              <div className="grid gap-2">
                {data.map((item) => {
                  const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full")} style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="font-medium font-code text-right">
                        <span>{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span className="text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
