import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccountBalance } from "./AccountBalance";
import { TokenList } from "./TokenList";
import { TransactionHistory, Transaction } from "./TransactionHistory";
import { Breadcrumb } from "./Breadcrumb";
import { PortfolioDiversificationChart } from "./PortfolioDiversificationChart";
import { NFTList } from "./NFTList";
import { FollowButton } from "./FollowButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useHBARBalance,
  useHBARPrice,
  useTokenPrices,
  useAccountTokenDetails,
  TokenPricesResponse,
  useTokenPriceChanges,
  useAccountInfo,
  useAccountTransactionsInfinite,
  MirrorNodeTransaction,
  useNetworth,
} from "@/queries";
import { tinybarToHBAR } from "@/lib/hedera-utils";
import { NetWorthChart } from "./NetWorthChart";

export const HederaExplorer: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [accountId, setAccountId] = useState<string>("");
  const [hideZeroUsd, setHideZeroUsd] = useState<boolean>(true);
  const { data: networthData } = useNetworth(accountId, 90);

  useEffect(() => {
    const id = (params?.accountId as string) || "";
    setAccountId(id);
  }, [params?.accountId]);

  const {
    data: balanceEntry,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useHBARBalance(accountId);
  const {
    data: priceData,
    isLoading: isPriceLoading,
    isError: isPriceError,
  } = useHBARPrice();
  const { data: tokenPrices } = useTokenPrices(accountId);
  const { data: priceChanges } = useTokenPriceChanges(!!accountId);
  const { data: tokenDetails, isLoading: isTokensLoading } =
    useAccountTokenDetails(accountId);
  const { data: accountInfo } = useAccountInfo(accountId);
  const txInfinite = useAccountTransactionsInfinite(accountId);

  const hbarBalance = useMemo(
    () => tinybarToHBAR(balanceEntry?.balance ?? 0),
    [balanceEntry]
  );
  const hbarPrice = priceData?.usd;
  const hbarChange24h = priceData?.usdChange24h ?? 0;

  const createdAt = useMemo(() => {
    const ts = accountInfo?.created_timestamp; // e.g., "1562591528.000123456"
    if (!ts) return undefined;
    const seconds = parseInt(ts.split(".")[0] || "0", 10);
    if (!Number.isFinite(seconds)) return undefined;
    const d = new Date(seconds * 1000);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }, [accountInfo?.created_timestamp]);

  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!tokenPrices) return map;
    const data = tokenPrices as TokenPricesResponse;
    if (Array.isArray(data)) {
      (
        data as Array<{ id?: string; token_id?: string; priceUsd?: number }>
      ).forEach((row) => {
        const id = row.id ?? row.token_id;
        const price = typeof row.priceUsd === "number" ? row.priceUsd : 0;
        if (id) map.set(id, price);
      });
    } else if (typeof data === "object") {
      // If the API ever returns an object map, prefer numeric values, expecting they represent USD price per token
      Object.entries(data as Record<string, number>).forEach(
        ([id, priceUsd]) => {
          map.set(id, typeof priceUsd === "number" ? priceUsd : 0);
        }
      );
    }
    return map;
  }, [tokenPrices]);

  const tokens = useMemo(() => {
    // Map fungible tokens from account details
    const mapped = (tokenDetails ?? [])
      .filter((t: { type?: string }) => t.type !== "NON_FUNGIBLE_UNIQUE")
      .map((t) => {
        const price = priceMap.get(t.token_id) ?? 0;
        const actualBalance = t.decimals
          ? t.balance / Math.pow(10, t.decimals)
          : t.balance;
        const usdValue = actualBalance * price;
        // Find price change data from SaucerSwap array
        const tokenPriceData = priceChanges?.find(token => token.id === t.token_id);
        const change = tokenPriceData?.priceChangeDay;

        return {
          id: t.token_id,
          symbol: t.symbol,
          name: t.name,
          balance: t.balance,
          decimals: t.decimals,
          usdValue,
          priceUsd: price,
          priceChangeDay: change,
        };
      });

    // Add HBAR as a token entry
    const hbarToken = {
      id: "HBAR",
      symbol: "HBAR",
      name: "Hedera",
      balance: Math.round(hbarBalance * Math.pow(10, 8)),
      decimals: 8,
      usdValue: hbarBalance * hbarPrice,
      priceUsd: hbarPrice,
      priceChangeDay: hbarChange24h,
    };

    const combined = [hbarToken, ...mapped];
    return combined.filter((tk) => (hideZeroUsd ? tk.usdValue > 0.01 : true));
  }, [
    tokenDetails,
    priceMap,
    hideZeroUsd,
    hbarBalance,
    hbarPrice,
    hbarChange24h,
    priceChanges,
  ]);

  const nfts = useMemo(() => {
    return (tokenDetails ?? [])
      .filter((t: { type?: string }) => t.type === "NON_FUNGIBLE_UNIQUE")
      .map((t) => ({
        id: t.token_id,
        symbol: t.symbol,
        name: t.name,
        balance: t.balance,
        type: t.type,
      }));
  }, [tokenDetails]);

  const usdValue = useMemo(() => {
    // Sum USD value from tokens (HBAR is included as a token above)
    return tokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);
  }, [tokens]);

  // Build a quick symbol map for token_id -> symbol
  const tokenSymbolMap = useMemo(() => {
    const map = new Map<string, string>();
    (tokenDetails ?? []).forEach((t) => {
      if (t.token_id && t.symbol) map.set(t.token_id, t.symbol);
    });
    return map;
  }, [tokenDetails]);

  // Build decimals map for token_id -> decimals
  const tokenDecimalsMap = useMemo(() => {
    const map = new Map<string, number>();
    (tokenDetails ?? []).forEach((t) => {
      if (t.token_id && typeof t.decimals === "number")
        map.set(t.token_id, t.decimals);
    });
    return map;
  }, [tokenDetails]);

  // Map Mirror Node transactions to TransactionHistory's expected shape
  const mappedTransactions: Transaction[] = useMemo(() => {
    const flat: MirrorNodeTransaction[] = (
      txInfinite.data?.pages || []
    ).flatMap(
      (p: { transactions?: MirrorNodeTransaction[] }) => p.transactions || []
    );
    const list: Transaction[] = flat.map((tx: MirrorNodeTransaction) => {
      // const type = "transfer";

      // Find token transfer involving this account
      const tokenEntry = (tx.token_transfers || []).find(
        (t) => t.account === accountId
      );
      // Find HBAR transfer involving this account
      const hbarEntry = (tx.transfers || []).find(
        (t) => t.account === accountId
      );

      // Amount and token label
      let amount = 0;
      let token = "";
      if (tokenEntry) {
        const dec = tokenEntry.token_id
          ? tokenDecimalsMap.get(tokenEntry.token_id) ?? 0
          : 0;
        amount = dec
          ? tokenEntry.amount / Math.pow(10, dec)
          : tokenEntry.amount;
        const sym = tokenEntry.token_id
          ? tokenSymbolMap.get(tokenEntry.token_id)
          : undefined;
        token = sym || tokenEntry.token_id || "TOKEN";
      } else if (hbarEntry) {
        amount = tinybarToHBAR(hbarEntry.amount);
        token = "HBAR";
      }

      // Counterparty: pick the other side of the first relevant transfer
      let counterparty = "";
      if (tokenEntry) {
        const other = (tx.token_transfers || []).find(
          (t) => t.token_id === tokenEntry.token_id && t.account !== accountId
        );
        counterparty = other?.account || "";
      } else if (hbarEntry) {
        const other = (tx.transfers || []).find((t) => t.account !== accountId);
        counterparty = other?.account || "";
      }

      // Timestamp to ISO
      const sec = parseInt(
        (tx.consensus_timestamp || "0").split(".")[0] || "0",
        10
      );
      const timestamp = new Date(sec * 1000).toISOString();

      const status: "success" | "failed" =
        tx.result === "SUCCESS" ? "success" : "failed";

      return {
        id: tx.transaction_id || tx.consensus_timestamp,
        type: tx.name,
        timestamp,
        amount,
        token: token || "HBAR",
        counterparty: counterparty || "—",
        fee:
          typeof tx.charged_tx_fee === "number"
            ? tinybarToHBAR(tx.charged_tx_fee)
            : 0,
        hash: tx.transaction_hash || "",
        status,
      };
    });
    return list;
  }, [txInfinite.data?.pages, accountId, tokenSymbolMap, tokenDecimalsMap]);

  const breadcrumbItems = !accountId
    ? [{ label: "Account Explorer", active: true }]
    : [
        { label: "Account Explorer" },
        { label: `Account ${accountId}`, active: true },
      ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Breadcrumb items={breadcrumbItems} onHomeClick={() => navigate("/")} />

        {!accountId ? null : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Account {accountId}</h2>
                <p className="text-muted-foreground">
                  Track activity and portfolio for this account
                </p>
              </div>
              <FollowButton
                accountId={accountId}
                accountName={`Account ${accountId}`}
              />
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="nfts">NFTs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AccountBalance
                    accountId={accountId}
                    usdValue={usdValue}
                    createdAt={createdAt}
                  />
                  <NetWorthChart data={networthData} accountId={accountId} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <TokenList
                      tokens={tokens}
                      isLoading={
                        isBalanceLoading || isPriceLoading || isTokensLoading
                      }
                      hideZeroUsd={hideZeroUsd}
                      onHideZeroUsdChange={setHideZeroUsd}
                      currentAccountId={accountId}
                    />
                  </div>

                  <div className="space-y-6">
                    <PortfolioDiversificationChart
                      tokens={tokens}
                      isLoading={
                        isBalanceLoading || isPriceLoading || isTokensLoading
                      }
                    />
                  </div>
                </div>

                {(isBalanceError || isPriceError) && (
                  <div className="text-sm text-destructive">
                    Failed to load live data. Please try again.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transactions">
                <TransactionHistory
                  accountId={accountId}
                  transactions={mappedTransactions}
                  hasMore={!!txInfinite.hasNextPage}
                  onLoadMore={() => txInfinite.fetchNextPage()}
                  isLoadingMore={txInfinite.isFetchingNextPage}
                />
              </TabsContent>

              <TabsContent value="nfts">
                <NFTList
                  nfts={nfts}
                  isLoading={isTokensLoading}
                  accountId={accountId}
                />
              </TabsContent>

            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};
