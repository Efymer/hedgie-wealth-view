import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { useAuthSignature, UserRefusedToSignAuthError, useWallet } from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { useAccountId } from "@buidlerlabs/hashgraph-react-wallets";

export const WalletConnect: React.FC = () => {
  const [connecting, setConnecting] = useState(false);
  const { connect: connectHashpack, isConnected, disconnect } = useWallet(HashpackConnector);
  const { data: accountId } = useAccountId();
  const { signAuth } = useAuthSignature(HashpackConnector);


  const handleConnectHashpack = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setConnecting(true);
    await connectHashpack();
    toast({ title: "Wallet Connected", description: "Successfully connected to your wallet" });
  };

  console.log(connecting);

useEffect(() => {
  if (accountId && connecting) {
    handleAuthenticate();
  }
}, [accountId, connecting])

  const handleAuthenticate = async () => {
    try {
      const a = await signAuth("some message to sign");
      console.log(a);
      setConnecting(false);
    } catch (e) {
      disconnect();
      setConnecting(false);
      toast({ title: "Wallet Disconnected", description: "Your wallet has been disconnected" });    }
  }


  const handleDisconnect = useCallback(() => {
    disconnect();
    localStorage.removeItem("hasura_jwt");
    toast({ title: "Wallet Disconnected", description: "Your wallet has been disconnected" });
  }, []);

  // const displayAddress = useMemo(() => {
  //   if (wallet?.evmAddress) {
  //     return `${wallet.evmAddress.slice(0, 6)}...${wallet.evmAddress.slice(-4)}`;
  //   }
  //   return wallet?.accountId;
  // }, [wallet]);

  // const copyAddress = async () => {
  //   const value = wallet?.evmAddress || wallet?.accountId;
  //   if (value) {
  //     await navigator.clipboard.writeText(value);
  //     setCopied(true);
  //     toast({ title: "Address Copied", description: "Wallet address copied to clipboard" });
  //     setTimeout(() => setCopied(false), 2000);
  //   }
  // };

  if (!isConnected || connecting) {
    return (
      <Button onClick={handleConnectHashpack} className="flex items-center space-x-2" size="sm" disabled={connecting}>
        <Wallet className="h-4 w-4" />
        <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2 hover:bg-muted/80" size="sm">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <Wallet className="h-4 w-4" />
          {/* <span className="hidden sm:inline">{displayAddress}</span> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Connected</span>
          </div>

          {/* <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address</span> */}
              {/* <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 px-2">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button> */}
            {/* </div> */}
            {/* <p className="text-sm font-mono bg-muted p-2 rounded truncate">{wallet?.evmAddress || wallet?.accountId}</p> */}
          {/* </div> */}

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <p className="text-sm font-mono bg-muted p-2 rounded">{accountId}</p>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Balance</span>
            {/* <p className="text-sm font-medium">{wallet?.balanceHBAR ?? "-"} HBAR</p> */}
          </div>

          <Button variant="outline" onClick={handleDisconnect} className="w-full flex items-center space-x-2 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};