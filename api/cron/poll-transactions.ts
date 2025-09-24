// Poll followed Hedera accounts, create notifications for followers via Hasura
// GET/POST /api/cron/poll-transactions
// Env:
// - HASURA_GRAPHQL_ENDPOINT
// - HASURA_ADMIN_SECRET
// - MIRROR_NODE_URL (default: https://mainnet.mirrornode.hedera.com)
// - ACCOUNTS_PER_RUN (default: 50)
// - TXS_PER_ACCOUNT (default: 100)

// NOTE: Extended to include token_transfers with normalization using token decimals.

const MIRROR = process.env.MIRROR_NODE_URL || "https://mainnet.mirrornode.hedera.com";

async function gql<T = unknown>(query: string, variables: Record<string, unknown> = {}) {
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT as string;
  const admin = process.env.HASURA_ADMIN_SECRET as string;
  if (!endpoint || !admin) throw new Error("Missing HASURA env");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": admin,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = json?.errors?.[0]?.message || `GraphQL error (${res.status})`;
    throw new Error(msg);
  }
  return json.data as T;
}

// In-memory cache per run for token info (decimals, symbol)
type TokenInfo = { decimals: number; symbol?: string };
const tokenInfoCache: Record<string, TokenInfo> = {};

async function getTokenInfo(tokenId: string): Promise<TokenInfo> {
  if (tokenInfoCache[tokenId] !== undefined) return tokenInfoCache[tokenId];
  const url = `${MIRROR}/api/v1/tokens/${encodeURIComponent(tokenId)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const fallback = { decimals: 0 } as TokenInfo;
    tokenInfoCache[tokenId] = fallback;
    return fallback;
  }
  const json = (await res.json()) as { decimals?: number; symbol?: string };
  const info: TokenInfo = {
    decimals: typeof json.decimals === 'number' ? json.decimals : 0,
    symbol: json.symbol,
  };
  tokenInfoCache[tokenId] = info;
  return info;
}

async function classifyTokenTransfers(
  accountId: string,
  tokenTransfers: TxItem['token_transfers']
): Promise<Array<{ tokenId: string; tokenSymbol?: string; direction: 'sent'|'received'; amount: number }>> {
  const result: Array<{ tokenId: string; tokenSymbol?: string; direction: 'sent'|'received'; amount: number }> = [];
  if (!tokenTransfers || !tokenTransfers.length) return result;

  // Group by token_id and compute net amount for the account
  const byToken: Record<string, number> = {};
  for (const t of tokenTransfers) {
    if (t.account !== accountId) continue;
    const amt = typeof t.amount === 'string' ? parseInt(t.amount, 10) : t.amount;
    if (!Number.isFinite(amt as number)) continue;
    byToken[t.token_id] = (byToken[t.token_id] || 0) + (amt as number);
  }

  for (const [tokenId, tiny] of Object.entries(byToken)) {
    if (tiny === 0) continue;
    const direction: 'sent'|'received' = tiny < 0 ? 'sent' : 'received';
    const info = await getTokenInfo(tokenId);
    const amount = info.decimals ? Math.abs(tiny) / Math.pow(10, info.decimals) : Math.abs(tiny);
    result.push({ tokenId, tokenSymbol: info.symbol, direction, amount });
  }
  return result;
}

function log(...args: unknown[]) {
  console.log("[cron:poll-transactions]", ...args);
}

// GraphQL documents
const DISTINCT_ACCOUNTS = /* GraphQL */ `
  query DistinctFollowedAccounts($limit: Int!) {
    follows(distinct_on: account_id, order_by: { account_id: asc }, limit: $limit) {
      account_id
    }
  }
`;

const GET_CURSOR = /* GraphQL */ `
  query GetCursor($accountId: String!) {
    account_cursors_by_pk(account_id: $accountId) { account_id last_consensus_ts }
  }
`;

const UPSERT_CURSOR = /* GraphQL */ `
  mutation UpsertCursor($accountId: String!, $ts: String!) {
    insert_account_cursors_one(
      object: { account_id: $accountId, last_consensus_ts: $ts }
      on_conflict: { constraint: account_cursors_pkey, update_columns: [last_consensus_ts, updated_at] }
    ) { account_id last_consensus_ts }
  }
`;

const GET_FOLLOWERS = /* GraphQL */ `
  query GetFollowers($accountId: String!) {
    follows(where: { account_id: { _eq: $accountId } }) { user_id }
  }
`;

const INSERT_NOTIFICATIONS = /* GraphQL */ `
  mutation InsertNotifications($objects: [notifications_insert_input!]!) {
    insert_notifications(
      objects: $objects,
      on_conflict: { constraint: notifications_user_id_tx_id_key, update_columns: [] }
    ) { affected_rows }
  }
`;

// Types for Mirror Node (partial)
interface CryptoTransfer { account: string; amount: number }
interface TxItem {
  transaction_id: string;
  consensus_timestamp: string; // e.g., "1695777782.123456789"
  transfers?: CryptoTransfer[];
  token_transfers?: Array<{ account: string; amount: string | number; token_id: string }>;
}

async function fetchTransactions(accountId: string, afterTs?: string, limit = 100): Promise<TxItem[]> {
  const params = new URLSearchParams();
  params.set("account.id", accountId);
  if (afterTs) params.set("timestamp", `gt:${afterTs}`);
  params.set("limit", String(limit));
  const url = `${MIRROR}/api/v1/transactions?${params.toString()}`;
  log("fetch", { accountId, url });
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    log("mirror error", { status: res.status });
    return [];
  }
  const json = await res.json();
  const list = (json?.transactions || []) as TxItem[];
  return list;
}

function classifyHBARDirection(accountId: string, transfers: CryptoTransfer[] | undefined): { direction: 'sent' | 'received' | null, amountHBAR: number } {
  if (!transfers || !transfers.length) return { direction: null, amountHBAR: 0 };
  // Hedera amounts are in tinybars in transfers? Mirror returns tinybar for HBAR crypto transfers.
  // Net sum for the tracked account.
  let tiny = 0;
  for (const t of transfers) {
    if (t.account === accountId) tiny += t.amount; // amount negative = sent, positive = received
  }
  if (tiny === 0) return { direction: null, amountHBAR: 0 };
  const direction = tiny < 0 ? 'sent' : 'received';
  const amountHBAR = Math.abs(tiny) / 100_000_000;
  return { direction, amountHBAR };
}

export type Req = { method?: string };
export type Res = { status: (c: number) => Res; json: (b: unknown) => void };

export default async function handler(req: Req, res: Res) {
  try {
    const ACCOUNTS_PER_RUN = parseInt(process.env.ACCOUNTS_PER_RUN || "50", 10);
    const TXS_PER_ACCOUNT = parseInt(process.env.TXS_PER_ACCOUNT || "100", 10);

    // 1) Get distinct followed accounts (capped per run)
    const distinct = await gql<{ follows: { account_id: string }[] }>(DISTINCT_ACCOUNTS, { limit: ACCOUNTS_PER_RUN });
    const accounts = distinct.follows.map(f => f.account_id);
    if (!accounts.length) return res.status(200).json({ ok: true, processed: 0 });

    let totalNotifications = 0;
    let processedAccounts = 0;

    for (const accountId of accounts) {
      processedAccounts += 1;
      // 2) Get cursor
      const cursorData = await gql<{ account_cursors_by_pk: { last_consensus_ts: string } | null }>(GET_CURSOR, { accountId });
      const lastTs = cursorData.account_cursors_by_pk?.last_consensus_ts;

      // 3) Fetch transactions after cursor
      const txs = await fetchTransactions(accountId, lastTs, TXS_PER_ACCOUNT);
      if (!txs.length) {
        continue;
      }

      // 4) Prepare notifications per follower
      const followersData = await gql<{ follows: { user_id: string }[] }>(GET_FOLLOWERS, { accountId });
      const followerIds = followersData.follows.map(f => f.user_id);
      if (!followerIds.length) {
        // Still advance cursor to avoid reprocessing
        const maxTs = txs[txs.length - 1].consensus_timestamp;
        await gql(UPSERT_CURSOR, { accountId, ts: maxTs });
        continue;
      }

      type NotificationInsert = {
        user_id: string;
        account_id: string;
        tx_id: string;
        consensus_ts: string;
        direction: 'sent'|'received';
        token: string;
        amount: number;
        payload: Record<string, unknown>;
      };
      const objects: NotificationInsert[] = [];
      for (const tx of txs) {
        const { direction, amountHBAR } = classifyHBARDirection(accountId, tx.transfers);
        if (direction && amountHBAR !== 0) {
          for (const userId of followerIds) {
            objects.push({
              user_id: userId,
              account_id: accountId,
              tx_id: tx.transaction_id,
              consensus_ts: tx.consensus_timestamp,
              direction,
              token: "HBAR",
              amount: amountHBAR,
              payload: { transaction_id: tx.transaction_id },
            });
          }
        }

        // Token transfers
        const tokenParts = await classifyTokenTransfers(accountId, tx.token_transfers);
        for (const part of tokenParts) {
          const tokenLabel = part.tokenSymbol || part.tokenId;
          for (const userId of followerIds) {
            objects.push({
              user_id: userId,
              account_id: accountId,
              tx_id: `${tx.transaction_id}:${part.tokenId}`,
              consensus_ts: tx.consensus_timestamp,
              direction: part.direction,
              token: tokenLabel,
              amount: part.amount,
              payload: { transaction_id: tx.transaction_id, token_id: part.tokenId, token_symbol: part.tokenSymbol },
            });
          }
        }
      }

      if (objects.length) {
        const chunkSize = 1000; // batch to avoid too large payloads
        for (let i = 0; i < objects.length; i += chunkSize) {
          const slice = objects.slice(i, i + chunkSize);
          const result = await gql<{ insert_notifications: { affected_rows: number } }>(INSERT_NOTIFICATIONS, { objects: slice });
          totalNotifications += result.insert_notifications.affected_rows || 0;
        }
      }

      // 5) Advance cursor to the last tx timestamp processed
      const maxTs = txs[txs.length - 1].consensus_timestamp;
      await gql(UPSERT_CURSOR, { accountId, ts: maxTs });
    }

    return res.status(200).json({ ok: true, processedAccounts, totalNotifications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log("error", message);
    return res.status(500).json({ error: message });
  }
}
