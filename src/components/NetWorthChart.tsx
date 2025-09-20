import React from "react";
import { TrendingUp, DollarSign, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NetWorthData {
  date: string;
  value: number;
  change: number;
}

interface NetWorthChartProps {
  data?: NetWorthData[];
  accountId?: string;
}

const mockNetWorthData: NetWorthData[] = [
  { date: "2024-01-01", value: 4200, change: 0 },
  { date: "2024-01-02", value: 4350, change: 3.57 },
  { date: "2024-01-03", value: 4180, change: -3.91 },
  { date: "2024-01-04", value: 4420, change: 5.74 },
  { date: "2024-01-05", value: 4680, change: 5.88 },
  { date: "2024-01-06", value: 4520, change: -3.42 },
  { date: "2024-01-07", value: 4750, change: 5.09 },
  { date: "2024-01-08", value: 4890, change: 2.95 },
  { date: "2024-01-09", value: 4720, change: -3.48 },
  { date: "2024-01-10", value: 4965, change: 5.19 },
  { date: "2024-01-11", value: 5120, change: 3.12 },
  { date: "2024-01-12", value: 5080, change: -0.78 },
  { date: "2024-01-13", value: 5240, change: 3.15 },
  { date: "2024-01-14", value: 5185, change: -1.05 },
  { date: "2024-01-15", value: 5350, change: 3.18 },
];

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ 
  data = mockNetWorthData,
  accountId,
}) => {
  const navigate = useNavigate();
  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data.length >= 2 ? (data[data.length - 2]?.value || 0) : 0;
  const hasBaseline = data.length >= 2 && previousValue !== 0;
  const totalChange = hasBaseline ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  const totalChangeAmount = hasBaseline ? (currentValue - previousValue) : 0;

  // Calculate 7-day and 30-day changes
  const calculatePeriodChange = (days: number) => {
    if (data.length === 0) return { change: 0, amount: 0, hasData: false };
    
    const currentIndex = data.length - 1;
    const pastIndex = Math.max(0, currentIndex - days);
    
    if (pastIndex === currentIndex || data[pastIndex].value === 0) {
      return { change: 0, amount: 0, hasData: false };
    }
    
    const currentVal = data[currentIndex].value;
    const pastVal = data[pastIndex].value;
    const change = ((currentVal - pastVal) / pastVal) * 100;
    const amount = currentVal - pastVal;
    
    return { change, amount, hasData: true };
  };

  const sevenDayChange = calculatePeriodChange(7);
  const thirtyDayChange = calculatePeriodChange(Math.min(30, data.length - 1));

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card rounded-lg p-3 border border-border/50">
          <p className="text-sm font-medium">{formatDate(label)}</p>
          <p className="text-lg font-bold text-primary">
            {formatValue(data.value)}
          </p>
          <p className={`text-xs ${
            data.change >= 0 ? 'text-success' : 'text-destructive'
          }`}>
            {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const hideOverlayAccounts = new Set(["0.0.756953", "0.0.1050322"]);
  const showOverlay = !(accountId && hideOverlayAccounts.has(accountId));

  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto relative">
      {/* Waitlist Feature Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold gradient-text">Waitlist Feature</h3>
              <p className="text-muted-foreground">Net worth tracking is available for waitlist members</p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/waitlist')}
                className="px-6 py-2"
              >
                Join Waitlist
              </Button>
              <p className="text-xs text-muted-foreground">Get exclusive access to premium features</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Net Worth Over Time</h2>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 24h Change */}
          <div className="glass-card rounded-lg p-4 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${
                hasBaseline ? (totalChange >= 0 ? 'text-success' : 'text-destructive') : 'text-muted-foreground'
              }`} />
              <span className="text-sm font-medium text-muted-foreground">24h Change</span>
            </div>
            <div className="flex items-center gap-2">
              {hasBaseline ? (
                <>
                  <p className={`text-xl font-bold ${
                    totalChange >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
                  </p>
                  <p className={`text-xs ${
                    totalChange >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    ({totalChange >= 0 ? '+' : ''}{formatValue(totalChangeAmount)})
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground">(no data)</p>
                </>
              )}
            </div>
          </div>

          {/* 7-day Change */}
          <div className="glass-card rounded-lg p-4 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${
                sevenDayChange.hasData ? (sevenDayChange.change >= 0 ? 'text-success' : 'text-destructive') : 'text-muted-foreground'
              }`} />
              <span className="text-sm font-medium text-muted-foreground">7d Change</span>
            </div>
            <div className="flex items-center gap-2">
              {sevenDayChange.hasData ? (
                <>
                  <p className={`text-xl font-bold ${
                    sevenDayChange.change >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {sevenDayChange.change >= 0 ? '+' : ''}{sevenDayChange.change.toFixed(2)}%
                  </p>
                  <p className={`text-xs ${
                    sevenDayChange.change >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    ({sevenDayChange.change >= 0 ? '+' : ''}{formatValue(sevenDayChange.amount)})
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground">(no data)</p>
                </>
              )}
            </div>
          </div>

          {/* 30-day Change */}
          <div className="glass-card rounded-lg p-4 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${
                thirtyDayChange.hasData ? (thirtyDayChange.change >= 0 ? 'text-success' : 'text-destructive') : 'text-muted-foreground'
              }`} />
              <span className="text-sm font-medium text-muted-foreground">30d Change</span>
            </div>
            <div className="flex items-center gap-2">
              {thirtyDayChange.hasData ? (
                <>
                  <p className={`text-xl font-bold ${
                    thirtyDayChange.change >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {thirtyDayChange.change >= 0 ? '+' : ''}{thirtyDayChange.change.toFixed(2)}%
                  </p>
                  <p className={`text-xs ${
                    thirtyDayChange.change >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    ({thirtyDayChange.change >= 0 ? '+' : ''}{formatValue(thirtyDayChange.amount)})
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground">(no data)</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};