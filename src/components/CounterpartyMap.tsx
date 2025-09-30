import React, { useMemo, useEffect, useRef, useState } from "react";
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

  // Force Graph Implementation - all hooks must be at top level
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<CounterpartyMapItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  interface Node {
    id: string;
    label: string;
    size: number;
    color: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    data: CounterpartyMapItem;
  }

  const nodes = useMemo<Node[]>(() => {
    const centerNode: Node = {
      id: accountId,
      label: "You",
      size: 40,
      color: "#8b5cf6",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      data: {
        account: accountId,
        label: "You",
        sentCount: 0,
        receivedCount: 0,
        transactionCount: 0,
        type: "wallet",
      },
    };

    const counterpartyNodes: Node[] = counterparties.slice(0, 15).map((cp) => ({
      id: cp.account,
      label: cp.label,
      size: Math.max(15, Math.min(35, 15 + cp.transactionCount * 0.5)),
      color: getColorByType(cp.type),
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200,
      vx: 0,
      vy: 0,
      data: cp,
    }));

    return [centerNode, ...counterpartyNodes];
  }, [counterparties, accountId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Simple force simulation
    let animationId: number;
    const simulate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Apply forces
      nodes.forEach((node, i) => {
        if (i === 0) {
          // Center node stays in center
          node.x = centerX;
          node.y = centerY;
          return;
        }

        // Attraction to center
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetDistance = 150;
        const force = (distance - targetDistance) * 0.01;
        node.vx += (dx / distance) * force;
        node.vy += (dy / distance) * force;

        // Repulsion from other nodes
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx2 = other.x - node.x;
          const dy2 = other.y - node.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100 && dist2 > 0) {
            const repel = (100 - dist2) * 0.02;
            node.vx -= (dx2 / dist2) * repel;
            node.vy -= (dy2 / dist2) * repel;
          }
        });

        // Apply velocity with damping
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Keep within bounds
        const margin = 50;
        if (node.x < margin) node.x = margin;
        if (node.x > width - margin) node.x = width - margin;
        if (node.y < margin) node.y = margin;
        if (node.y > height - margin) node.y = height - margin;
      });

      // Draw connections
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      nodes.forEach((node, i) => {
        if (i === 0) return;
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node) => {
        // Draw circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const maxWidth = node.size * 1.8;
        const text = node.label.length > 12 ? node.label.slice(0, 12) + "..." : node.label;
        ctx.fillText(text, node.x, node.y, maxWidth);
      });

      animationId = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [nodes]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    // Find hovered node
    const hovered = nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.size;
    });

    setHoveredNode(hovered?.data || null);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

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
          <div className="relative h-96">
            <canvas
              ref={canvasRef}
              width={800}
              height={384}
              className="w-full h-full rounded-lg bg-secondary/5"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            {hoveredNode && hoveredNode.account !== accountId && (
              <div
                className="absolute z-10 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border pointer-events-none"
                style={{
                  left: mousePos.x + 10,
                  top: mousePos.y + 10,
                }}
              >
                <div className="font-semibold">{hoveredNode.label}</div>
                <div className="text-xs text-muted-foreground">{hoveredNode.account}</div>
                <div className="text-sm mt-1">
                  <div className="text-orange-500">↑ {hoveredNode.sentCount} sent</div>
                  <div className="text-green-500">↓ {hoveredNode.receivedCount} received</div>
                </div>
              </div>
            )}
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
