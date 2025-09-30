// Vercel serverless function to build counterparty map data for an account
// Endpoint: /api/counterparty-map?accountId=0.0.xxxx&limit=1000
// It aggregates counterparties by counting transactions involving the given account,
// tracking both sends and receives separately.

const MIRROR_NODE = "https://mainnet.mirrornode.hedera.com";

// Minimal request/response types to avoid external type deps
type Req = { method?: string; query?: Record<string, unknown> };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

// Hedera-owned accounts to filter out (fee collection, staking rewards, etc.)
const HEDERA_OWNED_ACCOUNTS = new Set([
  "0.0.98",   // Fee collection account
  "0.0.800",  // Staking reward account
  "0.0.801",  // Node reward account
]);

// Helper function to check if account is Hedera-owned
function isHederaOwnedAccount(accountId: string): boolean {
  // Check explicit list
  if (HEDERA_OWNED_ACCOUNTS.has(accountId)) return true;
  
  // // Filter out system accounts (0.0.1 to 0.0.1000 are typically system/treasury)
  // const parts = accountId.split('.');
  // if (parts.length === 3 && parts[0] === '0' && parts[1] === '0') {
  //   const num = parseInt(parts[2], 10);
  //   // Accounts 1-750 are generally Hedera system accounts
  //   if (num >= 1 && num <= 750) return true;
  // }
  
  return false;
}

// Simple tag map for known services (extend as needed)
const TAGS: Record<string, { label: string; type: "exchange" | "dapp" | "wallet" | "treasury" }> = {
  "0.0.456858": { label: "USDC Treasury", type: "treasury" },
  "0.0.731861": { label: "SaucerSwap", type: "dapp" },
  "0.0.882001": { label: "HeliSwap", type: "dapp" },
  "0.0.990077": { label: "Pangolin", type: "dapp" },
  "0.0.1004": { label: "Binance", type: "exchange" },
  "0.0.1006": { label: "Bittrex", type: "exchange" },
};

type MirrorNodeTransfer = { account: string; amount: number };
type MirrorNodeTokenTransfer = { account: string; token_id: string; amount: number };
type MirrorNodeTransaction = {
  transaction_id?: string;
  consensus_timestamp?: string;
  name?: string;
  parent_consensus_timestamp?: string | null;
  transfers?: MirrorNodeTransfer[];
  token_transfers?: MirrorNodeTokenTransfer[];
};

async function fetchTransactionsPaged(accountId: string, maxTx: number): Promise<MirrorNodeTransaction[]> {
  const limitPerPage = 100;
  let next: string | null = `${MIRROR_NODE}/api/v1/transactions/?account.id=${encodeURIComponent(
    accountId
  )}&limit=${limitPerPage}&order=desc`;
  const transactions: MirrorNodeTransaction[] = [];

  while (next && transactions.length < maxTx) {
    const res = await fetch(next, { headers: { Accept: "application/json" } });
    if (!res.ok) break;
    const json = await res.json();
    const pageTx: MirrorNodeTransaction[] = json?.transactions ?? [];
    transactions.push(...pageTx);
    const hasNext: string | undefined = json?.links?.next;
    next = hasNext ? `${MIRROR_NODE}${hasNext.startsWith("/") ? "" : "/"}${hasNext}` : null;
  }

  return transactions;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const accountId = (req.query?.accountId || req.query?.account || "").toString();
  const maxTx = Math.max(
    100,
    Math.min(5000, parseInt((req.query?.limit as string | undefined) ?? "1000", 10) || 1000)
  );

  // Basic validation
  if (!accountId || !/^\d+\.\d+\.\d+$/.test(accountId)) {
    res.status(400).json({ error: "Missing or invalid accountId" });
    return;
  }

  try {
    const transactions = await fetchTransactionsPaged(accountId, maxTx);

    type CounterAgg = {
      account: string;
      sentCount: number;
      receivedCount: number;
      totalCount: number;
    };

    const agg: Record<string, CounterAgg> = {};

    for (const tx of transactions) {
      // Exclude contract calls from aggregation
      if ((tx?.name ?? "").toUpperCase() === "CONTRACTCALL") {
        continue;
      }
      const transfers: MirrorNodeTransfer[] = tx?.transfers || [];
      const tokenTransfers: MirrorNodeTokenTransfer[] = tx?.token_transfers || [];

      // Build a map of amounts by account for HBAR transfers
      const hbarByAccount: Record<string, number> = {};
      for (const t of transfers) {
        hbarByAccount[t.account] = (hbarByAccount[t.account] || 0) + (t.amount || 0);
      }

      // Determine user's net flow for this transaction
      const userHbarNet = hbarByAccount[accountId] ?? 0;
      const userTokenNet = tokenTransfers
        .filter((t) => t.account === accountId)
        .reduce((sum, t) => sum + (t.amount ?? 0), 0);

      // Collect counterparties that received value from the user (sent to)
      const sentTo = new Set<string>();
      // Collect counterparties that sent value to the user (received from)
      const receivedFrom = new Set<string>();

      // HBAR flows
      for (const [acct, amt] of Object.entries(hbarByAccount)) {
        if (acct === accountId) continue;
        
        // If user sent HBAR (negative) and this account received (positive)
        if (userHbarNet < 0 && amt > 0) {
          sentTo.add(acct);
        }
        // If user received HBAR (positive) and this account sent (negative)
        if (userHbarNet > 0 && amt < 0) {
          receivedFrom.add(acct);
        }
      }

      // Token flows
      const userTokenTransfers = tokenTransfers.filter((t) => t.account === accountId);
      const otherTokenTransfers = tokenTransfers.filter((t) => t.account !== accountId);

      for (const userTx of userTokenTransfers) {
        const userAmount = userTx.amount ?? 0;
        const tokenId = userTx.token_id;

        // Find counterparties for this token
        for (const otherTx of otherTokenTransfers) {
          if (otherTx.token_id !== tokenId) continue;
          const otherAmount = otherTx.amount ?? 0;

          // User sent tokens (negative) and other received (positive)
          if (userAmount < 0 && otherAmount > 0) {
            sentTo.add(otherTx.account);
          }
          // User received tokens (positive) and other sent (negative)
          if (userAmount > 0 && otherAmount < 0) {
            receivedFrom.add(otherTx.account);
          }
        }
      }

      // Update aggregation (filter out Hedera-owned accounts)
      for (const cp of sentTo) {
        if (isHederaOwnedAccount(cp)) continue;
        if (!agg[cp]) agg[cp] = { account: cp, sentCount: 0, receivedCount: 0, totalCount: 0 };
        agg[cp].sentCount += 1;
        agg[cp].totalCount += 1;
      }

      for (const cp of receivedFrom) {
        if (isHederaOwnedAccount(cp)) continue;
        if (!agg[cp]) agg[cp] = { account: cp, sentCount: 0, receivedCount: 0, totalCount: 0 };
        agg[cp].receivedCount += 1;
        agg[cp].totalCount += 1;
      }
    }

    // Transform into expected shape
    const data = Object.values(agg)
      .sort((a, b) => b.totalCount - a.totalCount)
      .map((entry) => {
        const tag = TAGS[entry.account];
        const label = tag?.label || entry.account;
        const type = tag?.type || (entry.account.endsWith(".1") ? "treasury" : "wallet");
        return {
          account: entry.account,
          label,
          sentCount: entry.sentCount,
          receivedCount: entry.receivedCount,
          transactionCount: entry.totalCount,
          type,
        };
      });

    // Find top send and receive counterparties
    const topSentTo = [...data].sort((a, b) => b.sentCount - a.sentCount)[0];
    const topReceivedFrom = [...data].sort((a, b) => b.receivedCount - a.receivedCount)[0];

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      data,
      meta: {
        accountId,
        transactionsProcessed: transactions.length,
        counterparties: data.length,
        summary: {
          topSentTo: topSentTo ? {
            account: topSentTo.account,
            label: topSentTo.label,
            count: topSentTo.sentCount,
          } : null,
          topReceivedFrom: topReceivedFrom ? {
            account: topReceivedFrom.account,
            label: topReceivedFrom.label,
            count: topReceivedFrom.receivedCount,
          } : null,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({ error: message });
  }
}
