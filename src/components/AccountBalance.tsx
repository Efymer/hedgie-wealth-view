import React from "react";
import { TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";

interface AccountBalanceProps {
  accountId: string;
  hbarBalance: number;
  usdValue: number;
  hbarPrice?: number;
  hbarChange24h?: number;
}

export const AccountBalance: React.FC<AccountBalanceProps> = ({
  accountId,
  hbarBalance,
  usdValue,
  hbarPrice = 0.063,
  hbarChange24h = 2.85,
}) => {
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(balance);
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatChange = (change: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(change / 100);
  };

  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Account Overview</h2>
        </div>
        <p className="text-muted-foreground font-mono text-sm">{accountId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-lg p-6 border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">HBAR Balance</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold gradient-text">
              {formatBalance(hbarBalance)}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">HBAR</p>
              <span className="text-xs text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground">{formatUSD(hbarPrice)}</p>
              <div className={`flex items-center gap-1 text-xs ${
                hbarChange24h >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {hbarChange24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {hbarChange24h >= 0 ? '+' : ''}{formatChange(hbarChange24h)}
                </span>
              </div>
            </div>
          </div>
        </div>

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