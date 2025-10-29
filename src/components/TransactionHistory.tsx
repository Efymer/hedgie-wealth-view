import React, { useState, useMemo } from "react";
import {
  History,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  Code,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/format";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MirrorNodeTransaction, tinybarToHBAR } from "@/queries";

export interface Transaction {
  id: string;
  type: string;
  timestamp: string;
  amount: number;
  token: string;
  counterparty: string;
  fee: number;
  hash: string;
  status: "success" | "failed";
}

interface TransactionHistoryProps {
  accountId: string;
  rawTransactions: MirrorNodeTransaction[];
  tokenSymbolMap: Map<string, string>;
  tokenDecimalsMap: Map<string, number>;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  accountId,
  rawTransactions,
  tokenSymbolMap,
  tokenDecimalsMap,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Map Mirror Node transactions to Transaction interface
  const mappedTransactions: Transaction[] = useMemo(() => {
    const list: Transaction[] = rawTransactions.map((tx: MirrorNodeTransaction) => {
      // Find token transfer involving this account
      const tokenEntry = (tx.token_transfers || []).find(
        (t) => t.account === accountId
      );
      // Find HBAR transfer involving this account
      const hbarEntry = (tx.transfers || []).find(
        (t) => t.account === accountId
      );

      // Amount and token label
      let amount = 0;
      let token = "";
      if (tokenEntry) {
        const dec = tokenEntry.token_id
          ? tokenDecimalsMap.get(tokenEntry.token_id) ?? 0
          : 0;
        amount = dec
          ? tokenEntry.amount / Math.pow(10, dec)
          : tokenEntry.amount;
        const sym = tokenEntry.token_id
          ? tokenSymbolMap.get(tokenEntry.token_id)
          : undefined;
        token = sym || tokenEntry.token_id || "TOKEN";
      } else if (hbarEntry) {
        amount = tinybarToHBAR(hbarEntry.amount);
        token = "HBAR";
      }

      // Counterparty: pick the other side of the first relevant transfer
      let counterparty = "";
      if (tokenEntry) {
        const other = (tx.token_transfers || []).find(
          (t) => t.token_id === tokenEntry.token_id && t.account !== accountId
        );
        counterparty = other?.account || "";
      } else if (hbarEntry) {
        const other = (tx.transfers || []).find((t) => t.account !== accountId);
        counterparty = other?.account || "";
      }

      // Timestamp to ISO
      const sec = parseInt(
        (tx.consensus_timestamp || "0").split(".")[0] || "0",
        10
      );
      const timestamp = new Date(sec * 1000).toISOString();

      const status: "success" | "failed" =
        tx.result === "SUCCESS" ? "success" : "failed";

      return {
        id: tx.transaction_id || tx.consensus_timestamp,
        type: tx.name,
        timestamp,
        amount,
        token: token || "HBAR",
        counterparty: counterparty || "—",
        fee:
          typeof tx.charged_tx_fee === "number"
            ? tinybarToHBAR(tx.charged_tx_fee)
            : 0,
        hash: tx.transaction_hash || "",
        status,
      };
    });
    return list;
  }, [rawTransactions, accountId, tokenSymbolMap, tokenDecimalsMap]);
  const getIcon = (type: string, amount?: number) => {
    switch (type) {
      case "transfer":
        // Received (amount >= 0) shows an incoming arrow, Sent (amount < 0) shows an outgoing arrow
        return amount !== undefined && amount >= 0 ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        );
      case "swap":
        return <Repeat className="h-4 w-4" />;
      case "contract_call":
        return <Code className="h-4 w-4" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "transfer":
        return "text-primary";
      case "swap":
        return "text-accent";
      case "contract_call":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTxAmount = (amount: number) => {
    const abs = Math.abs(amount);
    const sign = amount >= 0 ? "+" : "-";
    // Mirror the TokenList display: fixed 3 fraction digits
    const formatted = formatAmount(abs, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    return `${sign}${formatted}`;
  };

  const openOnHashscan = (txId?: string) => {
    if (!txId) return;
    const url = `https://hashscan.io/testnet/transaction/${encodeURIComponent(
      txId
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Filter by date range if set
  const dateFilteredTransactions = useMemo(() => {
    if (!dateRange.from && !dateRange.to) {
      return mappedTransactions;
    }

    return mappedTransactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      
      if (dateRange.from && dateRange.to) {
        // Both dates set - check if transaction is within range
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return txDate >= fromDate && txDate <= toDate;
      } else if (dateRange.from) {
        // Only from date set - show transactions from that date onwards
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        return txDate >= fromDate;
      } else if (dateRange.to) {
        // Only to date set - show transactions up to that date
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return txDate <= toDate;
      }
      return true;
    });
  }, [mappedTransactions, dateRange]);

  // Hide transactions where counterparty is "—"
  const visibleTransactions = dateFilteredTransactions.filter(
    (t) => t.counterparty !== "—"
  );

  return (
    <div className="glass-card rounded-xl p-6 w-full  mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Filter by date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                initialFocus
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {(dateRange.from || dateRange.to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: undefined, to: undefined })}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {visibleTransactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No transactions found for the selected filters
            </p>
          </div>
        ) : (
          visibleTransactions.map((tx) => (
            <div
              key={tx.id}
              className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group cursor-pointer"
              role="button"
              tabIndex={0}
              title="View on HashScan"
              onClick={() => openOnHashscan(tx.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openOnHashscan(tx.id);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${getTypeColor(
                      tx.type
                    )}`}
                  >
                    {getIcon(tx.type, tx.amount)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">
                        {tx.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.type === "transfer"
                        ? tx.amount >= 0
                          ? "From: "
                          : "To: "
                        : "Via: "}
                      {tx.counterparty}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">
                        <span
                          className={
                            tx.amount >= 0 ? "text-success" : "text-destructive"
                          }
                        >
                          {formatTxAmount(tx.amount)}
                        </span>
                        <span>{` ${tx.token}`}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View
                    </Button> */}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
};
