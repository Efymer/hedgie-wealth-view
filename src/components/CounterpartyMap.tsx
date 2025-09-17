import React, { useMemo } from "react";
import { BubbleChart } from "react-bubble-chart";
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
    {
      account: "0.0.456858",
      label: "Binance",
      transactionCount: 156,
      totalValue: 2450000,
      type: "exchange"
    },
    {
      account: "0.0.731861",
      label: "SaucerSwap",
      transactionCount: 89,
      totalValue: 890000,
      type: "dapp"
    },
    {
      account: "0.0.123789",
      label: "HashPack Wallet",
      transactionCount: 67,
      totalValue: 340000,
      type: "wallet"
    },
    {
      account: "0.0.800001",
      label: "Hedera Treasury",
      transactionCount: 45,
      totalValue: 1200000,
      type: "treasury"
    },
    {
      account: "0.0.999888",
      label: "DeFi Protocol",
      transactionCount: 34,
      totalValue: 567000,
      type: "dapp"
    },
    {
      account: "0.0.555777",
      label: "Trading Bot",
      transactionCount: 28,
      totalValue: 234000,
      type: "wallet"
    },
    {
      account: "0.0.333444",
      label: "Staking Pool",
      transactionCount: 22,
      totalValue: 189000,
      type: "dapp"
    },
    {
      account: "0.0.111222",
      label: "OTC Trader",
      transactionCount: 18,
      totalValue: 156000,
      type: "wallet"
    },
    {
      account: "0.0.777666",
      label: "Liquidity Pool",
      transactionCount: 15,
      totalValue: 123000,
      type: "dapp"
    },
    {
      account: "0.0.444555",
      label: "Corporate Account",
      transactionCount: 12,
      totalValue: 89000,
      type: "treasury"
    },
  ], []);

  const bubbleData = useMemo(() => {
    return mockCounterparties.map((counterparty, index) => ({
      label: counterparty.label,
      value: counterparty.transactionCount,
      color: getColorByType(counterparty.type),
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

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Counterparty Network Map
            <Badge variant="secondary">{mockCounterparties.length} connections</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Accounts that {accountId} interacts with most frequently. Bubble size represents transaction frequency.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <BubbleChart
              data={bubbleData}
              width={600}
              height={350}
              bubbleClickFun={(data: any) => {
                console.log("Clicked bubble:", data);
                // Could navigate to that account or show more details
              }}
              valueFont={{
                family: 'Arial',
                size: 12,
                color: '#fff',
                weight: 'bold',
              }}
              labelFont={{
                family: 'Arial',
                size: 10,
                color: '#fff',
                weight: 'normal',
              }}
            />
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