import React, { useMemo, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
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

  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<CounterpartyMapItem | null>(null);

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

  interface D3Node extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    radius: number;
    color: string;
    data: CounterpartyMapItem;
  }

  interface D3Link extends d3.SimulationLinkDatum<D3Node> {
    source: string | D3Node;
    target: string | D3Node;
  }

  const graphData = useMemo(() => {
    const nodes: D3Node[] = [
      {
        id: accountId,
        name: "You",
        radius: 30,
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
        radius: Math.max(12, Math.min(25, 12 + cp.transactionCount * 0.3)),
        color: getColorByType(cp.type),
        data: cp,
      })),
    ];

    const links: D3Link[] = counterparties.slice(0, 20).map((cp) => ({
      source: accountId,
      target: cp.account,
    }));

    return { nodes, links };
  }, [counterparties, accountId]);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const width = 800;
    const height = 384;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Create force simulation
    const simulation = d3.forceSimulation<D3Node>(graphData.nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(graphData.links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<D3Node>().radius(d => d.radius + 5));

    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", "rgba(148, 163, 184, 0.3)")
      .attr("stroke-width", 2);

    // Create node groups
    const node = svg.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, D3Node>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // Add labels to nodes
    node.append("text")
      .text(d => d.name.length > 12 ? d.name.slice(0, 12) + "..." : d.name)
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 15)
      .attr("fill", "currentColor")
      .attr("font-size", "12px")
      .attr("font-weight", "500");

    // Add hover events
    node.on("mouseenter", (event, d) => {
      setHoveredNode(d.data);
    }).on("mouseleave", () => {
      setHoveredNode(null);
    });

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as D3Node).x!)
        .attr("y1", d => (d.source as D3Node).y!)
        .attr("x2", d => (d.target as D3Node).x!)
        .attr("y2", d => (d.target as D3Node).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData]);

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
          <div className="relative h-96 rounded-lg bg-secondary/5 overflow-hidden">
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ maxWidth: "100%", height: "384px" }}
            />
            {hoveredNode && hoveredNode.account !== accountId && (
              <div className="absolute bottom-4 left-4 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border">
                <div className="font-semibold">{hoveredNode.label}</div>
                <div className="text-xs text-muted-foreground">{hoveredNode.account}</div>
                <div className="text-sm mt-1 space-y-1">
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
