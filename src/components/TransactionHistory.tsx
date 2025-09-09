import React, { useState } from "react";
import {
  History,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Transaction {
  id: string;
  type: "transfer" | "contract_call";
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
  transactions: Transaction[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  accountId,
  transactions,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const [filter, setFilter] = useState<string>("all");

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

  const formatAmountNumber = (amount: number, token: string) => {
    const absAmount = Math.abs(amount);
    const sign = amount >= 0 ? "+" : "-";
    const isHBAR = token === "HBAR";
    const hasFraction = Math.abs(absAmount - Math.trunc(absAmount)) > 0;
    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: hasFraction ? 1 : 0,
      maximumFractionDigits: isHBAR ? 8 : 8,
    });
    return `${sign}${formatter.format(absAmount)}`;
  };

  const filteredTransactions = transactions.filter((tx) => {
    const typeMatch = filter === "all" || tx.type === filter;
    return typeMatch;
  });

  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No transactions found for the selected filters
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group"
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
                          className={tx.amount >= 0 ? "text-success" : "text-foreground"}
                        >
                          {formatAmountNumber(tx.amount, tx.token)}
                        </span>
                        <span>{` ${tx.token}`}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={onLoadMore} disabled={isLoadingMore} variant="outline">
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
};
