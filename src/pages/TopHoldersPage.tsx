import React, { useState, useMemo } from "react";
import { Search, Loader2, Crown, ExternalLink, Users, Check, ChevronsUpDown, AlertTriangle, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTopHolders } from "@/hooks/useTopHolders";
import { useAllTokensForAutocomplete, useTokenInfo } from "@/queries";
import { formatAmount, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const TopHoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [open, setOpen] = useState(false);
  
  const { data: topHoldersResponse, isLoading, error } = useTopHolders(selectedToken);
  const { data: allTokens = [], isLoading: isTokensLoading } = useAllTokensForAutocomplete();
  const { data: tokenInfo } = useTokenInfo(selectedToken, !!selectedToken);

  const normalizedTotalSupply = useMemo(() => {
    if (!tokenInfo) return null;
    const decimals = tokenInfo.decimals ?? 0;
    const totalSupply = tokenInfo.total_supply ?? 0;
    return totalSupply / Math.pow(10, decimals);
  }, [tokenInfo]);
  
  const topHolders = useMemo(() => {
    if (!topHoldersResponse?.data) return [];
    const decimals = tokenInfo?.decimals ?? 0;
    const divisor = Math.pow(10, decimals);
    // Prefer mirror node's total_supply if available, otherwise derive from balances
    const totalSupplyNormalized = (() => {
      if (typeof tokenInfo?.total_supply === 'number') {
        return (tokenInfo.total_supply ?? 0) / divisor;
      }
      const sumSmallest = topHoldersResponse.data.reduce((sum, h) => sum + h.balance, 0);
      return sumSmallest / divisor;
    })();
    
    return topHoldersResponse.data.map((holder, index) => {
      const normalizedBalance = holder.balance / divisor;
      return {
        rank: index + 1,
        accountId: holder.account,
        balance: normalizedBalance,
        percentageOfSupply: totalSupplyNormalized > 0 ? (normalizedBalance / totalSupplyNormalized) * 100 : 0,
        isCurrentAccount: false,
      };
    });
  }, [topHoldersResponse, tokenInfo]);

  // Calculate supply concentration for top 10 holders
  const supplyConcentration = useMemo(() => {
    if (topHolders.length === 0) return null;
    
    const top10Holders = topHolders.slice(0, 10);
    const top10Percentage = top10Holders.reduce((sum, holder) => sum + holder.percentageOfSupply, 0);
    
    let riskLevel: 'low' | 'medium' | 'high';
    let riskColor: string;
    let riskIcon: React.ReactNode;
    let riskText: string;
    
    if (top10Percentage >= 80) {
      riskLevel = 'high';
      riskColor = 'text-red-500';
      riskIcon = <AlertTriangle className="h-4 w-4 text-red-500" />;
      riskText = 'High concentration risk';
    } else if (top10Percentage >= 50) {
      riskLevel = 'medium';
      riskColor = 'text-yellow-500';
      riskIcon = <AlertCircle className="h-4 w-4 text-yellow-500" />;
      riskText = 'Medium concentration risk';
    } else {
      riskLevel = 'low';
      riskColor = 'text-green-500';
      riskIcon = <Shield className="h-4 w-4 text-green-500" />;
      riskText = 'Low concentration risk';
    }
    
    return {
      percentage: top10Percentage,
      riskLevel,
      riskColor,
      riskIcon,
      riskText
    };
  }, [topHolders]);

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

  const filteredTokens = useMemo(() => {
    if (!searchTerm) return allTokens.slice(0, 50); // Show first 50 by default
    
    const lower = searchTerm.toLowerCase();
    return allTokens
      .filter(token => 
        token.symbol.toLowerCase().includes(lower) ||
        token.name.toLowerCase().includes(lower) ||
        token.token_id.toLowerCase().includes(lower)
      )
      .slice(0, 50); // Limit to 50 results for performance
  }, [allTokens, searchTerm]);

  const selectedTokenInfo = useMemo(() => {
    return allTokens.find(token => token.token_id === selectedToken);
  }, [allTokens, selectedToken]);

  // Popular tokens for quick access
  const popularTokens = [
    // { id: "HBAR", name: "Hedera" },
    // { id: "0.0.456858", name: "USDC" },
    // { id: "0.0.731861", name: "KARATE" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative px-6 py-8 md:py-10 text-center">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Crown className="h-3 w-3 mr-2" />
                Token Ownership Analytics
              </div>
              
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="gradient-text">Token Holder</span>
                <span className="text-foreground"> Rankings</span>
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Analyze token distribution and discover the top 100 holders for any token
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                  <span>Top 100 Rankings</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span>Ownership %</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span>Supply Distribution</span>
                </div>
              </div>
            </div>
          </div>
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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between"
                  >
                    {selectedTokenInfo ? (
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs">{selectedTokenInfo.token_id}</span>
                        <span>•</span>
                        <span>{selectedTokenInfo.symbol}</span>
                      </span>
                    ) : (
                      "Select a token or enter token ID..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-w-2xl">
                  <Command>
                    <CommandInput 
                      placeholder="Search tokens by name, symbol, or ID..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isTokensLoading ? "Loading tokens..." : "No tokens found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredTokens.map((token) => (
                          <CommandItem
                            key={token.token_id}
                            value={`${token.symbol} ${token.name} ${token.token_id}`}
                            onSelect={() => {
                              setSelectedToken(token.token_id);
                              setSearchTerm(token.token_id);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedToken === token.token_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{token.symbol}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">{token.name}</span>
                                </div>
                                <span className="font-mono text-xs text-muted-foreground">{token.token_id}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Manual input fallback */}
              <Input
                placeholder="Or enter token ID manually"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="max-w-xs"
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
                <h2 className="text-xl font-semibold">
                  Top 100 Holders - {selectedTokenInfo ? `${selectedTokenInfo.symbol} (${selectedToken})` : selectedToken}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {isLoading ? "Loading..." : `${topHolders.length} holders`}
                </Badge>
                {normalizedTotalSupply !== null && (
                  <Badge variant="outline" className="px-3 py-1">
                    Current supply: {formatAmount(normalizedTotalSupply, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </Badge>
                )}
              </div>
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
            ) : topHolders.length === 0 ? (
              <div className="glass-card rounded-lg p-8 border border-border/30 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Holders Found</h3>
                <p className="text-sm text-muted-foreground">
                  This token doesn't have any holders or the data is not available.
                </p>
              </div>
            ) : (
              <>
                {/* Supply Concentration Insight */}
                {supplyConcentration && (
                  <div className="mb-6 p-4 rounded-lg border border-border/30 bg-background/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {supplyConcentration.riskIcon}
                        <div>
                          <p className="font-medium">Supply Concentration Insight</p>
                          <p className="text-sm text-muted-foreground">
                            Top 10 wallets hold{' '}
                            <span className="font-semibold">
                              {formatPercent(supplyConcentration.percentage)}
                            </span>
                            {' '}of supply → {' '}
                            <span className={`font-medium ${supplyConcentration.riskColor}`}>
                              {supplyConcentration.riskText}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={supplyConcentration.riskLevel === 'high' ? 'destructive' : supplyConcentration.riskLevel === 'medium' ? 'secondary' : 'outline'}
                        className="px-3 py-1"
                      >
                        {formatPercent(supplyConcentration.percentage)} concentration
                      </Badge>
                    </div>
                  </div>
                )}

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
                                {formatAmount(holder.balance, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} tokens
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
              </>
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