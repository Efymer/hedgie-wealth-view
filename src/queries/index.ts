import { useQuery, useQueries, useInfiniteQuery } from "@tanstack/react-query";

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
  account: string; // e.g. "0.0.12345"
  balance: number; // tinybars
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
  // Staking-related fields (if present)
  staked_node_id?: number | null;
  staked_account_id?: string | null;
  decline_reward?: boolean | null;
  [k: string]: unknown;
};

type MirrorNodeAccountResponse = MirrorNodeAccount;

const getAccountInfo = async (
  walletId: string
): Promise<MirrorNodeAccount | null> => {
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
export const getHBARBalance = async (
  walletId: string
): Promise<MirrorNodeBalanceEntry | null> => {
  if (!walletId) return null;

  const url = `${MIRROR_NODE}/api/v1/balances?account.id=${encodeURIComponent(
    walletId
  )}`;
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
 * Transactions (Mirror Node)
 */
export type MirrorNodeTransaction = {
  transaction_id: string;
  consensus_timestamp: string; // e.g., "1757376159.611104000"
  name: string; // e.g., "CRYPTOTRANSFER", "CONTRACTCALL"
  result: string; // e.g., "SUCCESS"
  parent_consensus_timestamp?: string | null;
  charged_tx_fee?: number; // tinybars
  transaction_hash?: string; // base64
  node?: string | null;
  token_transfers?: Array<{
    token_id: string;
    account: string;
    amount: number;
    is_approval?: boolean;
  }>;
  transfers?: Array<{
    account: string;
    amount: number; // tinybars (HBAR)
    is_approval?: boolean;
  }>;
};

type MirrorNodeTransactionsResponse = {
  transactions: MirrorNodeTransaction[];
  links?: { next?: string | null };
};

const getAccountTransactions = async (
  walletId: string
): Promise<MirrorNodeTransaction[]> => {
  if (!walletId) return [];
  const url = `${MIRROR_NODE}/api/v1/transactions/?account.id=${encodeURIComponent(
    walletId
  )}&limit=20&order=desc`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as MirrorNodeTransactionsResponse;
  return data?.transactions ?? [];
};

export const useAccountTransactions = (walletId: string) => {
  return useQuery({
    queryKey: ["account", walletId, "transactions"],
    queryFn: () => getAccountTransactions(walletId),
    enabled: !!walletId,
    staleTime: 30_000,
  });
};

// Infinite pagination for transactions
const getAccountTransactionsPage = async (
  walletId: string,
  next: string | null
): Promise<MirrorNodeTransactionsResponse> => {
  let url: string;
  if (next) {
    // next is a path like "/api/v1/transactions?account.id=...&timestamp=lt:..."
    url = `${MIRROR_NODE}${next.startsWith("/") ? "" : "/"}${next}`;
  } else {
    url = `${MIRROR_NODE}/api/v1/transactions/?account.id=${encodeURIComponent(
      walletId
    )}&limit=10&order=desc`;
  }
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { transactions: [], links: { next: null } };
  return (await res.json()) as MirrorNodeTransactionsResponse;
};

export const useAccountTransactionsInfinite = (walletId: string) => {
  return useInfiniteQuery({
    queryKey: ["account", walletId, "transactions", "infinite"],
    enabled: !!walletId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      getAccountTransactionsPage(walletId, pageParam),
    getNextPageParam: (lastPage) => lastPage?.links?.next ?? null,
    staleTime: 30_000,
  });
};

/**
 * Price Query (CoinGecko)
 */
const getHBARPrice = async (): Promise<{
  usd: number;
  usdChange24h: number;
}> => {
  const res = await fetch(COINGECKO_PRICE, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    // Fallback if rate-limited
    return { usd: 0.0, usdChange24h: 0 };
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

const getAccountTokens = async (
  walletId: string
): Promise<AccountTokenBalance[]> => {
  if (!walletId) return [];
  const url = `${MIRROR_NODE}/api/v1/accounts/${encodeURIComponent(
    walletId
  )}/tokens?limit=100`;
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
const getTokenInfosBatch = async (
  tokenIds: string[]
): Promise<Record<string, TokenInfo>> => {
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

export const useTokenPriceChanges = (
  enabled: boolean = true,
  network: "mainnet" | "testnet" = "mainnet"
) => {
  return useQuery({
    queryKey: ["prices", "changes", network],
    queryFn: () => getTokenPriceChanges(network),
    enabled,
    staleTime: 60_000,
  });
};

/**
 * Network Nodes (Mirror Node)
 */
type MirrorNodeNode = {
  node_id: number;
  description?: string;
  account_id?: string;
  [k: string]: unknown;
};

type MirrorNodeNodesResponse = {
  nodes: MirrorNodeNode[];
  links?: { next?: string | null };
};

const getNetworkNodes = async (): Promise<MirrorNodeNode[]> => {
  // Fetch up to 200 nodes; mainnet has far fewer
  const url = `${MIRROR_NODE}/api/v1/network/nodes?limit=200`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as MirrorNodeNodesResponse;
  return data?.nodes ?? [];
};

export const useNetworkNodes = () => {
  return useQuery({
    queryKey: ["network", "nodes"],
    queryFn: getNetworkNodes,
    staleTime: 10 * 60_000,
  });
};

/**
 * NFTs (Mirror Node + IPFS via HashPack CDN)
 */
export type AccountNFT = {
  token_id: string; // e.g. "0.0.12345"
  serial_number: number;
  metadata?: string; // base64-encoded
  [k: string]: unknown;
};

type AccountNFTsResponse = {
  nfts: AccountNFT[];
  links?: { next?: string | null };
};

const getAccountNFTs = async (walletId: string): Promise<AccountNFT[]> => {
  if (!walletId) return [];
  const url = `${MIRROR_NODE}/api/v1/accounts/${encodeURIComponent(
    walletId
  )}/nfts?limit=100`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as AccountNFTsResponse;
  return data?.nfts ?? [];
};

export const useAccountNFTs = (walletId: string) => {
  return useQuery({
    queryKey: ["account", walletId, "nfts"],
    queryFn: () => getAccountNFTs(walletId),
    enabled: !!walletId,
    staleTime: 60_000,
  });
};

// Helper to extract CID from base64-encoded metadata containing an ipfs:// URI
export const extractCIDFromBase64Metadata = (
  metadataBase64?: string | null
): string | null => {
  if (!metadataBase64) return null;
  try {
    // Browser base64 decode (Vite app runs in browser)
    if (typeof atob !== "function") return null;
    const jsonStr = atob(metadataBase64);
    // Attempt to parse JSON first; if it fails, fall back to raw string search
    try {
      const obj = JSON.parse(jsonStr);
      const val: unknown =
        (obj as Record<string, unknown>)?.["uri"] ??
        (obj as Record<string, unknown>)?.["metadata"] ??
        (obj as Record<string, unknown>)?.["ipfs"] ??
        (obj as Record<string, unknown>)?.["image"];
      if (typeof val === "string") {
        const m = val.match(/ipfs:\/\/([^\s"']+)/i);
        if (m?.[1]) return m[1];
      }
      // If JSON has no uri/image, still try raw string
    } catch (_) {
      // Not JSON, continue to raw extraction
    }
    const rawMatch = jsonStr.match(/ipfs:\/\/([^\s"']+)/i);
    if (rawMatch?.[1]) return rawMatch[1];
  } catch {
    // ignore
  }
  return null;
};

// Given a CID, fetch JSON metadata via HashPack CDN gateway
export const getNFTMetadata = async (
  cid: string | null | undefined
): Promise<unknown | null> => {
  if (!cid) return null;
  const url = `https://hashpack.b-cdn.net/ipfs/${cid}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  // Some metadata can be JSON; others might be images. Try JSON first, fallback to blob URL if not JSON
  try {
    const data = await res.json();
    return data;
  } catch {
    // Not JSON; return null (callers can handle separately if needed)
    return null;
  }
};

export const useNFTMetadata = (
  metadataBase64?: string | null,
  enabled: boolean = true
) => {
  const cid = extractCIDFromBase64Metadata(metadataBase64);
  return useQuery({
    queryKey: ["nft", "metadata", cid],
    queryFn: () => getNFTMetadata(cid),
    enabled: !!cid && enabled,
    staleTime: 10 * 60_000,
  });
};

/**
 * Token Balances (Mirror Node)
 * GET /api/v1/tokens/{tokenId}/balances
 */
export type TokenBalanceEntry = {
  account: string;
  balance: number; // smallest unit
};

export type TokenBalancesResponse = {
  timestamp?: string;
  balances: TokenBalanceEntry[];
  links?: { next?: string | null };
};

export const getTokenBalances = async (
  tokenId: string,
  limit: number = 100
): Promise<TokenBalanceEntry[]> => {
  if (!tokenId) return [];
  const url = `${MIRROR_NODE}/api/v1/tokens/${encodeURIComponent(
    tokenId
  )}/balances?order=desc&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as TokenBalancesResponse;
  return data?.balances ?? [];
};

export const useTokenBalances = (
  tokenId: string,
  limit: number = 100,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["token", tokenId, "balances", { limit }],
    queryFn: () => getTokenBalances(tokenId, limit),
    enabled: !!tokenId && enabled,
    staleTime: 60_000,
  });
};

export const getTopTokenHolders = async (
  tokenId: string,
  topN: number = 100,
): Promise<TokenBalanceEntry[]> => {
  if (!tokenId) return [];
  // Delegate heavy pagination + caching to serverless backend
  const base = import.meta.env.MODE === 'development' ? 'https://hbarwatch.vercel.app' : '';
  const url = `${base}/api/tokens/top-holders?tokenId=${encodeURIComponent(
    tokenId
  )}&topN=${topN}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Backend responded ${res.status}`);
  const data = (await res.json()) as { data?: TokenBalanceEntry[] };
  return data?.data ?? [];
};

export const useTopTokenHolders = (
  tokenId: string,
  topN: number = 100,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["token", tokenId, "topHolders", { topN }],
    queryFn: () => getTopTokenHolders(tokenId, topN),
    enabled: !!tokenId && enabled,
    staleTime: 60_000,
  });
};

/**
 * Token Info (Mirror Node)
 * GET /api/v1/tokens/{tokenId}
 */
export type MirrorNodeTokenInfo = {
  token_id: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  total_supply?: number; // in smallest unit
  type?: string;
  [k: string]: unknown;
};

export const getTokenInfo = async (
  tokenId: string
): Promise<MirrorNodeTokenInfo | null> => {
  if (!tokenId) return null;
  const url = `${MIRROR_NODE}/api/v1/tokens/${encodeURIComponent(tokenId)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  return (await res.json()) as MirrorNodeTokenInfo;
};

export const useTokenInfo = (tokenId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["token", tokenId, "info"],
    queryFn: () => getTokenInfo(tokenId),
    enabled: !!tokenId && enabled,
    staleTime: 10 * 60_000,
  });
};
