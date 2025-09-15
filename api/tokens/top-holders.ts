// Serverless function to aggregate and cache top token holders for a tokenId
// Runtime target: Vercel serverless function (Node.js)

const MIRROR_NODE = 'https://mainnet.mirrornode.hedera.com';

// Basic caps and defaults to protect the backend
const DEFAULT_TTL_SECONDS = 900; // 15 minutes
const MAX_TOP_N = 1000;
const MAX_PAGE_LIMIT = 1000;
const MAX_MAX_PAGES = 200;

/**
 * Utility helpers
 */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeCacheKey(tokenId: string, topN: number, pageLimit: number) {
  return `top-holders:${tokenId}:${topN}:${pageLimit}`;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'hedgie-wealth-view/1.0' },
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) {
      const backoff = 300 * Math.pow(2, attempt);
      await delay(backoff);
      return fetchWithBackoff(url, attempt + 1);
    }
  }
  return res;
}

export type TokenBalanceEntry = { account: string; balance: number };
export type TokenBalancesResponse = {
  timestamp?: string;
  balances: TokenBalanceEntry[];
  links?: { next?: string | null };
};

async function getTokenBalancesPage(
  tokenId: string,
  limit: number,
  next: string | null
): Promise<TokenBalancesResponse> {
  const url = next
    ? `${MIRROR_NODE}${next.startsWith('/') ? '' : '/'}${next}`
    : `${MIRROR_NODE}/api/v1/tokens/${encodeURIComponent(tokenId)}/balances?limit=${limit}`;
  const res = await fetchWithBackoff(url);
  if (!res.ok) return { balances: [], links: { next: null } };
  return (await res.json()) as TokenBalancesResponse;
}

// Minimal request/response types to avoid bringing in @vercel/node types
type Req = { query?: Record<string, unknown>; body?: Record<string, unknown> };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

// Note: avoid importing @vercel/node types to keep this file dependency-free in the app repo
export default async function handler(req: Req, res: Res) {
  try {
    const tokenId = String((req.query?.tokenId ?? req.body?.tokenId ?? '').toString().trim());
    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' });
    }

    const _topN = parseInt(String(req.query?.topN ?? req.body?.topN ?? '100'), 10);
    const _pageLimit = parseInt(String(req.query?.pageLimit ?? req.body?.pageLimit ?? '100'), 10);
    const _maxPages = parseInt(String(req.query?.maxPages ?? req.body?.maxPages ?? '999'), 10);
    const _ttl = parseInt(String(req.query?.ttl ?? req.body?.ttl ?? DEFAULT_TTL_SECONDS), 10);

    const topN = clamp(Number.isFinite(_topN) ? _topN : 100, 1, MAX_TOP_N);
    const pageLimit = clamp(Number.isFinite(_pageLimit) ? _pageLimit : 100, 1, MAX_PAGE_LIMIT);
    const maxPages = clamp(Number.isFinite(_maxPages) ? _maxPages : 999, 1, MAX_MAX_PAGES);
    const ttl = clamp(Number.isFinite(_ttl) ? _ttl : DEFAULT_TTL_SECONDS, 60, 3600);

    // const cacheKey = makeCacheKey(tokenId, topN, pageLimit);

    // TODO: Integrate Redis (e.g., Upstash) here for cross-instance cache.
    // For now, we set HTTP cache headers so CDN/proxy can cache.

    let holders: TokenBalanceEntry[] = [];
    let pagesFetched = 0;
    let next: string | null = null;
    let sourceTimestamp: string | undefined;

    do {
      const page = await getTokenBalancesPage(tokenId, pageLimit, next);
      holders = holders.concat(page.balances || []);
      if (!sourceTimestamp && page.timestamp) sourceTimestamp = page.timestamp;
      next = page?.links?.next ?? null;
      pagesFetched += 1;
    } while (next && pagesFetched < maxPages);

    holders.sort((a, b) => (b.balance || 0) - (a.balance || 0));
    const data = holders.slice(0, topN);

    const payload = {
      data,
      meta: {
        tokenId,
        topN,
        pageLimit,
        pagesFetched,
        sourceTimestamp: sourceTimestamp || null,
        fetchedAt: new Date().toISOString(),
        cached: false,
        cacheTtlSeconds: ttl,
      },
    };

    // Public caching headers for Vercel/Browser/CDN
    res.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${ttl}`);
    return res.status(200).json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal Server Error', details: message });
  }
}
