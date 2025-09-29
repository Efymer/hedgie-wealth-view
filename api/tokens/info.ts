// Serverless function to fetch token information from SaucerSwap API
// Runtime target: Vercel serverless function (Node.js)

const SAUCERSWAP_FULL_TOKENS = "https://api.saucerswap.finance/tokens/full";

type TokenInfo = {
  token_id: string;
  symbol: string;
  name: string;
  decimals: number;
  type?: "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE" | string;
  price?: string;
  priceUsd?: number;
  dueDiligenceComplete?: boolean;
  isFeeOnTransferToken?: boolean;
  description?: string;
  website?: string;
  sentinelReport?: string;
  twitterHandle?: string;
  icon?: string;
};

type SaucerSwapFullToken = {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  price?: string;
  priceUsd?: number;
  dueDiligenceComplete?: boolean;
  isFeeOnTransferToken?: boolean;
  description?: string;
  website?: string;
  sentinelReport?: string;
  twitterHandle?: string;
};

// Minimal request/response types
type Req = { query?: Record<string, unknown>; body?: Record<string, unknown> };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: Req, res: Res) {
  try {
    const apiKey = process.env.SAUCERSWAP_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SAUCERSWAP_KEY environment variable not configured' });
    }

    const response = await fetch(SAUCERSWAP_FULL_TOKENS, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch token information from SaucerSwap',
        status: response.status 
      });
    }

    const data = (await response.json()) as SaucerSwapFullToken[];
    const tokenMap: Record<string, TokenInfo> = {};

    (data || []).forEach((token) => {
      const id = token.id;
      if (!id) return;

      tokenMap[id] = {
        token_id: id,
        symbol: token.symbol ?? id,
        name: token.name ?? id,
        decimals: token.decimals ?? 0,
        type: "FUNGIBLE_COMMON", // SaucerSwap only deals with fungible tokens
        price: token.price,
        priceUsd: token.priceUsd,
        dueDiligenceComplete: token.dueDiligenceComplete,
        isFeeOnTransferToken: token.isFeeOnTransferToken,
        description: token.description,
        website: token.website,
        sentinelReport: token.sentinelReport,
        twitterHandle: token.twitterHandle,
        icon: token.icon,
      };
    });

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=300');
    return res.status(200).json(tokenMap);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal Server Error', details: message });
  }
}
