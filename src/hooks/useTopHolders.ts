import { useQuery } from "@tanstack/react-query";

export interface TopHolderData {
  account: string;
  balance: number;
}

export interface TopHoldersResponse {
  data: TopHolderData[];
  meta: {
    tokenId: string;
    topN: number;
    pageLimit: number;
    pagesFetched: number;
    sourceTimestamp: string | null;
    fetchedAt: string;
    cached: boolean;
    cacheTtlSeconds: number;
  };
}

const base = import.meta.env.MODE === "development" ? "https://hbarwatch.vercel.app" : "";

export const useTopHolders = (tokenId: string, topN: number = 100) => {
  return useQuery({
    queryKey: ["topHolders", tokenId, topN],
    queryFn: async (): Promise<TopHoldersResponse> => {
      if (!tokenId) throw new Error("Token ID is required");
      
      const url = `${base}/api/tokens/top-holders?tokenId=${encodeURIComponent(tokenId)}&topN=${topN}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch top holders: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!tokenId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};