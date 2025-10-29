// Poll followed Hedera accounts, create notifications for followers via Hasura
// GET/POST /api/cron/poll-transactions
// Env:
// - HASURA_GRAPHQL_ENDPOINT
// - HASURA_ADMIN_SECRET
// - MIRROR_NODE_URL (default: https://testnet.mirrornode.hedera.com)
// - ACCOUNTS_PER_RUN (default: 50)
// - TXS_PER_ACCOUNT (default: 100)

// NOTE: Extended to include token_transfers with normalization using token decimals.

const MIRROR =
  process.env.MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com";

async function gql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
) {
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT as string;
  const admin = process.env.HASURA_ADMIN_SECRET as string;
  if (!endpoint || !admin) {
    log("ERROR: Missing HASURA environment variables", {
      endpoint: !!endpoint,
      admin: !!admin,
    });
    throw new Error("Missing HASURA env");
  }

  // Extract operation name from query for better logging
  const operationMatch = query.match(/(query|mutation)\s+(\w+)/);
  const operationName = operationMatch ? operationMatch[2] : "unknown";

  log("GraphQL request", { operation: operationName, variables });

  try {
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
      log("ERROR: GraphQL request failed", {
        operation: operationName,
        status: res.status,
        statusText: res.statusText,
        errors: json.errors,
        variables,
        query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
      });
      throw new Error(msg);
    }

    log("GraphQL request successful", {
      operation: operationName,
      dataKeys: Object.keys(json.data || {}),
    });
    return json.data as T;
  } catch (error) {
    log("ERROR: GraphQL request exception", {
      operation: operationName,
      error: error instanceof Error ? error.message : String(error),
      variables,
    });
    throw error;
  }
}

// In-memory cache per run for token info (decimals, symbol)
type TokenInfo = { decimals: number; symbol?: string };
const tokenInfoCache: Record<string, TokenInfo> = {};

async function getTokenInfo(tokenId: string): Promise<TokenInfo> {
  if (tokenInfoCache[tokenId] !== undefined) {
    log("Token info cache hit", { tokenId, info: tokenInfoCache[tokenId] });
    return tokenInfoCache[tokenId];
  }

  const url = `${MIRROR}/api/v1/tokens/${encodeURIComponent(tokenId)}`;
  log("Fetching token info", { tokenId, url });

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      log("WARN: Token info fetch failed", {
        tokenId,
        status: res.status,
        statusText: res.statusText,
      });
      const fallback = { decimals: 0 } as TokenInfo;
      tokenInfoCache[tokenId] = fallback;
      return fallback;
    }

    const json = (await res.json()) as { decimals?: number; symbol?: string };
    const info: TokenInfo = {
      decimals: typeof json.decimals === "number" ? json.decimals : 0,
      symbol: json.symbol,
    };

    log("Token info fetched successfully", { tokenId, info });
    tokenInfoCache[tokenId] = info;
    return info;
  } catch (error) {
    log("ERROR: Token info fetch exception", {
      tokenId,
      error: error instanceof Error ? error.message : String(error),
    });
    const fallback = { decimals: 0 } as TokenInfo;
    tokenInfoCache[tokenId] = fallback;
    return fallback;
  }
}

async function classifyTokenTransfers(
  accountId: string,
  tokenTransfers: TxItem["token_transfers"]
): Promise<
  Array<{
    tokenId: string;
    tokenSymbol?: string;
    direction: "sent" | "received";
    amount: number;
  }>
> {
  const result: Array<{
    tokenId: string;
    tokenSymbol?: string;
    direction: "sent" | "received";
    amount: number;
  }> = [];
  if (!tokenTransfers || !tokenTransfers.length) return result;

  // Group by token_id and compute net amount for the account
  const byToken: Record<string, number> = {};
  for (const t of tokenTransfers) {
    if (t.account !== accountId) continue;
    const amt =
      typeof t.amount === "string" ? parseInt(t.amount, 10) : t.amount;
    if (!Number.isFinite(amt as number)) continue;
    byToken[t.token_id] = (byToken[t.token_id] || 0) + (amt as number);
  }

  for (const [tokenId, tiny] of Object.entries(byToken)) {
    if (tiny === 0) continue;
    const direction: "sent" | "received" = tiny < 0 ? "sent" : "received";
    const info = await getTokenInfo(tokenId);
    const amount = info.decimals
      ? Math.abs(tiny) / Math.pow(10, info.decimals)
      : Math.abs(tiny);
    result.push({ tokenId, tokenSymbol: info.symbol, direction, amount });
  }
  return result;
}

function log(...args: unknown[]) {
  console.log("[cron:poll-transactions]", ...args);
}

// Compare two consensus timestamps like "1695777782.123456789"
function compareConsensusTs(a: string, b: string): number {
  if (a === b) return 0;
  const [as, an = "0"] = a.split(".");
  const [bs, bn = "0"] = b.split(".");
  const ai = Number(as);
  const bi = Number(bs);
  if (ai !== bi) return ai < bi ? -1 : 1;
  // pad nanos to 9 digits for lexicographic comparison
  const ap = an.padEnd(9, "0");
  const bp = bn.padEnd(9, "0");
  if (ap === bp) return 0;
  return ap < bp ? -1 : 1;
}

function maxConsensusTs(list: { consensus_timestamp: string }[]): string {
  let max = "0";
  for (const item of list) {
    if (compareConsensusTs(item.consensus_timestamp, max) > 0) {
      max = item.consensus_timestamp;
    }
  }
  return max;
}

// GraphQL documents
const DISTINCT_ACCOUNTS = /* GraphQL */ `
  query DistinctFollowedAccounts($limit: Int!) {
    follows(
      distinct_on: account_id
      order_by: { account_id: asc }
      limit: $limit
    ) {
      account_id
    }
  }
`;

const GET_CURSOR = /* GraphQL */ `
  query GetCursor($accountId: String!) {
    account_cursors_by_pk(account_id: $accountId) {
      account_id
      last_consensus_ts
    }
  }
`;

const UPSERT_CURSOR = /* GraphQL */ `
  mutation UpsertCursor($accountId: String!, $ts: String!) {
    insert_account_cursors_one(
      object: { account_id: $accountId, last_consensus_ts: $ts }
      on_conflict: {
        constraint: account_cursors_pkey
        update_columns: [last_consensus_ts, updated_at]
      }
    ) {
      account_id
      last_consensus_ts
    }
  }
`;

const GET_FOLLOWERS = /* GraphQL */ `
  query GetFollowers($accountId: String!) {
    follows(where: { account_id: { _eq: $accountId } }) {
      user_id
    }
  }
`;

const INSERT_NOTIFICATIONS = /* GraphQL */ `
  mutation InsertNotifications($objects: [notifications_insert_input!]!) {
    insert_notifications(
      objects: $objects
      on_conflict: {
        constraint: notifications_user_id_tx_id_key
        update_columns: []
      }
    ) {
      affected_rows
    }
  }
`;

// Types for Mirror Node (partial)
interface CryptoTransfer {
  account: string;
  amount: number;
}
interface TxItem {
  transaction_id: string;
  consensus_timestamp: string; // e.g., "1695777782.123456789"
  transfers?: CryptoTransfer[];
  token_transfers?: Array<{
    account: string;
    amount: string | number;
    token_id: string;
  }>;
}

async function fetchTransactions(
  accountId: string,
  afterTs?: string,
  limit = 100
): Promise<TxItem[]> {
  const params = new URLSearchParams();
  params.set("account.id", accountId);
  if (afterTs) params.set("timestamp", `gt:${afterTs}`);
  params.set("limit", String(limit));
  const url = `${MIRROR}/api/v1/transactions?${params.toString()}`;

  log("Fetching transactions", { accountId, afterTs, limit, url });

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      log("ERROR: Mirror node request failed", {
        accountId,
        status: res.status,
        statusText: res.statusText,
        url,
      });
      return [];
    }

    const json = await res.json();
    const list = (json?.transactions || []) as TxItem[];

    log("Transactions fetched successfully", {
      accountId,
      count: list.length,
      firstTs: list[0]?.consensus_timestamp,
      lastTs: list[list.length - 1]?.consensus_timestamp,
    });

    return list;
  } catch (error) {
    log("ERROR: Mirror node request exception", {
      accountId,
      error: error instanceof Error ? error.message : String(error),
      url,
    });
    return [];
  }
}

function classifyHBARDirection(
  accountId: string,
  transfers: CryptoTransfer[] | undefined
): { direction: "sent" | "received" | null; amountHBAR: number } {
  if (!transfers || !transfers.length)
    return { direction: null, amountHBAR: 0 };
  // Hedera amounts are in tinybars in transfers? Mirror returns tinybar for HBAR crypto transfers.
  // Net sum for the tracked account.
  let tiny = 0;
  for (const t of transfers) {
    if (t.account === accountId) tiny += t.amount; // amount negative = sent, positive = received
  }
  if (tiny === 0) return { direction: null, amountHBAR: 0 };
  const direction = tiny < 0 ? "sent" : "received";
  const amountHBAR = Math.abs(tiny) / 100_000_000;
  return { direction, amountHBAR };
}

export type Req = { method?: string };
export type Res = { status: (c: number) => Res; json: (b: unknown) => void };

export default async function handler(req: Req, res: Res) {
  const startTime = Date.now();
  log("=== CRON JOB STARTED ===", {
    timestamp: new Date().toISOString(),
    method: req.method,
  });

  let totalNotifications = 0;
  let processedAccounts = 0;
  let accountsWithErrors = 0;

  try {
    const ACCOUNTS_PER_RUN = parseInt(process.env.ACCOUNTS_PER_RUN || "50", 10);
    const TXS_PER_ACCOUNT = parseInt(process.env.TXS_PER_ACCOUNT || "100", 10);

    log("Configuration", { ACCOUNTS_PER_RUN, TXS_PER_ACCOUNT });

    // 1) Get distinct followed accounts (capped per run)
    log("Step 1: Fetching distinct followed accounts");
    const distinct = await gql<{ follows: { account_id: string }[] }>(
      DISTINCT_ACCOUNTS,
      { limit: ACCOUNTS_PER_RUN }
    );
    const accounts = distinct.follows.map((f) => f.account_id);

    log("Distinct accounts fetched", { count: accounts.length, accounts });

    if (!accounts.length) {
      log("No accounts to process, exiting");
      return res.status(200).json({ ok: true, processed: 0 });
    }

    for (const accountId of accounts) {
      processedAccounts += 1;
      log(
        `\n--- Processing account ${processedAccounts}/${accounts.length}: ${accountId} ---`
      );

      try {
        // 2) Get cursor
        log("Step 2: Getting cursor for account", { accountId });
        const cursorData = await gql<{
          account_cursors_by_pk: { last_consensus_ts: string } | null;
        }>(GET_CURSOR, { accountId });
        const lastTs = cursorData.account_cursors_by_pk?.last_consensus_ts;

        log("Cursor retrieved", { accountId, lastTs });

        // 3) If first time (no cursor yet), set a baseline to avoid historical notifications
        if (!lastTs) {
          log("Step 3: First time processing account, setting baseline", {
            accountId,
          });
          const firstBatch = await fetchTransactions(accountId, undefined, 1);
          if (firstBatch.length) {
            const baseline = maxConsensusTs(firstBatch);
            log("Setting baseline cursor", { accountId, baseline });
            await gql(UPSERT_CURSOR, { accountId, ts: baseline });
            log("Baseline cursor set successfully", { accountId, baseline });
          } else {
            log("No transactions found for baseline", { accountId });
          }
          // Skip notifications on first encounter; continue with next account
          log("Skipping notifications for first encounter", { accountId });
          continue;
        }

        // 4) Fetch transactions after cursor
        log("Step 4: Fetching transactions after cursor", {
          accountId,
          lastTs,
          limit: TXS_PER_ACCOUNT,
        });
        const txs = await fetchTransactions(accountId, lastTs, TXS_PER_ACCOUNT);
        if (!txs.length) {
          log("No new transactions found", { accountId });
          continue;
        }

        // 5) Prepare notifications per follower
        log("Step 5: Getting followers for account", { accountId });
        const followersData = await gql<{ follows: { user_id: string }[] }>(
          GET_FOLLOWERS,
          { accountId }
        );
        const followerIds = followersData.follows.map((f) => f.user_id);

        log("Followers retrieved", {
          accountId,
          followerCount: followerIds.length,
          followerIds,
        });

        if (!followerIds.length) {
          log("No followers found, advancing cursor only", { accountId });
          // Still advance cursor to avoid reprocessing
          const maxTs = maxConsensusTs(txs);
          await gql(UPSERT_CURSOR, { accountId, ts: maxTs });
          log("Cursor advanced", { accountId, maxTs });
          continue;
        }

        type NotificationInsert = {
          user_id: string;
          account_id: string;
          tx_id: string;
          consensus_ts: string;
          direction: "sent" | "received";
          token: string;
          amount: number;
          payload: Record<string, unknown>;
        };
        const objects: NotificationInsert[] = [];

        log("Processing transactions for notifications", {
          accountId,
          txCount: txs.length,
        });

        for (const tx of txs) {
          log("Processing transaction", {
            accountId,
            txId: tx.transaction_id,
            consensusTs: tx.consensus_timestamp,
          });

          const { direction, amountHBAR } = classifyHBARDirection(
            accountId,
            tx.transfers
          );
          if (direction && amountHBAR !== 0) {
            log("HBAR transfer detected", {
              accountId,
              txId: tx.transaction_id,
              direction,
              amountHBAR,
            });
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
          const tokenParts = await classifyTokenTransfers(
            accountId,
            tx.token_transfers
          );
          if (tokenParts.length > 0) {
            log("Token transfers detected", {
              accountId,
              txId: tx.transaction_id,
              tokenCount: tokenParts.length,
              tokens: tokenParts,
            });
          }

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
                payload: {
                  transaction_id: tx.transaction_id,
                  token_id: part.tokenId,
                  token_symbol: part.tokenSymbol,
                },
              });
            }
          }
        }

        log("Notification objects prepared", {
          accountId,
          totalObjects: objects.length,
        });

        if (objects.length) {
          log("Inserting notifications", {
            accountId,
            totalObjects: objects.length,
          });
          const chunkSize = 1000; // batch to avoid too large payloads

          for (let i = 0; i < objects.length; i += chunkSize) {
            const slice = objects.slice(i, i + chunkSize);
            log("Inserting notification chunk", {
              accountId,
              chunkIndex: Math.floor(i / chunkSize) + 1,
              chunkSize: slice.length,
              totalChunks: Math.ceil(objects.length / chunkSize),
            });

            const result = await gql<{
              insert_notifications: { affected_rows: number };
            }>(INSERT_NOTIFICATIONS, { objects: slice });
            const affectedRows = result.insert_notifications.affected_rows || 0;
            totalNotifications += affectedRows;

            log("Notification chunk inserted", {
              accountId,
              affectedRows,
              totalSoFar: totalNotifications,
            });
          }
        } else {
          log("No notifications to insert", { accountId });
        }

        // 6) Advance cursor to the last tx timestamp processed
        const maxTs = maxConsensusTs(txs);
        log("Step 6: Advancing cursor", { accountId, maxTs });
        await gql(UPSERT_CURSOR, { accountId, ts: maxTs });
        log("Cursor advanced successfully", { accountId, maxTs });
      } catch (accountError) {
        accountsWithErrors++;
        log("ERROR: Failed to process account", {
          accountId,
          error:
            accountError instanceof Error
              ? accountError.message
              : String(accountError),
          stack: accountError instanceof Error ? accountError.stack : undefined,
        });
        // Continue with next account instead of failing entire job
      }
    }

    const duration = Date.now() - startTime;
    log("=== CRON JOB COMPLETED ===", {
      duration: `${duration}ms`,
      processedAccounts,
      accountsWithErrors,
      totalNotifications,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      processedAccounts,
      accountsWithErrors,
      totalNotifications,
      duration,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;

    log("=== CRON JOB FAILED ===", {
      error: message,
      stack,
      duration: `${duration}ms`,
      processedAccounts,
      totalNotifications,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      error: message,
      processedAccounts,
      totalNotifications,
      duration,
    });
  }
}
