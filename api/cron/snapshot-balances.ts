// Nightly snapshot of account net worths (USD) stored in Redis
// - Triggered by Vercel Cron nightly, or manually via POST with { accounts: string[] }

import Redis from "ioredis";

const MIRROR_NODE = "https://testnet.mirrornode.hedera.com";
const COINGECKO_PRICE =
  "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd";
const SAUCERSWAP_FULL_TOKENS = "https://api.saucerswap.finance/tokens/full";
const SAUCERSWAP_TOKENS = "https://api.saucerswap.finance/tokens";

type RequestBody = { accounts?: unknown };
type Req = {
  method?: string;
  query?: Record<string, unknown>;
  body?: RequestBody;
};
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

// Simple logger for consistent prefixing
const LOG_PREFIX = "[cron:snapshot-balances]";
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

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
  log("getHBARBalance: fetching", { accountId, url });
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  log("getHBARBalance: response", {
    accountId,
    ok: res.ok,
    status: res.status,
  });
  if (!res.ok) return 0;
  const json = (await res.json()) as {
    balances: Array<{ account: string; balance: number }>;
  };
  const value = json?.balances?.[0]?.balance ?? 0;
  log("getHBARBalance: parsed", { accountId, tinybars: value });
  return value;
}

async function getAccountTokens(
  accountId: string
): Promise<AccountTokenBalance[]> {
  const url = `${MIRROR_NODE}/api/v1/accounts/${encodeURIComponent(
    accountId
  )}/tokens?limit=100`;
  log("getAccountTokens: fetching", { accountId, url });
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  log("getAccountTokens: response", {
    accountId,
    ok: res.ok,
    status: res.status,
  });
  if (!res.ok) return [];
  const json = (await res.json()) as AccountTokensResponse;
  const tokens = json?.tokens ?? [];
  log("getAccountTokens: parsed", { accountId, tokensCount: tokens.length });
  return tokens;
}

async function getTokenInfos(
  tokenIds: string[]
): Promise<Record<string, { decimals: number }>> {
  if (!tokenIds.length) return {};

  log("getTokenInfos: fetching", {
    count: tokenIds.length,
    url: SAUCERSWAP_FULL_TOKENS,
  });
  const apiKey = process.env.SAUCERSWAP_KEY;
  if (!apiKey) {
    throw new Error("SAUCERSWAP_KEY environment variable not configured");
  }
  const res = await fetch(SAUCERSWAP_FULL_TOKENS, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });
  log("getTokenInfos: response", { ok: res.ok, status: res.status });
  if (!res.ok) return {};

  type SaucerSwapFullToken = {
    id: string;
    decimals: number;
  };

  const data = (await res.json()) as SaucerSwapFullToken[];
  const map: Record<string, { decimals: number }> = {};

  // Filter to only include tokens that are in our requested tokenIds
  const tokenIdSet = new Set(tokenIds);

  (data || []).forEach((token) => {
    const id = token.id;
    if (!id || !tokenIdSet.has(id)) return;

    const dec = token.decimals ?? 0;
    map[id] = { decimals: Number.isFinite(dec) ? dec : 0 };
  });

  log("getTokenInfos: parsed", { count: Object.keys(map).length });
  return map;
}

async function getHBARPriceUSD(): Promise<number> {
  log("getHBARPriceUSD: fetching", { url: COINGECKO_PRICE });
  const res = await fetch(COINGECKO_PRICE, {
    headers: { Accept: "application/json" },
  });
  log("getHBARPriceUSD: response", { ok: res.ok, status: res.status });
  if (!res.ok) return 0;
  const data = (await res.json()) as {
    ["hedera-hashgraph"]?: { usd?: number };
  };
  const price = data?.["hedera-hashgraph"]?.usd ?? 0;
  log("getHBARPriceUSD: parsed", { price });
  return price;
}

// SaucerSwap tokens API returns an array of token objects
async function getTokenPrices(): Promise<Record<string, number>> {
  log("getTokenPrices: fetching", { url: SAUCERSWAP_TOKENS });
  const apiKey = process.env.SAUCERSWAP_KEY;
  if (!apiKey) {
    throw new Error("SAUCERSWAP_KEY environment variable not configured");
  }

  const res = await fetch(SAUCERSWAP_TOKENS, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });
  log("getTokenPrices: response", { ok: res.ok, status: res.status });
  if (!res.ok) return {};
  const payload = (await res.json()) as PricesResponse;
  const out: Record<string, number> = {};
  if (Array.isArray(payload)) {
    // Array form - SaucerSwap format
    for (const item of payload) {
      const id = item.token_id || item.id;
      const p = item.priceUsd ?? item.price;
      if (id && typeof p === "number") out[id] = p;
    }
  } else if (payload && typeof payload === "object") {
    // Map form - fallback for compatibility
    for (const [id, p] of Object.entries(payload)) {
      if (typeof p === "number") out[id] = p;
    }
  }
  log("getTokenPrices: parsed", { count: Object.keys(out).length });
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
  log("computeNetWorthUSD: start", { accountId });
  const t0 = Date.now();
  const [hbarTiny, tokens, pricesMap, hbarUsd] = await Promise.all([
    getHBARBalance(accountId),
    getAccountTokens(accountId),
    getTokenPrices(),
    getHBARPriceUSD(),
  ]);
  log("computeNetWorthUSD: fetched", {
    accountId,
    hbarTiny,
    tokensCount: tokens.length,
    pricesCount: Object.keys(pricesMap).length,
    hbarUsd,
  });

  const tokenIds = Array.from(
    new Set(tokens.map((t) => t.token_id).filter(Boolean))
  );
  const infoMap = await getTokenInfos(tokenIds);
  log("computeNetWorthUSD: token infos", {
    accountId,
    tokenIdsCount: tokenIds.length,
    infoCount: Object.keys(infoMap).length,
  });

  // HBAR USD
  const hbar = tinybarToHBAR(hbarTiny);
  let total = hbar * (hbarUsd || 0);
  const breakdown: Record<string, number> = { HBAR: hbar * (hbarUsd || 0) };
  log("computeNetWorthUSD: hbar", {
    accountId,
    hbar,
    hbarUsd,
    usd: breakdown.HBAR,
  });

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
    log("computeNetWorthUSD: token", { accountId, id, qty, price, usd });
  }

  const ms = Date.now() - t0;
  log("computeNetWorthUSD: done", {
    accountId,
    total,
    tokens: Object.keys(breakdown).length,
    ms,
  });
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
  log("storeSnapshot: start", { accountId, key, score, value });
  await redis.zremrangebyscore(key, score, score);
  await redis.zadd(key, score, member);
  // Optionally cap history (e.g., keep last 400 entries)
  await redis.zremrangebyrank(key, 0, -401);
  log("storeSnapshot: done", { accountId, key });
}

// Entry point
export default async function handler(req: Req, res: Res) {
  try {
    log("handler: start", { method: req.method });
    if (req.method && req.method !== "GET" && req.method !== "POST") {
      log("handler: method not allowed", { method: req.method });
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
    log("handler: accounts resolved", {
      hasBody: !!bodyAccounts,
      hasQuery: !!queryAccounts,
      hasEnv: !!envAccounts,
      count: accounts.length,
      accounts,
    });
    if (!accounts.length) {
      log("handler: no accounts provided");
      return res.status(400).json({
        error: "No accounts provided. Pass accounts[] in body or ?accounts=...",
      });
    }

    const date = midnightUTC();
    const results: Array<{ accountId: string; value: number }> = [];

    for (const accountId of accounts) {
      log("handler: processing account", { accountId });
      const { value } = await computeNetWorthUSD(accountId);
      await storeSnapshot(accountId, value, date);
      results.push({ accountId, value });
      log("handler: processed account", { accountId, value });
    }

    res.setHeader("Cache-Control", "no-store");
    log("handler: responding", { date: isoDate(date), count: results.length });
    return res.status(200).json({
      ok: true,
      date: isoDate(date),
      count: results.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log("handler: error", { message, err });
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: message });
  }
}
