import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import {
  useAuthSignature,
  UserRefusedToSignAuthError,
  useWallet,
} from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { useAccountId } from "@buidlerlabs/hashgraph-react-wallets";

export const WalletConnect: React.FC = () => {
  const [connecting, setConnecting] = useState(false);
  const {
    connect: connectHashpack,
    isConnected,
    disconnect,
  } = useWallet(HashpackConnector);
  const { data: accountId } = useAccountId();
  const { signAuth } = useAuthSignature(HashpackConnector);

  const handleConnectHashpack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConnecting(true);
    try {
      // Step 1: Connect the wallet
      await connectHashpack();
      toast({
        title: "Wallet Connected",
        description: "Please sign the authentication challenge",
      });
    } catch (e) {
      setConnecting(false);
      toast({
        title: "Connection Failed",
        description:
          e instanceof Error ? e.message : "Failed to connect wallet",
      });
    }
  };

  const handleAuthenticate = useCallback(async () => {
    try {
      if (!accountId) throw new Error("No account ID available");

      // Step 2: Server generates a challenge
      const challengeResp = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!challengeResp.ok) {
        const error = await challengeResp.json();
        throw new Error(error?.error || "Failed to get challenge");
      }

      const { payload, serverSignature, nonce } = await challengeResp.json();

      // Step 3: Wallet signs the server-signed payload (HashPack pattern)
      // The wallet signs the entire payload object that was signed by the server
      console.log("Signing payload:", payload);
      const payloadToSign = JSON.stringify(payload);
      const signatureResult = await signAuth(payloadToSign);

      // Extract signature from SignerSignature object
      console.log("SignatureResult type:", typeof signatureResult);
      console.log("SignatureResult:", signatureResult);
      
      let signature;
      if (typeof signatureResult === "string") {
        signature = signatureResult;
      } else if (signatureResult && typeof signatureResult === "object") {
        // SignerSignature object from @hashgraph/sdk
        const sigObj = signatureResult as any;
        console.log("SignerSignature object keys:", Object.keys(sigObj));
        console.log("SignerSignature prototype:", Object.getPrototypeOf(sigObj));
        
        // Try different ways to extract the signature bytes
        if (sigObj.signature) {
          signature = sigObj.signature;
          console.log("Using sigObj.signature:", signature);
        } else if (sigObj._signature) {
          signature = sigObj._signature;
          console.log("Using sigObj._signature:", signature);
        } else if (typeof sigObj.toBytes === 'function') {
          signature = sigObj.toBytes();
          console.log("Using sigObj.toBytes():", signature);
        } else if (typeof sigObj.toString === 'function') {
          const sigString = sigObj.toString();
          console.log("SignerSignature toString():", sigString);
          // Try to parse as hex or base64
          try {
            signature = Buffer.from(sigString, 'hex');
            console.log("Parsed as hex buffer:", signature);
          } catch (e) {
            try {
              signature = Buffer.from(sigString, 'base64');
              console.log("Parsed as base64 buffer:", signature);
            } catch (e2) {
              signature = sigString;
              console.log("Using as string:", signature);
            }
          }
        } else {
          signature = sigObj;
          console.log("Using raw object:", signature);
        }
      } else {
        signature = signatureResult;
      }

      if (!signature) throw new Error("No signature returned from wallet");

      // Step 4: Server verifies the signature
      const loginResp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          signature,
          nonce,
          payload,
          serverSignature,
        }),
      });

      if (!loginResp.ok) {
        const error = await loginResp.json();
        throw new Error(error?.error || "Authentication failed");
      }

      const { token } = await loginResp.json();

      // Step 5: Store JWT
      if (token) {
        localStorage.setItem("hasura_jwt", token);
        toast({
          title: "Authentication Successful",
          description: "You are now signed in",
        });
      }

      setConnecting(false);
    } catch (e) {
      console.error("Authentication error:", e);
      disconnect();
      setConnecting(false);
      toast({
        title: "Authentication Failed",
        description:
          e instanceof Error ? e.message : "Unknown authentication error",
      });
    }
  }, [accountId, signAuth, disconnect]);

  // Trigger authentication after wallet connects and accountId is available
  useEffect(() => {
    if (isConnected && accountId && connecting) {
      handleAuthenticate();
    }
  }, [isConnected, accountId, connecting, handleAuthenticate]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    localStorage.removeItem("hasura_jwt");
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [disconnect]);

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
      <Button
        onClick={handleConnectHashpack}
        className="flex items-center space-x-2"
        size="sm"
        disabled={connecting}
      >
        <Wallet className="h-4 w-4" />
        <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
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
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {accountId}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Balance</span>
            {/* <p className="text-sm font-medium">{wallet?.balanceHBAR ?? "-"} HBAR</p> */}
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
