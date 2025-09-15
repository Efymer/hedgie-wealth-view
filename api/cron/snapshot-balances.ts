// Nightly snapshot of account net worths (USD) stored in Redis
// - Triggered by Vercel Cron nightly, or manually via POST with { accounts: string[] }

import Redis from "ioredis";

const MIRROR_NODE = "https://mainnet.mirrornode.hedera.com";
const COINGECKO_PRICE =
  "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd";
const HASHPACK_TOKEN_INFO =
  "https://hashpack-mirror.b-cdn.net/getTokenInfo?network=mainnet&token_ids=";
const HASHPACK_PRICES = "https://api-lb.hashpack.app/prices";

type Req = { method?: string; query?: Record<string, unknown>; body?: any };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type AccountTokenBalance = {
  token_id: string;
  balance: number;
  decimals?: number;
};
type AccountTokensResponse = {
  tokens: AccountTokenBalance[];
  links?: { next?: string };
};

type TokenInfo = {
  token_id: string;
  symbol?: string;
  name?: string;
  decimals?: string | number;
  type?: string;
};
type TokenInfoResponse = Array<TokenInfo>;

type PricesResponse =
  | Record<string, number>
  | Array<{
      token_id?: string;
      id?: string;
      priceUsd?: number;
      price?: number;
    }>;

const redis = new Redis(process.env.REDIS_URL as string);

// Utilities
const midnightUTC = (d = new Date()) => {
  const utc = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
  return utc;
};
const toEpochSeconds = (date: Date) => Math.floor(date.getTime() / 1000);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

// Mirror Node fetches
async function getHBARBalance(accountId: string): Promise<number> {
  const url = `${MIRROR_NODE}/api/v1/balances?account.id=${encodeURIComponent(
    accountId
  )}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return 0;
  const json = (await res.json()) as {
    balances: Array<{ account: string; balance: number }>;
  };
  return json?.balances?.[0]?.balance ?? 0;
}

async function getAccountTokens(
  accountId: string
): Promise<AccountTokenBalance[]> {
  const url = `${MIRROR_NODE}/api/v1/accounts/${encodeURIComponent(
    accountId
  )}/tokens?limit=100`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as AccountTokensResponse;
  return json?.tokens ?? [];
}

async function getTokenInfos(
  tokenIds: string[]
): Promise<Record<string, { decimals: number }>> {
  if (!tokenIds.length) return {};
  const url = `${HASHPACK_TOKEN_INFO}${encodeURIComponent(tokenIds.join(","))}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return {};
  const data = (await res.json()) as TokenInfoResponse;
  const map: Record<string, { decimals: number }> = {};
  (data || []).forEach((t) => {
    const id = t.token_id;
    if (!id) return;
    const dec =
      typeof t.decimals === "string"
        ? parseFloat(t.decimals)
        : typeof t.decimals === "number"
        ? t.decimals
        : 0;
    map[id] = { decimals: Number.isFinite(dec) ? dec : 0 };
  });
  return map;
}

async function getHBARPriceUSD(): Promise<number> {
  const res = await fetch(COINGECKO_PRICE, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as {
    ["hedera-hashgraph"]?: { usd?: number };
  };
  return data?.["hedera-hashgraph"]?.usd ?? 0;
}

// HashPack prices API returns either a map or an array
async function getTokenPrices(): Promise<Record<string, number>> {
  const res = await fetch(HASHPACK_PRICES, { method: "POST" });
  if (!res.ok) return {};
  const payload = (await res.json()) as PricesResponse;
  const out: Record<string, number> = {};
  if (Array.isArray(payload)) {
    // Array form
    for (const item of payload) {
      const id = item.token_id || item.id;
      const p = item.priceUsd ?? item.price;
      if (id && typeof p === "number") out[id] = p;
    }
  } else if (payload && typeof payload === "object") {
    // Map form
    for (const [id, p] of Object.entries(payload)) {
      if (typeof p === "number") out[id] = p;
    }
  }
  return out;
}

function tinybarToHBAR(tinybars: number) {
  return (tinybars || 0) / 100_000_000;
}

// Compute net worth (USD) for a single account id at “now”
async function computeNetWorthUSD(
  accountId: string
): Promise<{ value: number; breakdown: Record<string, number> }> {
  // Fetch balances
  const [hbarTiny, tokens, pricesMap, hbarUsd] = await Promise.all([
    getHBARBalance(accountId),
    getAccountTokens(accountId),
    getTokenPrices(),
    getHBARPriceUSD(),
  ]);

  const tokenIds = Array.from(
    new Set(tokens.map((t) => t.token_id).filter(Boolean))
  );
  const infoMap = await getTokenInfos(tokenIds);

  // HBAR USD
  const hbar = tinybarToHBAR(hbarTiny);
  let total = hbar * (hbarUsd || 0);
  const breakdown: Record<string, number> = { HBAR: hbar * (hbarUsd || 0) };

  // Tokens USD
  for (const t of tokens) {
    const id = t.token_id;
    if (!id) continue;
    const dec = infoMap[id]?.decimals ?? t.decimals ?? 0;
    const qty = dec ? t.balance / Math.pow(10, dec) : t.balance;
    const price = pricesMap[id] ?? 0;
    const usd = qty * price;
    total += usd;
    breakdown[id] = usd;
  }

  return { value: total, breakdown };
}

// Store today’s snapshot for an account id in Redis (zset keyed by midnight UTC)
async function storeSnapshot(
  accountId: string,
  value: number,
  date = midnightUTC()
) {
  const key = `networth:${accountId}`;
  const score = toEpochSeconds(date);
  const member = JSON.stringify({ date: isoDate(date), value });

  // Remove any existing snapshot for today, then add
  await redis.zremrangebyscore(key, score, score);
  await redis.zadd(key, score, member);
  // Optionally cap history (e.g., keep last 400 entries)
  await redis.zremrangebyrank(key, 0, -401);
}

// Entry point
export default async function handler(req: Req, res: Res) {
  try {
    if (req.method && req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Accounts source:
    // 1) Body { accounts: string[] } when invoked manually
    // 2) Query ?accounts=0.0.x,0.0.y
    // 3) Env ACCOUNTS_CSV (comma-separated)
    const bodyAccounts = Array.isArray(req.body?.accounts)
      ? (req.body.accounts as string[])
      : undefined;
    const queryAccounts =
      typeof req.query?.accounts === "string"
        ? (req.query?.accounts as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const envAccounts =
      typeof process.env.ACCOUNTS_CSV === "string"
        ? process.env.ACCOUNTS_CSV.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const accounts = bodyAccounts || queryAccounts || envAccounts || [];
    if (!accounts.length) {
      return res
        .status(400)
        .json({
          error:
            "No accounts provided. Pass accounts[] in body or ?accounts=...",
        });
    }

    const date = midnightUTC();
    const results: Array<{ accountId: string; value: number }> = [];

    for (const accountId of accounts) {
      const { value } = await computeNetWorthUSD(accountId);
      await storeSnapshot(accountId, value, date);
      results.push({ accountId, value });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      date: isoDate(date),
      count: results.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: message });
  }
}
