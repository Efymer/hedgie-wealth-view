import React, { useMemo } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CounterpartyMapProps {
  accountId: string;
}

interface CounterpartyData {
  account: string;
  label: string;
  transactionCount: number;
  totalValue: number;
  type: "exchange" | "dapp" | "wallet" | "treasury";
}

export const CounterpartyMap: React.FC<CounterpartyMapProps> = ({ accountId }) => {

  // Mock data for counterparty relationships
  const mockCounterparties: CounterpartyData[] = useMemo(() => [
    // Exchanges / DEXs (tags)
    {
      account: "0.0.456858",
      label: "Binance",
      transactionCount: 120,
      totalValue: 2100000,
      type: "exchange",
    },
    {
      account: "0.0.731861",
      label: "SaucerSwap",
      transactionCount: 95,
      totalValue: 820000,
      type: "dapp",
    },
    {
      account: "0.0.882001",
      label: "HeliSwap",
      transactionCount: 52,
      totalValue: 360000,
      type: "dapp",
    },
    {
      account: "0.0.990077",
      label: "Pangolin",
      transactionCount: 38,
      totalValue: 245000,
      type: "dapp",
    },
    // User wallets (majority of items)
    {
      account: "0.0.123789",
      label: "0.0.123789",
      transactionCount: 80,
      totalValue: 340000,
      type: "wallet",
    },
    {
      account: "0.0.555777",
      label: "0.0.555777",
      transactionCount: 72,
      totalValue: 295000,
      type: "wallet",
    },
    {
      account: "0.0.111222",
      label: "0.0.111222",
      transactionCount: 61,
      totalValue: 210000,
      type: "wallet",
    },
    {
      account: "0.0.333444",
      label: "0.0.333444",
      transactionCount: 47,
      totalValue: 178000,
      type: "wallet",
    },
    {
      account: "0.0.777666",
      label: "0.0.777666",
      transactionCount: 39,
      totalValue: 152000,
      type: "wallet",
    },
    {
      account: "0.0.444555",
      label: "0.0.444555",
      transactionCount: 33,
      totalValue: 98000,
      type: "wallet",
    },
    {
      account: "0.0.248001",
      label: "0.0.248001",
      transactionCount: 27,
      totalValue: 76000,
      type: "wallet",
    },
    {
      account: "0.0.910010",
      label: "0.0.910010",
      transactionCount: 19,
      totalValue: 52000,
      type: "wallet",
    },
  ], []);

  // Transform data for Recharts Treemap
  const treemapData = useMemo(() => {
    return mockCounterparties.map((counterparty) => ({
      name: counterparty.label,
      size: counterparty.transactionCount, // use transaction count to size rectangles
      fill: getColorByType(counterparty.type),
      account: counterparty.account,
      totalValue: counterparty.totalValue,
      type: counterparty.type,
    }));
  }, [mockCounterparties]);

  function getColorByType(type: string): string {
    switch (type) {
      case "exchange":
        return "#3b82f6"; // blue
      case "dapp":
        return "#10b981"; // green
      case "wallet":
        return "#f59e0b"; // yellow
      case "treasury":
        return "#8b5cf6"; // purple
      default:
        return "#6b7280"; // gray
    }
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  interface CustomNodeProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    name?: string;
    size?: number;
    fill?: string;
  }

  const CustomizedNode = (props: CustomNodeProps) => {
    const {
      x = 0,
      y = 0,
      width = 0,
      height = 0,
      name = "",
      size = 0,
      fill = "#64748b",
    } = props;
    const minLabelWidth = 80;
    const minLabelHeight = 28;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="#ffffff"
          strokeWidth={2}
          opacity={0.9}
          rx={6}
          ry={6}
        />
        {width > minLabelWidth && height > minLabelHeight && (
          <>
            <text x={x + 8} y={y + 18} fill="#ffffff" fontSize={12} fontWeight={600}>
              {name}
            </text>
            <text x={x + 8} y={y + 36} fill="#ffffff" fontSize={11} opacity={0.9}>
              {size} txns
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Counterparty Network Map
            <Badge variant="secondary">{mockCounterparties.length} connections</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Accounts that {accountId} interacts with most frequently. Rectangle size represents transaction frequency.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                isAnimationActive={false}
                data={treemapData}
                dataKey="size"
                nameKey="name"
                stroke="#ffffff"
                fill="#8884d8"
                content={<CustomizedNode />}
              >
                <Tooltip />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Top Counterparties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockCounterparties.slice(0, 5).map((counterparty, index) => (
              <div key={counterparty.account} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{counterparty.label}</div>
                    <div className="text-sm text-muted-foreground">{counterparty.account}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{counterparty.transactionCount} txns</div>
                  <div className="text-sm text-muted-foreground">{formatValue(counterparty.totalValue)}</div>
                </div>
                <Badge 
                  variant="secondary" 
                  className="ml-2"
                  style={{ backgroundColor: `${getColorByType(counterparty.type)}20`, color: getColorByType(counterparty.type) }}
                >
                  {counterparty.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">DeFi/DApp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm">Treasury</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};