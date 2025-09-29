// Serverless function to fetch tokens for autocomplete from SaucerSwap API
// Runtime target: Vercel serverless function (Node.js)

const SAUCERSWAP_TOKENS = "https://api.saucerswap.finance/tokens";

export type TokenOption = {
  token_id: string;
  symbol: string;
  name: string;
  priceUsd?: number;
};

type TokenPricesResponse =
  | Record<string, number>
  | Array<{
      id?: string;
      token_id?: string;
      symbol?: string;
      name?: string;
      priceUsd?: number;
      price?: number;
      [k: string]: unknown;
    }>;

type HashPackTokenData = {
  id?: string;
  token_id?: string;
  symbol?: string;
  name?: string;
  priceUsd?: number;
  price?: number;
  [k: string]: unknown;
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

    const response = await fetch(SAUCERSWAP_TOKENS, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch tokens from SaucerSwap',
        status: response.status 
      });
    }

    const data = (await response.json()) as TokenPricesResponse;
    let tokens: TokenOption[] = [];

    if (Array.isArray(data)) {
      tokens = data
        .map((token: HashPackTokenData) => ({
          token_id: (token.id || token.token_id || "") as string,
          symbol: (token.symbol || token.token_id || token.id || "") as string,
          name: (token.name ||
            token.symbol ||
            token.token_id ||
            token.id ||
            "") as string,
          priceUsd: token.priceUsd || token.price || 0,
        }))
        .filter((token) => token.token_id && token.symbol);
    } else {
      // If it's a Record format, we can't get names without additional API calls
      tokens = Object.keys(data).map((tokenId) => ({
        token_id: tokenId,
        symbol: tokenId,
        name: tokenId,
        priceUsd: data[tokenId],
      }));
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=150');
    return res.status(200).json(tokens);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal Server Error', details: message });
  }
}
