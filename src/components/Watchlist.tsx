import React, { useMemo, useState } from "react";
import { Star, StarOff, Trash2, Plus, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueries } from "@tanstack/react-query";
import { getHBARBalance, tinybarToHBAR } from "@/queries";

interface WatchlistItem {
  id: string;
  address: string;
  name: string;
  balance?: number;
  value?: number;
  change24h?: number;
  addedAt: string;
}

interface WatchlistProps {
  items?: WatchlistItem[];
  onSelect?: (address: string) => void;
}

const mockWatchlistItems: WatchlistItem[] = [
  {
    id: "1",
    address: "0.0.123456",
    name: "Main Trading Account",
    balance: 1250.75,
    value: 4350.25,
    change24h: 2.15,
    addedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    address: "0.0.789789",
    name: "DeFi Wallet",
    balance: 850.30,
    value: 2950.80,
    change24h: -1.25,
    addedAt: "2024-01-13T09:45:00Z"
  },
  {
    id: "3",
    address: "0.0.345678",
    name: "Savings Account",
    balance: 2150.45,
    value: 6890.12,
    change24h: 4.75,
    addedAt: "2024-01-12T16:20:00Z"
  }
];

// localStorage utilities
const WATCHLIST_STORAGE_KEY = 'hedera-explorer-watchlist';

const loadWatchlistFromStorage = (): WatchlistItem[] => {
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : mockWatchlistItems;
  } catch (error) {
    console.warn('Failed to load watchlist from localStorage:', error);
    return mockWatchlistItems;
  }
};

const saveWatchlistToStorage = (items: WatchlistItem[]) => {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to save watchlist to localStorage:', error);
  }
};

export const Watchlist: React.FC<WatchlistProps> = ({ 
  items: initialItems,
  onSelect,
}) => {
  const [items, setItems] = useState<WatchlistItem[]>(() => 
    initialItems || loadWatchlistFromStorage()
  );
  const [newAddress, setNewAddress] = useState("");
  const [newName, setNewName] = useState("");
  const { toast } = useToast();

  // Live HBAR balances for each watchlist address
  const accountIds = useMemo(() => items.map((i) => i.address), [items]);

  const balanceQueries = useQueries({
    queries: accountIds.map((id) => ({
      queryKey: ["hbar", "balance", id],
      queryFn: () => getHBARBalance(id),
      enabled: !!id,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    })),
  });

  const balancesMap = useMemo(() => {
    const map = new Map<string, number>();
    accountIds.forEach((id, idx) => {
      const q = balanceQueries[idx];
      const tiny = q?.data?.balance ?? 0;
      map.set(id, tinybarToHBAR(tiny));
    });
    return map;
  }, [accountIds, balanceQueries]);

  const handleAddItem = () => {
    if (!newAddress.trim() || !newName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both account address and name",
        variant: "destructive"
      });
      return;
    }

    // Validate Hedera account ID format
    if (!/^0\.0\.\d+$/.test(newAddress.trim())) {
      toast({
        title: "Invalid Format",
        description: "Please enter a valid Hedera account ID (e.g., 0.0.123456)",
        variant: "destructive"
      });
      return;
    }

    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      address: newAddress.trim(),
      name: newName.trim(),
      balance: Math.random() * 1000 + 500, // Random balance between 500-1500 HBAR
      value: Math.random() * 5000 + 1000, // Random USD value between $1000-$6000
      change24h: (Math.random() - 0.5) * 10, // Random change between -5% and +5%
      addedAt: new Date().toISOString()
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveWatchlistToStorage(updatedItems);
    setNewAddress("");
    setNewName("");
    
    toast({
      title: "Added to Watchlist",
      description: `${newItem.name} has been added to your watchlist`
    });
  };

  const handleRemoveItem = (id: string) => {
    const item = items.find(item => item.id === id);
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveWatchlistToStorage(updatedItems);
    
    toast({
      title: "Removed from Watchlist",
      description: `${item?.name} has been removed from your watchlist`
    });
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatBalance = (balance: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(balance);
    return `${formatted} HBAR`;
  };

  const formatChange = (change: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(change / 100);
  };

  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Star className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Account Watchlist</h2>
        <span className="ml-auto text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Add New Item */}
      <div className="glass-card rounded-lg p-4 border border-border/30 mb-6">
        <h3 className="text-sm font-medium mb-3">Add Account to Watchlist</h3>
        <div className="flex gap-3">
          <Input
            placeholder="0.0.123456"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem();
              }
            }}
            className="flex-1"
          />
          <Input
            placeholder="Account name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleAddItem} className="px-4">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <StarOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No accounts in your watchlist yet</p>
            <p className="text-sm text-muted-foreground">Add Hedera accounts to track their balances</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group cursor-pointer"
              onClick={() => onSelect?.(item.address)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                        account
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {item.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* <div className="text-right">
                    <p className="font-semibold">
                      {formatBalance(balancesMap.get(item.address) ?? 0)}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {formatValue(item.value || 0)}
                      </p>
                      {item.change24h !== undefined && (
                        <span className={`text-xs ${
                          item.change24h >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {item.change24h >= 0 ? '+' : ''}{formatChange(item.change24h)}
                        </span>
                      )}
                    </div>
                  </div> */}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};