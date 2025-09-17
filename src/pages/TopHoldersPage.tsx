import React, { useState, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTopHolders } from "@/hooks/useTopHolders";
import { formatAmount } from "@/lib/format";

export const TopHoldersPage: React.FC = () => {
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
    { id: "HBAR", name: "Hedera" },
    { id: "0.0.456858", name: "USDC" },
    { id: "0.0.731861", name: "KARATE" },
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Search Token Holders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter token ID (e.g., 0.0.456858 or HBAR)"
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
            <div className="space-y-2">
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
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {selectedToken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Top 100 Holders - {selectedToken}</span>
                <Badge variant="secondary">
                  {isLoading ? "Loading..." : `${topHolders.length} holders`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Fetching top holders...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Failed to load top holders. Please try again.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {topHolders.map((holder) => (
                    <div
                      key={holder.accountId}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        holder.isCurrentAccount
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="min-w-[3rem] justify-center">
                          #{holder.rank}
                        </Badge>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {holder.accountId.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-mono text-sm">{holder.accountId}</p>
                          {holder.isCurrentAccount && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Current Account
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <p className="font-medium">
                          {formatAmount(holder.balance)} tokens
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {holder.percentageOfSupply.toFixed(2)}% of supply
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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