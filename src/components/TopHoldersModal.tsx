import React from "react";
import { Users, Crown, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatAmount, formatPercent } from "@/lib/format";
import { getTopHolders, TopHolder } from "@/lib/top-holders";

interface TopHoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  tokenSymbol: string;
  decimals: number;
  currentAccountId?: string;
}

export const TopHoldersModal: React.FC<TopHoldersModalProps> = ({
  isOpen,
  onClose,
  tokenId,
  tokenSymbol,
  decimals,
  currentAccountId,
}) => {
  const topHolders = getTopHolders(tokenId);

  const formatBalance = (balance: number) => {
    const actualBalance = balance / Math.pow(10, decimals);
    return formatAmount(actualBalance, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: decimals > 4 ? 4 : decimals 
    });
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    if (rank <= 10) return "outline";
    return "outline";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Crown className="h-3 w-3" />;
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top 100 Holders - {tokenSymbol}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full">
          <div className="space-y-2">
            {topHolders.map((holder) => (
              <div
                key={holder.accountId}
                className={`glass-card rounded-lg p-4 border transition-all ${
                  holder.isCurrentAccount
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/30 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={getRankBadgeVariant(holder.rank)}
                      className="flex items-center gap-1 min-w-[60px] justify-center"
                    >
                      {getRankIcon(holder.rank)}
                      #{holder.rank}
                    </Badge>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {holder.accountId}
                        </span>
                        {holder.isCurrentAccount && (
                          <Badge variant="default" className="text-xs">
                            You
                          </Badge>
                        )}
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">
                          {formatBalance(holder.balance)} {tokenSymbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(holder.percentageOfSupply)} of supply
                        </p>
                      </div>
                      
                      {holder.rank <= 10 && (
                        <div className="flex items-center">
                          <div className={`w-2 h-8 rounded-full ${
                            holder.rank === 1 ? "bg-yellow-500" :
                            holder.rank === 2 ? "bg-gray-400" :
                            holder.rank === 3 ? "bg-amber-600" :
                            "bg-primary/30"
                          }`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between items-center pt-4 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            Showing top 100 holders by balance
          </p>
          {currentAccountId && (
            <p className="text-sm text-muted-foreground">
              {topHolders.find(h => h.isCurrentAccount) 
                ? `Your account ranks #${topHolders.find(h => h.isCurrentAccount)?.rank}` 
                : "Your account is not in the top 100"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};