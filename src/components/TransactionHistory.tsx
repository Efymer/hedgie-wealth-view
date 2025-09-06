import React, { useState } from "react";
import { History, Filter, ArrowUpRight, ArrowDownLeft, Repeat, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  type: 'transfer' | 'swap' | 'contract_call';
  timestamp: string;
  amount: number;
  token: string;
  counterparty: string;
  fee: number;
  hash: string;
  status: 'success' | 'failed';
}

interface TransactionHistoryProps {
  accountId: string;
  transactions: Transaction[];
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "transfer",
    timestamp: "2024-01-15T14:30:00Z",
    amount: -500,
    token: "HBAR",
    counterparty: "0.0.789789",
    fee: 0.05,
    hash: "0x1234...abcd",
    status: "success"
  },
  {
    id: "2", 
    type: "swap",
    timestamp: "2024-01-15T12:15:00Z",
    amount: 1000,
    token: "USDC",
    counterparty: "SaucerSwap",
    fee: 2.5,
    hash: "0x5678...efgh",
    status: "success"
  },
  {
    id: "3",
    type: "contract_call",
    timestamp: "2024-01-14T16:45:00Z", 
    amount: -50,
    token: "HBAR",
    counterparty: "0.0.456456",
    fee: 0.1,
    hash: "0x9012...ijkl",
    status: "success"
  },
  {
    id: "4",
    type: "transfer",
    timestamp: "2024-01-14T10:20:00Z",
    amount: 250,
    token: "SAUCE",
    counterparty: "0.0.123123",
    fee: 0.02,
    hash: "0x3456...mnop",
    status: "success"
  },
  {
    id: "5",
    type: "swap",
    timestamp: "2024-01-13T09:10:00Z",
    amount: -100,
    token: "HBARX",
    counterparty: "Stader",
    fee: 1.2,
    hash: "0x7890...qrst",
    status: "failed"
  }
];

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  accountId, 
  transactions = mockTransactions 
}) => {
  const [filter, setFilter] = useState<string>("all");
  const [tokenFilter, setTokenFilter] = useState<string>("all");

  const getIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <ArrowUpRight className="h-4 w-4" />;
      case 'swap':
        return <Repeat className="h-4 w-4" />;
      case 'contract_call':
        return <Code className="h-4 w-4" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'text-primary';
      case 'swap':
        return 'text-accent';
      case 'contract_call':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, token: string) => {
    const absAmount = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}${absAmount.toLocaleString()} ${token}`;
  };

  const filteredTransactions = transactions.filter(tx => {
    const typeMatch = filter === "all" || tx.type === filter;
    const tokenMatch = tokenFilter === "all" || tx.token === tokenFilter;
    return typeMatch && tokenMatch;
  });

  const uniqueTokens = [...new Set(transactions.map(tx => tx.token))];

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
              <SelectItem value="swap">Swap</SelectItem>
              <SelectItem value="contract_call">Contract</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={tokenFilter} onValueChange={setTokenFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tokens</SelectItem>
              {uniqueTokens.map(token => (
                <SelectItem key={token} value={token}>{token}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions found for the selected filters</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${getTypeColor(tx.type)}`}>
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{tx.type.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tx.status === 'success' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.type === 'transfer' ? 'To: ' : 'Via: '}{tx.counterparty}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className={`font-semibold ${
                        tx.amount >= 0 ? 'text-success' : 'text-foreground'
                      }`}>
                        {formatAmount(tx.amount, tx.token)}
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
    </div>
  );
};