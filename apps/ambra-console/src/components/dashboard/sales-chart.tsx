"use client"

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CardContent } from "@/components/ui/card";

const chartConfig = {
  planos: { label: "Planos", color: "hsl(var(--chart-1))" },
  comissao: { label: "Comissão", color: "hsl(var(--chart-2))" },
};

const yAxisFormatter = (value: any) => `R$${Number(value) / 1000}k`;
const tooltipFormatter = (value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export function SalesChart({ data = [] }: { data?: any[] }) {
  const [view, setView] = useState<'weekly' | 'monthly'>('monthly');

  if (!data || data.length === 0) {
    return (
      <CardContent className="pl-2 h-[250px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="mb-2">Sem dados de vendas disponíveis.</p>
          <p className="text-xs">Aguardando transações reais...</p>
        </div>
      </CardContent>
    )
  }

  return (
    <CardContent className="pl-2">
      <div className="flex justify-end gap-2 mb-4 px-2">
        <button onClick={() => setView('weekly')} className={`text-xs px-2 py-1 rounded ${view === 'weekly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>7 Dias</button>
        <button onClick={() => setView('monthly')} className={`text-xs px-2 py-1 rounded ${view === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>6 Meses</button>
      </div>
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={view === 'weekly' ? data.slice(-2) : data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={yAxisFormatter} />
            <Tooltip cursor={true} content={<ChartTooltipContent formatter={tooltipFormatter} indicator="dot" />} wrapperClassName="font-code" />
            <Legend iconSize={10} verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="planos" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="comissao" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </CardContent>
  )
}
