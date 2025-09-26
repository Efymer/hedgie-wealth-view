// Admin endpoint to remove latest snapshots and recreate them for all accounts
// POST /api/admin/refresh-snapshots
// Requires admin authentication

import Redis from "ioredis";

const MIRROR_NODE = "https://mainnet.mirrornode.hedera.com";
const COINGECKO_PRICE =
  "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd";
const HASHPACK_TOKEN_INFO =
  "https://hashpack-mirror.b-cdn.net/getTokenInfo?network=mainnet&token_ids=";
const SAUCERSWAP_TOKENS = "https://api.saucerswap.finance/tokens";

type RequestBody = { 
  accounts?: string[];
  adminKey?: string;
};

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
const LOG_PREFIX = "[admin:refresh-snapshots]";
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

// Authentication check
function isAuthorized(adminKey?: string): boolean {
  const expectedKey = process.env.HASURA_ADMIN_SECRET;
  if (!expectedKey) {
    log("No ADMIN_KEY configured in environment");
    return false;
  }
  return adminKey === expectedKey;
}

// Get all account IDs that have snapshots in Redis
async function getAllAccountsWithSnapshots(): Promise<string[]> {
  log("Getting all accounts with snapshots");
  const pattern = "networth:*";
  const keys = await redis.keys(pattern);
  const accounts = keys.map(key => key.replace("networth:", ""));
  log("Found accounts with snapshots", { count: accounts.length, accounts });
  return accounts;
}

// Remove the latest snapshot for a specific account
async function removeLatestSnapshot(accountId: string): Promise<boolean> {
  const key = `networth:${accountId}`;
  log("Removing latest snapshot", { accountId, key });
  
  // Get the latest snapshot (highest score)
  const latest = await redis.zrevrange(key, 0, 0, "WITHSCORES");
  if (latest.length === 0) {
    log("No snapshots found for account", { accountId });
    return false;
  }
  
  const score = latest[1];
  const removed = await redis.zremrangebyscore(key, score, score);
  log("Removed latest snapshot", { accountId, score, removed });
  return removed > 0;
}

// Mirror Node fetches (copied from snapshot-balances.ts)
async function getHBARBalance(accountId: string): Promise<number> {
  const url = `${MIRROR_NODE}/api/v1/balances?account.id=${encodeURIComponent(
    accountId
  )}`;
  log("getHBARBalance: fetching", { accountId, url });
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  log("getHBARBalance: response", { accountId, ok: res.ok, status: res.status });
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
  log("getAccountTokens: response", { accountId, ok: res.ok, status: res.status });
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
  const url = `${HASHPACK_TOKEN_INFO}${encodeURIComponent(tokenIds.join(","))}`;
  log("getTokenInfos: fetching", { count: tokenIds.length, url });
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  log("getTokenInfos: response", { ok: res.ok, status: res.status });
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

async function getTokenPrices(): Promise<Record<string, number>> {
  log("getTokenPrices: fetching", { url: SAUCERSWAP_TOKENS });
  const res = await fetch(SAUCERSWAP_TOKENS, { 
    method: "GET",
    headers: {
      "x-api-key": "875e1017-87b8-4b12-8301-6aa1f1aa073b",
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

// Compute net worth (USD) for a single account id at "now"
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
  log("computeNetWorthUSD: hbar", { accountId, hbar, hbarUsd, usd: breakdown.HBAR });

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
  log("computeNetWorthUSD: done", { accountId, total, tokens: Object.keys(breakdown).length, ms });
  return { value: total, breakdown };
}

// Store today's snapshot for an account id in Redis (zset keyed by midnight UTC)
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

// Main handler
export default async function handler(req: Req, res: Res) {
  try {
    log("handler: start", { method: req.method });
    
    // Only allow POST requests
    if (req.method !== "POST") {
      log("handler: method not allowed", { method: req.method });
      return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    // Check admin authentication
    const adminKey = req.body?.adminKey;
    if (!isAuthorized(adminKey)) {
      log("handler: unauthorized access attempt");
      return res.status(401).json({ error: "Unauthorized. Valid adminKey required." });
    }

    // Get accounts to refresh
    let accounts: string[] = [];
    
    if (req.body?.accounts && Array.isArray(req.body.accounts)) {
      // Use provided accounts
      accounts = req.body.accounts;
      log("handler: using provided accounts", { count: accounts.length });
    } else {
      // Get all accounts that have snapshots
      accounts = await getAllAccountsWithSnapshots();
      log("handler: using all accounts with snapshots", { count: accounts.length });
    }

    if (!accounts.length) {
      log("handler: no accounts to process");
      return res.status(400).json({ 
        error: "No accounts to process. Either provide accounts array or ensure accounts have existing snapshots." 
      });
    }

    const date = midnightUTC();
    const results: Array<{ 
      accountId: string; 
      removedSnapshot: boolean; 
      newValue: number;
      error?: string;
    }> = [];

    // Process each account
    for (const accountId of accounts) {
      try {
        log("handler: processing account", { accountId });
        
        // Remove latest snapshot
        const removedSnapshot = await removeLatestSnapshot(accountId);
        
        // Compute new net worth
        const { value } = await computeNetWorthUSD(accountId);
        
        // Store new snapshot
        await storeSnapshot(accountId, value, date);
        
        results.push({ 
          accountId, 
          removedSnapshot, 
          newValue: value 
        });
        
        log("handler: processed account", { accountId, removedSnapshot, newValue: value });
      } catch (accountError) {
        const errorMessage = accountError instanceof Error ? accountError.message : "Unknown error";
        log("handler: error processing account", { accountId, error: errorMessage });
        results.push({ 
          accountId, 
          removedSnapshot: false, 
          newValue: 0,
          error: errorMessage
        });
      }
    }

    // Calculate summary stats
    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;
    const totalRemoved = results.filter(r => r.removedSnapshot).length;

    res.setHeader("Cache-Control", "no-store");
    log("handler: responding", { 
      date: isoDate(date), 
      total: results.length,
      successful,
      failed,
      totalRemoved
    });
    
    return res.status(200).json({
      ok: true,
      message: "Snapshots refreshed successfully",
      date: isoDate(date),
      summary: {
        totalAccounts: results.length,
        successful,
        failed,
        snapshotsRemoved: totalRemoved
      },
      results
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log("handler: error", { message, err });
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: message 
    });
  }
}
