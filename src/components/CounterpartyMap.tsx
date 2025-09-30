import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCounterpartyMap, type CounterpartyMapItem } from "@/queries";

interface CounterpartyMapProps {
  accountId: string;
}

// Data shape imported from queries as CounterpartyMapItem

export const CounterpartyMap: React.FC<CounterpartyMapProps> = ({
  accountId,
}) => {
  const { data, isLoading, isError } = useCounterpartyMap(accountId, 1000);

  const counterparties: CounterpartyMapItem[] = useMemo(
    () => data?.data ?? [],
    [data?.data]
  );

  const summary = useMemo(() => data?.meta?.summary, [data?.meta?.summary]);

  const [_, setHoveredNode] = useState<CounterpartyMapItem | null>(null);
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

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
        name: accountId,
        val: 20,
        color: "#8b5cf6",
        data: {
          account: accountId,
          label: accountId,
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

  // Configure D3 forces after graph data changes
  useEffect(() => {
    if (fgRef.current) {
      const fg = fgRef.current;
      // Access the d3 force simulation and configure spacing
      // Reduced charge and link distance for more compact, zoomed-in appearance
      fg.d3Force("charge").strength(-300);
      fg.d3Force("link").distance(80);
      fg.d3Force("center").strength(0.1);
      
      // Zoom in slightly for better initial view
      fg.zoom(1.5);
    }
  }, [graphData]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node?.data || null);
  }, []);

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Guard against undefined or invalid coordinates during initialization
      if (!node.x || !node.y || !isFinite(node.x) || !isFinite(node.y)) {
        return;
      }

      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(
        (n) => n + fontSize * 0.2
      );

      // Add outer glow
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 15 / globalScale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Create radial gradient for node
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        node.val
      );

      // Lighter center, darker edges for depth
      const baseColor = node.color;
      gradient.addColorStop(0, `${baseColor}ff`);
      gradient.addColorStop(0.5, baseColor);
      gradient.addColorStop(1, `${baseColor}cc`);

      // Draw main circle with gradient
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add highlight ring
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2.5 / globalScale;
      ctx.stroke();

      // Add inner highlight for glossy effect
      const highlightGradient = ctx.createRadialGradient(
        node.x - node.val * 0.3,
        node.y - node.val * 0.3,
        0,
        node.x,
        node.y,
        node.val * 0.8
      );
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val * 0.8, 0, 2 * Math.PI, false);
      ctx.fillStyle = highlightGradient;
      ctx.fill();

      // Reset shadow for label
      ctx.shadowBlur = 0;

      // Draw label background with rounded corners
      const padding = fontSize * 0.3;
      const bgX = node.x - bckgDimensions[0] / 2 - padding;
      const bgY = node.y + node.val + 4;
      const bgWidth = bckgDimensions[0] + padding * 2;
      const bgHeight = bckgDimensions[1] + padding;
      const radius = 4 / globalScale;

      ctx.beginPath();
      ctx.moveTo(bgX + radius, bgY);
      ctx.lineTo(bgX + bgWidth - radius, bgY);
      ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
      ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
      ctx.quadraticCurveTo(
        bgX + bgWidth,
        bgY + bgHeight,
        bgX + bgWidth - radius,
        bgY + bgHeight
      );
      ctx.lineTo(bgX + radius, bgY + bgHeight);
      ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
      ctx.lineTo(bgX, bgY + radius);
      ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
      ctx.closePath();
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fill();

      // Add subtle border to label
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      // Draw label text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${fontSize}px Sans-Serif`;
      ctx.fillText(label, node.x, bgY + bgHeight / 2);
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
            Interactive force-directed graph showing your most frequent
            counterparties. Bubble size represents transaction frequency. Hover
            over nodes for details.
          </p>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            className="h-[800px] rounded-lg bg-secondary/5 overflow-hidden"
          >
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel={(node: unknown) => {
                const n = node as GraphNode;
                if (n.data.account === accountId) return accountId;
                return `↑ ${n.data.sentCount} sent | ↓ ${n.data.receivedCount} received`;
              }}
              nodeCanvasObject={nodeCanvasObject}
              nodeVal="val"
              nodeColor="color"
              nodeRelSize={4}
              linkColor={() => "rgba(148, 163, 184, 0.3)"}
              linkWidth={2}
              onNodeHover={handleNodeHover}
              warmupTicks={100}
              cooldownTicks={0}
              d3AlphaDecay={0.01}
              d3VelocityDecay={0.2}
              d3AlphaMin={0.001}
              backgroundColor="transparent"
              width={dimensions.width}
              height={dimensions.height}
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
            {counterparties.slice(0, 10).map((counterparty, index) => (
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
                    {counterparty.sentCount > 0 &&
                      counterparty.receivedCount > 0 &&
                      " · "}
                    {counterparty.receivedCount > 0 && (
                      <span className="text-green-500">
                        ↓ {counterparty.receivedCount} received
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
