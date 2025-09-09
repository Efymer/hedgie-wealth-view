import React from "react";
import { Wallet, DollarSign, Calendar, Server } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { useAccountInfo, useNetworkNodes } from "@/queries";

interface AccountBalanceProps {
  accountId: string;
  usdValue: number;
  createdAt?: string;
}

export const AccountBalance: React.FC<AccountBalanceProps> = ({
  accountId,
  usdValue,
  createdAt,
}) => {
  const { data: accountInfo } = useAccountInfo(accountId);
  const { data: nodes } = useNetworkNodes();

  type AccountStakeInfo = {
    staked_node_id?: number | null;
    staked_account_id?: string | null;
  };
  const stake = (accountInfo ?? {}) as AccountStakeInfo;
  const stakedNodeId =
    typeof stake.staked_node_id === "number" ? stake.staked_node_id : null;
  const stakedAccountId = stake.staked_account_id ?? undefined;

  const isStakedToNode = stakedNodeId !== null;
  const isStakedToAccount = !!stakedAccountId && !isStakedToNode;

  const nodeLabel = React.useMemo(() => {
    if (!isStakedToNode) return "";
    type NetworkNode = { node_id: number; description?: string; account_id?: string };
    const list: NetworkNode[] = Array.isArray(nodes) ? (nodes as NetworkNode[]) : [];
    const node = list.find((n) => n.node_id === stakedNodeId);
    return node?.description || node?.account_id || `Node ${stakedNodeId}`;
  }, [isStakedToNode, nodes, stakedNodeId]);

  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Account Overview</h2>
        </div>
        <p className="text-muted-foreground font-mono text-sm">{accountId}</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card rounded-lg p-6 border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">USD Value</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-success">
              {formatUSD(usdValue)}
            </p>
            <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
          </div>
          {createdAt && (
            <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border/30">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Created on {createdAt}</p>
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border/30">
            <Server className="h-4 w-4 text-muted-foreground" />
            {isStakedToNode ? (
              <p className="text-sm text-muted-foreground">
                Staked to node {stakedNodeId}
                {nodeLabel ? ` • ${nodeLabel}` : ""}
              </p>
            ) : isStakedToAccount ? (
              <p className="text-sm text-muted-foreground">
                Staked to account {stakedAccountId}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not staked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};