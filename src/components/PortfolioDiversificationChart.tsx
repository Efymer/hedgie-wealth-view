import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatUSD, formatPercent } from "@/lib/format";

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
    "hsl(220, 70%, 60%)", // accent
    "hsl(120, 60%, 50%)", // success  
    "hsl(45, 100%, 60%)", // warning
    "hsl(0, 75%, 60%)", // destructive
    "hsl(280, 70%, 60%)", // purple
    "hsl(160, 70%, 50%)", // teal
    "hsl(30, 90%, 60%)", // orange
    "hsl(200, 80%, 60%)", // blue
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < baseColors.length) {
      colors.push(baseColors[i]);
    } else {
      // Generate additional colors using HSL
      const hue = (i * 137.5) % 360; // Golden angle approximation
      colors.push(`hsl(${hue}, 65%, 55%)`);
    }
  }
  return colors;
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      symbol: string;
      value: number;
      percentage: number;
    };
  }>;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card rounded-lg p-3 border border-border/50">
        <p className="font-semibold">{data.symbol}</p>
        <p className="text-sm text-muted-foreground">
          {formatUSD(data.value)} ({formatPercent(data.percentage)})
        </p>
      </div>
    );
  }
  return null;
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
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: 'hsl(var(--foreground))' }}>
                  {value} ({formatPercent((entry.payload as any)?.percentage || 0)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};