import React, { useState } from "react";
import { AccountSearch } from "./AccountSearch";
import { AccountBalance } from "./AccountBalance";
import { TokenList } from "./TokenList";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockTokens = [
  {
    id: "0.0.456456",
    symbol: "USDC",
    name: "USD Coin",
    balance: 1000000000, // 1000 USDC with 6 decimals
    decimals: 6,
    usdValue: 1000,
    priceChange24h: 0.12,
  },
  {
    id: "0.0.789789",
    symbol: "SAUCE",
    name: "SaucerSwap Token",
    balance: 500000000000, // 500000 SAUCE with 6 decimals
    decimals: 6,
    usdValue: 2500,
    priceChange24h: -2.45,
  },
  {
    id: "0.0.123123",
    symbol: "HBARX",
    name: "Stader HBARX",
    balance: 25000000000, // 250 HBARX with 8 decimals
    decimals: 8,
    usdValue: 850,
    priceChange24h: 1.85,
  },
];

export const HederaExplorer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState<{
    accountId: string;
    hbarBalance: number;
    usdValue: number;
    tokens: typeof mockTokens;
  } | null>(null);
  const { toast } = useToast();

  const handleSearch = async (accountId: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate Hedera account ID format (basic validation)
      if (!/^0\.0\.\d+$/.test(accountId)) {
        throw new Error("Invalid Hedera account ID format");
      }

      // Mock account data
      const mockHbarBalance = 1250.75;
      const mockUsdValue = mockHbarBalance * 0.063 + mockTokens.reduce((sum, token) => sum + token.usdValue, 0);

      setAccountData({
        accountId,
        hbarBalance: mockHbarBalance,
        usdValue: mockUsdValue,
        tokens: mockTokens,
      });

      toast({
        title: "Account Found",
        description: `Successfully loaded data for ${accountId}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch account data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            Hedera Explorer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time account balances and token holdings on the Hedera network
          </p>
        </div>

        {/* Search */}
        <AccountSearch onSearch={handleSearch} isLoading={isLoading} />

        {/* Results */}
        {accountData && (
          <div className="space-y-6">
            <AccountBalance
              accountId={accountData.accountId}
              hbarBalance={accountData.hbarBalance}
              usdValue={accountData.usdValue}
            />
            <TokenList tokens={accountData.tokens} isLoading={isLoading} />
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-16">
          <p>Built for the Hedera community • Real-time data powered by Hedera APIs</p>
        </div>
      </div>
    </div>
  );
};