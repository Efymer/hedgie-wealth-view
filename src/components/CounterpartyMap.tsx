import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
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

  const summary = useMemo(() => data?.meta?.summary, [data?.meta?.summary]);

  const [hoveredNode, setHoveredNode] = useState<CounterpartyMapItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>();

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

  interface GraphNode {
    id: string;
    name: string;
    val: number;
    color: string;
    data: CounterpartyMapItem;
    x?: number;
    y?: number;
  }

  interface GraphLink {
    source: string;
    target: string;
  }

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [
      {
        id: accountId,
        name: "You",
        val: 40,
        color: "#8b5cf6",
        data: {
          account: accountId,
          label: "You",
          sentCount: 0,
          receivedCount: 0,
          transactionCount: 0,
          type: "wallet",
        },
      },
      ...counterparties.slice(0, 20).map((cp) => ({
        id: cp.account,
        name: cp.label,
        val: Math.max(8, Math.min(25, 8 + cp.transactionCount * 0.3)),
        color: getColorByType(cp.type),
        data: cp,
      })),
    ];

    const links: GraphLink[] = counterparties.slice(0, 20).map((cp) => ({
      source: accountId,
      target: cp.account,
    }));

    return { nodes, links };
  }, [counterparties, accountId]);

  useEffect(() => {
    if (fgRef.current) {
      // Configure D3 forces for better spacing
      const fg = fgRef.current;
      
      // Set link distance to spread nodes apart
      fg.d3Force('link').distance(200);
      
      // Set charge force to push nodes away from each other
      fg.d3Force('charge').strength(-800);
      
      // Add collision force to prevent overlap
      fg.d3Force('collision', fg.d3.forceCollide().radius(50));
      
      // Reheat simulation to apply new forces
      fg.d3ReheatSimulation();
    }
  }, [graphData]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node?.data || null);
  }, []);

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2);

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();

      // Draw label background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(
        node.x! - bckgDimensions[0] / 2,
        node.y! + node.val + 2,
        bckgDimensions[0],
        bckgDimensions[1]
      );

      // Draw label text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, node.x!, node.y! + node.val + 2 + bckgDimensions[1] / 2);
    },
    []
  );

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

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && (summary.topSentTo || summary.topReceivedFrom) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This account mostly{" "}
              {summary.topSentTo && (
                <>
                  <span className="font-semibold text-foreground">
                    sends to {summary.topSentTo.label}
                  </span>{" "}
                  ({summary.topSentTo.count} transactions)
                </>
              )}
              {summary.topSentTo && summary.topReceivedFrom && " and "}
              {summary.topReceivedFrom && (
                <>
                  <span className="font-semibold text-foreground">
                    receives from {summary.topReceivedFrom.label}
                  </span>{" "}
                  ({summary.topReceivedFrom.count} transactions)
                </>
              )}
              .
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Counterparty Network Map
            <Badge variant="secondary">
              {counterparties.length} connections
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Interactive force-directed graph showing your most frequent counterparties. 
            Bubble size represents transaction frequency. Hover over nodes for details.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] rounded-lg bg-secondary/5 overflow-hidden">
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel={(node: unknown) => {
                const n = node as GraphNode;
                if (n.data.account === accountId) return "You";
                return `${n.name}\n↑ ${n.data.sentCount} sent | ↓ ${n.data.receivedCount} received`;
              }}
              nodeCanvasObject={nodeCanvasObject}
              nodeVal="val"
              nodeColor="color"
              nodeRelSize={8}
              linkColor={() => "rgba(148, 163, 184, 0.3)"}
              linkWidth={2}
              onNodeHover={handleNodeHover}
              warmupTicks={100}
              cooldownTicks={0}
              d3AlphaDecay={0.01}
              d3VelocityDecay={0.2}
              backgroundColor="transparent"
              width={1000}
              height={600}
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
                <div className="text-right flex flex-col gap-1">
                  <div className="font-medium">
                    {counterparty.transactionCount} txns
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {counterparty.sentCount > 0 && (
                      <span className="text-orange-500">
                        ↑ {counterparty.sentCount} sent
                      </span>
                    )}
                    {counterparty.sentCount > 0 && counterparty.receivedCount > 0 && " · "}
                    {counterparty.receivedCount > 0 && (
                      <span className="text-green-500">
                        ↓ {counterparty.receivedCount} received
                      </span>
                    )}
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
