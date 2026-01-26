
"use client"

import * as React from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// --- DADOS SIMULADOS ---

// Gera dados de carga do sistema para a última hora (a cada 5 minutos)
const generateLoadData = () => {
  const data = [];
  const now = new Date();
  for (let i = 12; i > 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      load: parseFloat((Math.random() * (0.8 - 0.2) + 0.2).toFixed(2)), // Carga entre 0.2 e 0.8
    });
  }
  return data;
};

const chartConfig = {
  load: {
    label: "Carga",
    color: "hsl(var(--chart-1))",
  },
};

export function SystemLoadChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    setChartData(generateLoadData());
  }, []);

  const averageLoad = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((acc, item) => acc + item.load, 0) / chartData.length;
  }, [chartData]);


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Carga do Sistema (1H)</CardTitle>
            <CardDescription>Média de utilização dos recursos na última hora.</CardDescription>
          </div>
          <div className="text-right">
             <div className="text-xs text-muted-foreground">AVG</div>
             <div className="font-bold font-code">{averageLoad > 0 ? averageLoad.toFixed(2) : "0.00"}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 1]}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                  wrapperClassName="font-code"
                />
                <Bar dataKey="load" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[200px] w-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Carregando dados do gráfico...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
