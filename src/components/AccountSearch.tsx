import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccountSearchProps {
  onSearch: (accountId: string) => void;
  isLoading?: boolean;
}

export const AccountSearch: React.FC<AccountSearchProps> = ({ onSearch, isLoading = false }) => {
  const [accountId, setAccountId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountId.trim()) {
      onSearch(accountId.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Basic Hedera account ID format validation (0.0.xxxx)
    if (value === "" || /^[0-9.]*$/.test(value)) {
      setAccountId(value);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Explore Hedera Account
        </h2>
        <p className="text-muted-foreground">
          Enter a Hedera account ID to view balances and token holdings
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="0.0.123456"
            value={accountId}
            onChange={handleInputChange}
            className="pl-10 h-12 text-lg bg-input/50 border-border/50 focus:bg-input focus:border-primary transition-all"
            disabled={isLoading}
          />
        </div>
        <Button 
          type="submit" 
          disabled={!accountId.trim() || isLoading}
          className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          style={{ boxShadow: "var(--shadow-primary)" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Explore"
          )}
        </Button>
      </form>
    </div>
  );
};