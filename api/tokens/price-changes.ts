// Serverless function to fetch token price changes from SaucerSwap API
// Runtime target: Vercel serverless function (Node.js)

const SAUCERSWAP_DEFAULT_TOKENS = "https://api.saucerswap.finance/tokens/default";

type SaucerSwapDefaultToken = {
  id: string;
  symbol: string;
  priceUsd: number;
  liquidityUsd: number;
  priceChangeHour: number;
  priceChangeDay: number;
  priceChangeWeek: number;
};

type TokenPriceChangesResponse = SaucerSwapDefaultToken[];

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

    const response = await fetch(SAUCERSWAP_DEFAULT_TOKENS, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch token price changes from SaucerSwap',
        status: response.status 
      });
    }

    const data = (await response.json()) as TokenPriceChangesResponse;

    // Cache for 1 minute
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal Server Error', details: message });
  }
}
