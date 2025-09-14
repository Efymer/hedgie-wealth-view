import React, { useMemo, useState } from "react";
import { Coins, ExternalLink, TrendingUp, TrendingDown, Crown, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatUSD,
  formatPercent,
  formatAmount,
  formatUSDWithDecimals,
} from "@/lib/format";
import { useWhaleDetection } from "@/lib/whale-detection";
import { TopHoldersModal } from "./TopHoldersModal";

interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue: number;
  priceUsd?: number;
  priceChange24h?: number;
}

interface TokenListProps {
  tokens: Token[];
  isLoading?: boolean;
  hideZeroUsd?: boolean;
  onHideZeroUsdChange?: (checked: boolean) => void;
  currentAccountId?: string;
}

export const TokenList: React.FC<TokenListProps> = ({
  tokens,
  isLoading = false,
  hideZeroUsd = true,
  onHideZeroUsdChange,
  currentAccountId,
}) => {
  const [selectedToken, setSelectedToken] = useState<{
    id: string;
    symbol: string;
    decimals: number;
  } | null>(null);

  const tokenIds = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const { data: whaleMap, isLoading: isWhaleLoading } = useWhaleDetection(
    currentAccountId,
    tokenIds,
    100
  );
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Token Holdings</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="shimmer glass-card rounded-lg p-4 h-16"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Token Holdings</h2>
        </div>
        <div className="text-center py-8">
          <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No tokens found for this account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Token Holdings</h2>
        <span className="ml-auto text-sm text-muted-foreground mr-4">
          {tokens.length} {tokens.length === 1 ? "token" : "tokens"}
        </span>
        {onHideZeroUsdChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="hide-zero" className="text-sm">Hide $0.00</Label>
            <Switch
              id="hide-zero"
              checked={hideZeroUsd}
              onCheckedChange={onHideZeroUsdChange}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {tokens.map((token) => {
          const whaleData = whaleMap?.[token.id] ?? { tokenId: token.id, isWhale: false };
          
          return (
            <div
              key={token.id}
              className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {token.symbol.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{token.symbol}</span>
                      {whaleData.isWhale && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          <span className="text-xs">
                            Whale #{whaleData.rank}
                          </span>
                        </Badge>
                      )}
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {typeof token.priceUsd === "number" && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatUSDWithDecimals(token.priceUsd, token.decimals)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-3">
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedToken({
                        id: token.id,
                        symbol: token.symbol,
                        decimals: token.decimals,
                      })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      <span className="text-xs">Top Holders</span>
                    </Button> */}
                    <div>
                      <p className="font-semibold">
                        {formatAmount(
                          token.balance / Math.pow(10, token.decimals),
                          { minimumFractionDigits: 3, maximumFractionDigits: 3 }
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatUSD(token.usdValue)}
                      </p>
                    </div>
                    {token.priceChange24h !== undefined && (
                      <div
                        className={`flex items-center gap-1 ${
                          token.priceChange24h >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {token.priceChange24h >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">
                          {formatPercent(Math.abs(token.priceChange24h))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedToken && (
        <TopHoldersModal
          isOpen={!!selectedToken}
          onClose={() => setSelectedToken(null)}
          tokenId={selectedToken.id}
          tokenSymbol={selectedToken.symbol}
          decimals={selectedToken.decimals}
          currentAccountId={currentAccountId}
        />
      )}
    </div>
  );
};
