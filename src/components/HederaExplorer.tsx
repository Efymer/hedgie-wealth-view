import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccountBalance } from "./AccountBalance";
import { TokenList } from "./TokenList";
import { TransactionHistory } from "./TransactionHistory";
import { Breadcrumb } from "./Breadcrumb";

import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { tinybarToHBAR, useHBARBalance, useHBARPrice, useTokenPrices, useAccountTokenDetails, TokenPricesResponse, useTokenPriceChanges, useAccountInfo } from "@/queries";

export const HederaExplorer: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [accountId, setAccountId] = useState<string>("");
  const [hideZeroUsd, setHideZeroUsd] = useState<boolean>(true);
  const { toast } = useToast();

  // Initialize accountId from route params and react to changes
  useEffect(() => {
    const id = (params?.accountId as string) || "";
    setAccountId(id);
  }, [params?.accountId]);

  const { data: balanceEntry, isLoading: isBalanceLoading, isError: isBalanceError } = useHBARBalance(accountId);
  const { data: priceData, isLoading: isPriceLoading, isError: isPriceError } = useHBARPrice();
  const { data: tokenPrices } = useTokenPrices(accountId);
  const { data: priceChanges } = useTokenPriceChanges(!!accountId, "mainnet");
  const { data: tokenDetails, isLoading: isTokensLoading } = useAccountTokenDetails(accountId);
  const { data: accountInfo } = useAccountInfo(accountId);

  const hbarBalance = useMemo(() => tinybarToHBAR(balanceEntry?.balance ?? 0), [balanceEntry]);
  const hbarPrice = priceData?.usd ?? 0.063;
  const hbarChange24h = priceData?.usdChange24h ?? 0;

  const createdAt = useMemo(() => {
    const ts = accountInfo?.created_timestamp; // e.g., "1562591528.000123456"
    if (!ts) return undefined;
    const seconds = parseInt(ts.split(".")[0] || "0", 10);
    if (!Number.isFinite(seconds)) return undefined;
    const d = new Date(seconds * 1000);
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }, [accountInfo?.created_timestamp]);

  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!tokenPrices) return map;
    const data = tokenPrices as TokenPricesResponse;
    if (Array.isArray(data)) {
      (data as Array<{ id?: string; token_id?: string; priceUsd?: number }>).forEach((row) => {
        const id = row.id ?? row.token_id;
        const price = typeof row.priceUsd === "number" ? row.priceUsd : 0;
        if (id) map.set(id, price);
      });
    } else if (typeof data === "object") {
      // If the API ever returns an object map, prefer numeric values, expecting they represent USD price per token
      Object.entries(data as Record<string, number>).forEach(([id, priceUsd]) => {
        map.set(id, typeof priceUsd === "number" ? priceUsd : 0);
      });
    }
    return map;
  }, [tokenPrices]);

  const tokens = useMemo(() => {
    // Map fungible tokens from account details
    const mapped = (tokenDetails ?? [])
      .filter((t: { type?: string }) => t.type !== "NON_FUNGIBLE_UNIQUE")
      .map((t) => {
        const price = priceMap.get(t.token_id) ?? 0;
        const actualBalance = t.decimals ? t.balance / Math.pow(10, t.decimals) : t.balance;
        const usdValue = actualBalance * price;
        const changeRaw = priceChanges?.[t.token_id];
        const change = typeof changeRaw === "number" ? changeRaw : undefined;

        return {
          id: t.token_id,
          symbol: t.symbol,
          name: t.name,
          balance: t.balance,
          decimals: t.decimals,
          usdValue,
          priceUsd: price,
          priceChange24h: change,
        };
      });

    // Add HBAR as a token entry
    const hbarToken = {
      id: "HBAR",
      symbol: "HBAR",
      name: "Hedera",
      balance: Math.round(hbarBalance * Math.pow(10, 8)),
      decimals: 4,
      usdValue: hbarBalance * hbarPrice,
      priceUsd: hbarPrice,
      priceChange24h: hbarChange24h,
    };

    const combined = [hbarToken, ...mapped];
    return combined.filter((tk) => (hideZeroUsd ? tk.usdValue > 0.01 : true));
  }, [tokenDetails, priceMap, hideZeroUsd, hbarBalance, hbarPrice, hbarChange24h, priceChanges]);

  const usdValue = useMemo(() => {
    // Sum USD value from tokens (HBAR is included as a token above)
    return tokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);
  }, [tokens]);

  const breadcrumbItems = !accountId
    ? [{ label: "Home", active: true }]
    : [
        { label: "Home" },
        { label: `Account ${accountId}`, active: true }
      ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Breadcrumb 
          items={breadcrumbItems} 
          onHomeClick={() => navigate("/")}
        />
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            Hedera Explorer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time account balances and token holdings on the Hedera network
          </p>
        </div>

        {!accountId ? null : (
          <div className="space-y-6">
            <AccountBalance
              accountId={accountId}
              usdValue={usdValue}
              createdAt={createdAt}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="hide-zero">Hide $0.00 tokens</Label>
                    <Switch id="hide-zero" checked={hideZeroUsd} onCheckedChange={setHideZeroUsd} />
                  </div>
                </div>
                <TokenList tokens={tokens} isLoading={isBalanceLoading || isPriceLoading || isTokensLoading} />
              </div>
              <TransactionHistory accountId={accountId} transactions={[]} />
            </div>

            {(isBalanceError || isPriceError) && (
              <div className="text-sm text-destructive">
                Failed to load live data. Please try again.
              </div>
            )}
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