import React, { useMemo } from "react";
import { PieChart as RePieChart, Pie, Cell } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatUSD, formatPercent } from "@/lib/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Token {
  id: string;
  symbol: string;
  name: string;
  usdValue: number;
}

interface PortfolioDiversificationChartProps {
  tokens: Token[];
  isLoading?: boolean;
}

// Generate colors using HSL values from our design system
const generateColors = (count: number): string[] => {
  const baseColors = [
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
    "hsl(280 70% 60%)",
    "hsl(160 70% 50%)",
    "hsl(30 90% 60%)",
    "hsl(200 80% 60%)",
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < baseColors.length) {
      colors.push(baseColors[i]);
    } else {
      const hue = (i * 137.5) % 360; // Golden angle approximation
      colors.push(`hsl(${hue} 65% 55%)`);
    }
  }
  return colors;
};


export const PortfolioDiversificationChart: React.FC<PortfolioDiversificationChartProps> = ({
  tokens,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    const totalValue = tokens.reduce((sum, token) => sum + token.usdValue, 0);
    
    if (totalValue === 0) return [];
    
    return tokens
      .filter(token => token.usdValue > 0.01)
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 10) // Show top 10 holdings
      .map(token => ({
        symbol: token.symbol,
        name: token.name,
        value: token.usdValue,
        percentage: (token.usdValue / totalValue) * 100,
      }));
  }, [tokens]);


  const colors = useMemo(() => generateColors(chartData.length), [chartData.length]);

  const chartConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    chartData.forEach((d, i) => {
      cfg[d.symbol] = {
        label: d.symbol,
        color: colors[i] ?? "hsl(var(--accent))",
      };
    });
    return cfg;
  }, [chartData, colors]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 w-full">
        <div className="flex items-center gap-2 mb-6">
          <PieChartIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Portfolio Diversification</h2>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="shimmer glass-card rounded-full w-48 h-48"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 w-full">
        <div className="flex items-center gap-2 mb-6">
          <PieChartIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Portfolio Diversification</h2>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <PieChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No holdings to display</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 w-full">
      <div className="flex items-center gap-2 mb-6">
        <PieChartIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Portfolio Diversification</h2>
        <span className="ml-auto text-sm text-muted-foreground">
          Top {chartData.length} holdings
        </span>
      </div>

      <ChartContainer config={chartConfig} className="h-80 w-full">
        <RePieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="symbol"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            paddingAngle={1.5}
            cornerRadius={2}
          >
            {chartData.map((d) => (
              <Cell
                key={d.symbol}
                fill={`var(--color-${d.symbol})`}
                stroke={`hsl(var(--background))`}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => {
                  const pct = (item?.payload as any)?.percentage ?? 0;
                  return [
                    `${formatUSD(Number(value))} (${formatPercent(pct)})`,
                    String(name),
                  ];
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent nameKey="symbol" />} />
        </RePieChart>
      </ChartContainer>
    </div>
  );
};