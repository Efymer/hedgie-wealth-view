import React, { useState } from "react";
import { Star, StarOff, Trash2, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface WatchlistItem {
  id: string;
  address: string;
  name: string;
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
    addedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    address: "0.0.789789",
    name: "DeFi Wallet",
    addedAt: "2024-01-13T09:45:00Z"
  },
  {
    id: "3",
    address: "0.0.345678",
    name: "Savings Account",
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
            <p className="text-sm text-muted-foreground">Add Hedera accounts to track</p>
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