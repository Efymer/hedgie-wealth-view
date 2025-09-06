import React, { useState } from "react";
import { Star, StarOff, Trash2, Plus, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface WatchlistItem {
  id: string;
  type: 'account' | 'token';
  address: string;
  name: string;
  symbol?: string;
  balance?: number;
  value?: number;
  change24h?: number;
  addedAt: string;
}

interface WatchlistProps {
  items?: WatchlistItem[];
}

const mockWatchlistItems: WatchlistItem[] = [
  {
    id: "1",
    type: "account",
    address: "0.0.123456",
    name: "Main Trading Account",
    balance: 1250.75,
    value: 4350.25,
    change24h: 2.15,
    addedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2", 
    type: "token",
    address: "0.0.456456",
    name: "USD Coin",
    symbol: "USDC",
    balance: 1000,
    value: 1000,
    change24h: 0.02,
    addedAt: "2024-01-14T15:20:00Z"
  },
  {
    id: "3",
    type: "account", 
    address: "0.0.789789",
    name: "DeFi Wallet",
    balance: 850.30,
    value: 2950.80,
    change24h: -1.25,
    addedAt: "2024-01-13T09:45:00Z"
  },
  {
    id: "4",
    type: "token",
    address: "0.0.123123",
    name: "SaucerSwap Token", 
    symbol: "SAUCE",
    balance: 500000,
    value: 2500,
    change24h: -3.45,
    addedAt: "2024-01-12T14:10:00Z"
  }
];

export const Watchlist: React.FC<WatchlistProps> = ({ 
  items: initialItems = mockWatchlistItems 
}) => {
  const [items, setItems] = useState<WatchlistItem[]>(initialItems);
  const [newAddress, setNewAddress] = useState("");
  const [newName, setNewName] = useState("");
  const { toast } = useToast();

  const handleAddItem = () => {
    if (!newAddress.trim() || !newName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both address and name",
        variant: "destructive"
      });
      return;
    }

    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      type: newAddress.includes('.') ? 'account' : 'token',
      address: newAddress.trim(),
      name: newName.trim(),
      balance: Math.random() * 1000,
      value: Math.random() * 5000,
      change24h: (Math.random() - 0.5) * 10,
      addedAt: new Date().toISOString()
    };

    setItems([...items, newItem]);
    setNewAddress("");
    setNewName("");
    
    toast({
      title: "Added to Watchlist",
      description: `${newItem.name} has been added to your watchlist`
    });
  };

  const handleRemoveItem = (id: string) => {
    const item = items.find(item => item.id === id);
    setItems(items.filter(item => item.id !== id));
    
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

  const formatBalance = (balance: number, symbol?: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(balance);
    return symbol ? `${formatted} ${symbol}` : `${formatted} HBAR`;
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
        <h2 className="text-xl font-semibold">Watchlist</h2>
        <span className="ml-auto text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Add New Item */}
      <div className="glass-card rounded-lg p-4 border border-border/30 mb-6">
        <h3 className="text-sm font-medium mb-3">Add to Watchlist</h3>
        <div className="flex gap-3">
          <Input
            placeholder="0.0.123456 or account name"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Display name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
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
            <p className="text-muted-foreground">No items in your watchlist yet</p>
            <p className="text-sm text-muted-foreground">Add accounts or tokens to track them</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {item.type === 'account' ? (
                      <Star className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {item.symbol?.slice(0, 2) || 'TK'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                        {item.type}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {item.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatBalance(item.balance || 0, item.symbol)}
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
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
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