import React, { useState, useMemo } from "react";
import { Search, Loader2, Crown, ExternalLink, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTopHolders } from "@/hooks/useTopHolders";
import { formatAmount, formatPercent } from "@/lib/format";

export const TopHoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  
  const { data: topHoldersResponse, isLoading, error } = useTopHolders(selectedToken);
  
  const topHolders = useMemo(() => {
    if (!topHoldersResponse?.data) return [];
    
    // Calculate total supply for percentage calculation
    const totalSupply = topHoldersResponse.data.reduce((sum, holder) => sum + holder.balance, 0);
    
    return topHoldersResponse.data.map((holder, index) => ({
      rank: index + 1,
      accountId: holder.account,
      balance: holder.balance,
      percentageOfSupply: totalSupply > 0 ? (holder.balance / totalSupply) * 100 : 0,
      isCurrentAccount: false, // We don't have current account context here
    }));
  }, [topHoldersResponse]);

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

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSelectedToken(searchTerm.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Popular tokens for quick access
  const popularTokens = [
    // { id: "HBAR", name: "Hedera" },
    // { id: "0.0.456858", name: "USDC" },
    // { id: "0.0.731861", name: "KARATE" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            Top Token Holders
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the top 100 holders for any token on the Hedera network
          </p>
        </div>

        {/* Search Section */}
        <div className="glass-card rounded-xl p-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2 mb-6">
            <Users className="h-8 w-8 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Search Token Holders</h2>
            <p className="text-sm text-muted-foreground">Enter any token ID to view its top holders</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter token ID (e.g., 0.0.456858)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchTerm.trim() || isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Popular tokens */}
            {/* <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Popular tokens:</p>
              <div className="flex flex-wrap gap-2">
                {popularTokens.map((token) => (
                  <Button
                    key={token.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm(token.id);
                      setSelectedToken(token.id);
                    }}
                  >
                    {token.name} ({token.id})
                  </Button>
                ))}
              </div>
            </div> */}
          </div>
        </div>

        {/* Results Section */}
        {selectedToken && (
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Top 100 Holders - {selectedToken}</h2>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {isLoading ? "Loading..." : `${topHolders.length} holders`}
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Fetching top holders...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>Failed to load top holders. Please try again.</p>
              </div>
            ) : (
              <ScrollArea className="h-[60vh] w-full">
                <div className="space-y-2">
                  {topHolders.map((holder) => (
                    <div
                      key={holder.accountId}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/explorer/${holder.accountId}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(`/explorer/${holder.accountId}`);
                        }
                      }}
                      className={`glass-card rounded-lg p-4 border transition-all cursor-pointer ${
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
                                {formatAmount(holder.balance)} tokens
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
            )}

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Showing top 100 holders by balance
              </p>
              <p className="text-sm text-muted-foreground">
                Click any holder to view their account
              </p>
            </div>
          </div>
        )}

        {!selectedToken && (
          <div className="text-center text-muted-foreground">
            Enter a token ID above to view its top holders
          </div>
        )}
      </div>
    </div>
  );
};