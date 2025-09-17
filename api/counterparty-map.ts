// Vercel serverless function to build counterparty map data for an account
// Endpoint: /api/counterparty-map?accountId=0.0.xxxx&limit=1000
// It aggregates counterparties by counting transactions involving the given account.

const MIRROR_NODE = "https://mainnet.mirrornode.hedera.com";

// Minimal request/response types to avoid external type deps
type Req = { method?: string; query?: Record<string, unknown> };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

// Simple tag map for known services (extend as needed)
const TAGS: Record<string, { label: string; type: "exchange" | "dapp" | "wallet" | "treasury" }> = {
  "0.0.456858": { label: "USDC", type: "dapp" },
  "0.0.731861": { label: "SaucerSwap", type: "dapp" },
  "0.0.882001": { label: "HeliSwap", type: "dapp" },
  "0.0.990077": { label: "Pangolin", type: "dapp" },
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
      transactionCount: number;
    };

    const agg: Record<string, CounterAgg> = {};

    for (const tx of transactions) {
      const transfers: MirrorNodeTransfer[] = tx?.transfers || [];
      const tokenTransfers: MirrorNodeTokenTransfer[] = tx?.token_transfers || [];

      // Build a map of amounts by account for HBAR transfers
      const hbarByAccount: Record<string, number> = {};
      for (const t of transfers) {
        hbarByAccount[t.account] = (hbarByAccount[t.account] || 0) + (t.amount || 0);
      }

      // For each counterparty involved (excluding the source account), record a transaction occurrence
      const involvedAccounts = new Set<string>([
        ...Object.keys(hbarByAccount),
        ...tokenTransfers.map((t) => t.account),
      ]);

      involvedAccounts.delete(accountId);

      for (const cp of involvedAccounts) {
        if (!agg[cp]) agg[cp] = { account: cp, transactionCount: 0 };
        agg[cp].transactionCount += 1;
      }
    }

    // Transform into expected shape
    const data = Object.values(agg)
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .map((entry) => {
        const tag = TAGS[entry.account];
        const label = tag?.label || entry.account;
        const type = tag?.type || (entry.account.endsWith(".1") ? "treasury" : "wallet");
        return {
          account: entry.account,
          label,
          transactionCount: entry.transactionCount,
          type,
        } as {
          account: string;
          label: string;
          transactionCount: number;
          type: "exchange" | "dapp" | "wallet" | "treasury";
        };
      });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      data,
      meta: {
        accountId,
        transactionsProcessed: transactions.length,
        counterparties: data.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({ error: message });
  }
}
