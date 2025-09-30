import { useQueries } from "@tanstack/react-query";
import { getTopTokenHolders, getTokenInfo, MirrorNodeTokenInfo, TokenBalanceEntry } from "@/queries";

export interface WhaleData {
  tokenId: string;
  isWhale: boolean;
  rank?: number; // Position in top holders (1 = biggest holder)
  percentage?: number; // Percentage of total supply held
}

/**
 * useWhaleStatus
 * Checks if the provided account is among the top N holders for a single token.
 */
export const useWhaleStatus = (
  tokenId: string | undefined,
  accountId: string | undefined,
  topN: number = 100
) => {
  const enabled = !!tokenId && !!accountId;
  const queries = useQueries({
    queries: [
      {
        queryKey: ["token", tokenId, "info"],
        queryFn: () => getTokenInfo(tokenId as string),
        enabled,
        staleTime: 10 * 60_000,
      },
      {
        queryKey: ["token", tokenId, "balances", { limit: topN }],
        queryFn: () => getTopTokenHolders(tokenId as string, topN),
        enabled,
        staleTime: 60_000,
      },
    ],
  });

  const isLoading = queries.some((q) => q.isLoading);
  const info = queries[0]?.data as MirrorNodeTokenInfo | null | undefined;
  const balances = (queries[1]?.data as TokenBalanceEntry[] | undefined) ?? [];

  let data: WhaleData | undefined;
  if (enabled && info) {
    const idx = balances.findIndex((b) => b.account === accountId);
    if (idx !== -1) {
      const rank = idx + 1;
      const totalSupply = info.total_supply ?? 0;
      const balance = balances[idx]?.balance ?? 0;
      const percentage = totalSupply > 0 ? (balance / totalSupply) * 100 : undefined;
      data = {
        tokenId: tokenId!,
        isWhale: true,
        rank,
        percentage: typeof percentage === "number" ? parseFloat(percentage.toFixed(4)) : undefined,
      };
    } else {
      data = { tokenId: tokenId!, isWhale: false };
    }
  }

  return { data, isLoading };
};

/**
 * useWhaleDetection
 * Batch variant for multiple tokens. Returns a map tokenId => WhaleData
 */
export const useWhaleDetection = (
  accountId: string | undefined,
  tokenIds: string[],
  topN: number = 100
) => {
  const enabled = !!accountId && tokenIds.length > 0;
  const perTokenQueries = useQueries({
    queries: tokenIds.map((tokenId) => ({
      queryKey: ["whale", tokenId, accountId, { topN }],
      queryFn: async () => {
        const [info, balances] = await Promise.all([
          getTokenInfo(tokenId),
          getTopTokenHolders(tokenId, topN),
        ]);
        if (!info) return { tokenId, isWhale: false } as WhaleData;
        const idx = (balances ?? []).findIndex((b) => b.account === accountId);
        if (idx === -1) return { tokenId, isWhale: false } as WhaleData;
        const rank = idx + 1;
        const totalSupply = info.total_supply ?? 0;
        const balance = balances[idx]?.balance ?? 0;
        const percentage = totalSupply > 0 ? (balance / totalSupply) * 100 : undefined;
        return {
          tokenId,
          isWhale: true,
          rank,
          percentage: typeof percentage === "number" ? parseFloat(percentage.toFixed(4)) : undefined,
        } as WhaleData;
      },
      enabled,
      staleTime: 60_000,
    })),
  });

  const isLoading = perTokenQueries.some((q) => q.isLoading);
  const map: Record<string, WhaleData> = {};
  tokenIds.forEach((id, i) => {
    map[id] = (perTokenQueries[i]?.data as WhaleData) ?? { tokenId: id, isWhale: false };
  });

  return { data: map, isLoading };
};