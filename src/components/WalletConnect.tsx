import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { useAuthSignature } from "@buidlerlabs/hashgraph-react-wallets";

type WalletInfo = {
  evmAddress?: string;
  accountId: string;
  balanceHBAR?: string;
};

type ImportMetaEnv = { VITE_MIRROR_NODE_URL?: string };
const viteEnv = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: ImportMetaEnv }).env : undefined);
const globalMirror: unknown = (typeof window !== 'undefined' ? (window as unknown as { MIRROR_NODE_URL?: string }).MIRROR_NODE_URL : undefined);
const MIRROR = viteEnv?.VITE_MIRROR_NODE_URL || (typeof globalMirror === 'string' ? globalMirror : undefined) || "https://mainnet.mirrornode.hedera.com";

async function fetchHBARBalance(accountId: string): Promise<string | undefined> {
  try {
    const url = `${MIRROR}/api/v1/balances?account.id=${encodeURIComponent(accountId)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return undefined;
    const json = await res.json();
    const tiny = json?.balances?.[0]?.balance as number | undefined;
    if (typeof tiny !== "number") return undefined;
    const hbar = tiny / 100_000_000;
    return hbar.toLocaleString(undefined, { maximumFractionDigits: 8 });
  } catch {
    return undefined;
  }
}

export const WalletConnect: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { signAuth } = useAuthSignature();

  const isConnected = !!wallet?.accountId;

  const handleConnect = useCallback(async () => {
    try {
      setConnecting(true);
      const nonce = crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
      const message = `hedgie-auth:${nonce}`;
      // Package returns a SignerSignature; we treat it as an object with fields used below.
      type AuthSig = { accountId?: string; signature?: string; evmAddress?: string };
      const result = (await signAuth(message)) as unknown as AuthSig;
      const r = result;
      const accountId = r.accountId;
      const signature = r.signature;
      if (!accountId || !signature) throw new Error("Wallet did not return accountId/signature");

      // Exchange for Hasura JWT
      const resp = await fetch("/api/auth/issue-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, nonce, signature }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Auth failed");
      if (data?.token) localStorage.setItem("hasura_jwt", data.token);

      const balanceHBAR = await fetchHBARBalance(accountId);
      setWallet({ accountId, evmAddress: r.evmAddress, balanceHBAR });
      toast({ title: "Wallet Connected", description: "Successfully connected to your wallet" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect wallet";
      toast({ title: "Wallet Connection Failed", description: msg });
    } finally {
      setConnecting(false);
    }
  }, [signAuth]);

  const handleDisconnect = useCallback(() => {
    setWallet(null);
    localStorage.removeItem("hasura_jwt");
    toast({ title: "Wallet Disconnected", description: "Your wallet has been disconnected" });
  }, []);

  const displayAddress = useMemo(() => {
    if (wallet?.evmAddress) {
      return `${wallet.evmAddress.slice(0, 6)}...${wallet.evmAddress.slice(-4)}`;
    }
    return wallet?.accountId;
  }, [wallet]);

  const copyAddress = async () => {
    const value = wallet?.evmAddress || wallet?.accountId;
    if (value) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Address Copied", description: "Wallet address copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} className="flex items-center space-x-2" size="sm" disabled={connecting}>
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
          <span className="hidden sm:inline">{displayAddress}</span>
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
              <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 px-2">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-sm font-mono bg-muted p-2 rounded truncate">{wallet?.evmAddress || wallet?.accountId}</p>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <p className="text-sm font-mono bg-muted p-2 rounded">{wallet?.accountId}</p>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Balance</span>
            <p className="text-sm font-medium">{wallet?.balanceHBAR ?? "-"} HBAR</p>
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