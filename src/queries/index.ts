import { useQuery, useQueries } from "@tanstack/react-query";

/**
 * Mirror Node + Price APIs
 */
const MIRROR_NODE = "https://mainnet.mirrornode.hedera.com";
const COINGECKO_PRICE =
  "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd&include_24hr_change=true";
const HASHPACK_PRICES = "https://api-lb.hashpack.app/prices";
const HASHPACK_TOKEN_INFO =
  "https://hashpack-mirror.b-cdn.net/getTokenInfo?network=mainnet&token_ids=";
const HASHPACK_PRICE_CHANGES = "https://api.hashpack.app/price-changes";

/**
 * Types
 */
type MirrorNodeBalanceEntry = {
  account: string;     // e.g. "0.0.12345"
  balance: number;     // tinybars
  tokens?: Array<{
    token_id: string;
    balance: number;
  }>;
};

type MirrorNodeBalancesResponse = {
  timestamp?: string;
  balances: MirrorNodeBalanceEntry[];
};

type HbarPriceResponse = {
  ["hedera-hashgraph"]?: {
    usd: number;
    usd_24h_change?: number;
  };
};

/**
 * Utilities
 */
export const tinybarToHBAR = (tinybars: number | undefined | null): number => {
  if (!tinybars) return 0;
  return tinybars / 100_000_000;
};

/**
 * Account Info (Mirror Node)
 */
type MirrorNodeAccount = {
  account: string;
  created_timestamp?: string;
  [k: string]: unknown;
};


type MirrorNodeAccountResponse = MirrorNodeAccount;

const getAccountInfo = async (walletId: string): Promise<MirrorNodeAccount | null> => {
  if (!walletId) return null;
  const url = `${MIRROR_NODE}/api/v1/accounts/${encodeURIComponent(walletId)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as MirrorNodeAccountResponse;
  return data as MirrorNodeAccount;
};

export const useAccountInfo = (walletId: string) => {
  return useQuery({
    queryKey: ["account", walletId, "info"],
    queryFn: () => getAccountInfo(walletId),
    enabled: !!walletId,
    staleTime: 5 * 60_000,
  });
};

/**
 * Balance Query
 */
export const getHBARBalance = async (walletId: string): Promise<MirrorNodeBalanceEntry | null> => {
  if (!walletId) return null;

  const url = `${MIRROR_NODE}/api/v1/balances?account.id=${encodeURIComponent(walletId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    // Invalid account or transient error
    return null;
  }
  const data = (await res.json()) as MirrorNodeBalancesResponse;
  return data?.balances?.[0] ?? null;
};

export const useHBARBalance = (walletId: string) => {
  return useQuery({
    queryKey: ["hbar", "balance", walletId],
    queryFn: () => getHBARBalance(walletId),
    enabled: !!walletId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
};

/**
 * Price Query (CoinGecko)
 */
const getHBARPrice = async (): Promise<{ usd: number; usdChange24h: number }> => {
  const res = await fetch(COINGECKO_PRICE, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    // Fallback if rate-limited
    return { usd: 0.00, usdChange24h: 0 };
  }
  const data = (await res.json()) as HbarPriceResponse;
  const node = data?.["hedera-hashgraph"];
  return {
    usd: node?.usd ?? 0.063,
    usdChange24h: node?.usd_24h_change ?? 0,
  };
};

export const useHBARPrice = () => {
  return useQuery({
    queryKey: ["hbar", "price", "usd"],
    queryFn: getHBARPrice,
    staleTime: 60_000, // 1 min
    gcTime: 10 * 60_000,
    retry: 1,
  });
};

/**
 * Account Tokens (Mirror Node)
 */
type AccountTokenBalance = {
  token_id: string;
  balance: number; // integer in smallest unit
  decimals?: number;
};

type AccountTokensResponse = {
  tokens: AccountTokenBalance[];
  links?: { next?: string };
};

const getAccountTokens = async (walletId: string): Promise<AccountTokenBalance[]> => {
  if (!walletId) return [];
  const url = `${MIRROR_NODE}/api/v1/accounts/${encodeURIComponent(walletId)}/tokens?limit=100`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as AccountTokensResponse;
  return data?.tokens ?? [];
};

type TokenInfo = {
  token_id: string;
  symbol: string;
  name: string;
  decimals: number;
  type?: "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE" | string;
};

// Batched token info fetch (HashPack mirror)
const getTokenInfosBatch = async (tokenIds: string[]): Promise<Record<string, TokenInfo>> => {
  if (!tokenIds.length) return {};
  const url = `${HASHPACK_TOKEN_INFO}${encodeURIComponent(tokenIds.join(","))}`;
  const res = await fetch(url);
  if (!res.ok) return {};
  type TokenInfoResponse = Array<{
    token_id?: string;
    symbol?: string;
    name?: string;
    decimals?: string;
    type?: "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE" | string;
  }>;
  const data = (await res.json()) as TokenInfoResponse;
  const map: Record<string, TokenInfo> = {};
  (data || []).forEach((d) => {
    const id = d.token_id as string;
    if (!id) return;
    map[id] = {
      token_id: id,
      symbol: d.symbol ?? id,
      name: d.name ?? id,
      decimals: typeof d.decimals === "string" ? parseFloat(d.decimals) : 0,
      type: d.type,
    };
  });
  return map;
};

const useAccountTokens = (walletId: string) => {
  return useQuery({
    queryKey: ["account", walletId, "tokens"],
    queryFn: () => getAccountTokens(walletId),
    enabled: !!walletId,
    staleTime: 30_000,
  });
};

export const useAccountTokenDetails = (walletId: string) => {
  const tokensQuery = useAccountTokens(walletId);
  const tokenIds = Array.from(
    new Set((tokensQuery.data ?? []).map((t) => t.token_id).filter(Boolean))
  );

  const infosQuery = useQuery({
    queryKey: ["token_infos", walletId, tokenIds.join(",")],
    queryFn: () => getTokenInfosBatch(tokenIds),
    enabled: !!walletId && tokenIds.length > 0,
    staleTime: 10 * 60_000,
  });

  const isLoading = tokensQuery.isLoading || infosQuery.isLoading;
  const isError = tokensQuery.isError || infosQuery.isError;

  const infoMap = infosQuery.data ?? {};
  const details = (tokensQuery.data ?? []).map((t) => {
    const info = infoMap[t.token_id];
    return {
      token_id: t.token_id,
      balance: t.balance,
      decimals: info?.decimals ?? t.decimals ?? 0,
      symbol: info?.symbol ?? t.token_id,
      name: info?.name ?? t.token_id,
      type: info?.type,
    } as TokenInfo & { balance: number };
  });

  return { data: details, isLoading, isError };
};

/**
 * Token Prices (HashPack API)
 */
export type TokenPricesResponse =
  | Record<string, number>
  | Array<{
      id?: string;
      token_id?: string;
      priceUsd?: number;
      price?: number; // legacy/alternate field
      [k: string]: unknown;
    }>;

const getTokenPrices = async (): Promise<TokenPricesResponse> => {
  // Axios equivalent: axios.post(HASHPACK_PRICES)
  const res = await fetch(HASHPACK_PRICES, { method: "POST" });
  if (!res.ok) return [] as unknown as TokenPricesResponse;
  return (await res.json()) as TokenPricesResponse;
};

export const useTokenPrices = (accountId: string) => {
  return useQuery({
    queryKey: ["prices"],
    queryFn: getTokenPrices,
    enabled: !!accountId,
    staleTime: 60_000,
  });
};

/**
 * Token 24h Price Changes (HashPack API)
 * Returns a map of token_id => percent change (e.g., -15.08). Some entries can be null.
 */
type TokenPriceChangesResponse = Record<string, number | null>;

const getTokenPriceChanges = async (
  network: "mainnet" | "testnet" = "mainnet"
): Promise<TokenPriceChangesResponse> => {
  const res = await fetch(HASHPACK_PRICE_CHANGES, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ network }),
  });
  if (!res.ok) return {} as TokenPriceChangesResponse;
  return (await res.json()) as TokenPriceChangesResponse;
};

export const useTokenPriceChanges = (enabled: boolean = true, network: "mainnet" | "testnet" = "mainnet") => {
  return useQuery({
    queryKey: ["prices", "changes", network],
    queryFn: () => getTokenPriceChanges(network),
    enabled,
    staleTime: 60_000,
  });
};
