import React, { useMemo } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCounterpartyMap, type CounterpartyMapItem } from "@/queries";

interface CounterpartyMapProps {
  accountId: string;
}

// Data shape imported from queries as CounterpartyMapItem

export const CounterpartyMap: React.FC<CounterpartyMapProps> = ({ accountId }) => {
  const { data, isLoading, isError } = useCounterpartyMap(accountId, 1000);

  const counterparties: CounterpartyMapItem[] = useMemo(
    () => data?.data ?? [],
    [data?.data]
  );

  // Transform data for Recharts Treemap
  const treemapData = useMemo(() => {
    return counterparties.map((counterparty) => ({
      name: counterparty.label,
      size: counterparty.transactionCount, // use transaction count to size rectangles
      fill: getColorByType(counterparty.type),
      account: counterparty.account,
      type: counterparty.type,
    }));
  }, [counterparties]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Counterparty Network Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Counterparty Network Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-destructive">
            Failed to load data
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // No pricing/amount formatting needed anymore; we only display transaction counts.

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
            <text
              x={x + 8}
              y={y + 18}
              fill="#ffffff"
              fontSize={12}
              fontWeight={600}
            >
              {name}
            </text>
            <text
              x={x + 8}
              y={y + 36}
              fill="#ffffff"
              fontSize={11}
              opacity={0.9}
            >
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
            <Badge variant="secondary">
              {counterparties.length} connections
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Accounts that {accountId} interacts with most frequently. Rectangle
            size represents transaction frequency.
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
            {counterparties.slice(0, 5).map((counterparty, index) => (
              <div
                key={counterparty.account}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{counterparty.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {counterparty.account}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {counterparty.transactionCount} txns
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="ml-2"
                  style={{
                    backgroundColor: `${getColorByType(counterparty.type)}20`,
                    color: getColorByType(counterparty.type),
                  }}
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
