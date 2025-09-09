import React from "react";
import { Wallet, DollarSign } from "lucide-react";
import { formatUSD } from "@/lib/format";

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
  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Account Overview</h2>
        </div>
        <p className="text-muted-foreground font-mono text-sm">{accountId}</p>
        {createdAt && (
          <p className="text-xs text-muted-foreground mt-1">Created on {createdAt}</p>
        )}
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
        </div>
      </div>
    </div>
  );
};