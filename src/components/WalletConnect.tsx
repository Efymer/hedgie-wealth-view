import React, { useState } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

interface WalletInfo {
  address: string;
  balance: string;
  accountId: string;
}

const DUMMY_WALLET: WalletInfo = {
  address: "0x1234...abcd",
  balance: "1,250.45",
  accountId: "0.0.123456"
};

export const WalletConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = () => {
    // Simulate connection
    setIsConnected(true);
    setWallet(DUMMY_WALLET);
    toast({
      title: "Wallet Connected",
      description: "Successfully connected to your wallet",
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWallet(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const copyAddress = async () => {
    if (wallet?.address) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        className="flex items-center space-x-2"
        size="sm"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center space-x-2 hover:bg-muted/80"
          size="sm"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{wallet?.address}</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Connected</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 px-2"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-sm font-mono bg-muted p-2 rounded truncate">
              {wallet?.address}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {wallet?.accountId}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Balance</span>
            <p className="text-sm font-medium">
              {wallet?.balance} HBAR
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleDisconnect}
            className="w-full flex items-center space-x-2 text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};