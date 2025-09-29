import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  useAccountInfo,
  useWallet,
} from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { useAccountId } from "@buidlerlabs/hashgraph-react-wallets";
import { Buffer } from "buffer";

interface UseWalletAuthOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useWalletAuth = (options: UseWalletAuthOptions = {}) => {
  const {onSuccess, onError } = options;
  const [connecting, setConnecting] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const {
    connect: connectHashpack,
    isConnected,
    disconnect,
    signer,
  } = useWallet(HashpackConnector);

  const { data: accountId } = useAccountId();
  const { data: accountInfo } = useAccountInfo();

  const authenticate = useCallback(async () => {
    try {
      if (!accountId) throw new Error("No account ID available");

      // Try to get public key in different ways
      const publicKey =
        accountInfo?.key?.key || accountInfo?.publicKey || accountInfo?.key;

      const challengeResp = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          publicKey: publicKey,
        }),
      });

      if (!challengeResp.ok) {
        const error = await challengeResp.json();
        throw new Error(error?.error || "Failed to get challenge");
      }

      const { nonceId, message } = await challengeResp.json();

      const messageBytes = new TextEncoder().encode(message);

      const [{ signature }] = await signer.sign([messageBytes]);

      if (!signature) {
        throw new Error("Failed to get signature from wallet");
      }

      const loginPayload = {
        nonceId,
        accountId,
        publicKey: publicKey,
        signature: Buffer.from(signature).toString("base64"),
      };

      const loginResp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      });

      if (!loginResp.ok) {
        const error = await loginResp.json();
        throw new Error(error?.error || "Authentication failed");
      }

      const { token } = await loginResp.json();

      // Store JWT
      if (token) {
        localStorage.setItem("hasura_jwt", token);
        toast({
          title: "Authentication Successful",
          description: "You are now signed in",
        });
        onSuccess?.();
        
        // Reload the website after successful authentication
        window.location.reload();
      }

      setAuthenticating(false);
      setConnecting(false);
    } catch (e) {
      console.error("Authentication error:", e);
      const error =
        e instanceof Error ? e : new Error("Unknown authentication error");

      disconnect();
      setAuthenticating(false);
      setConnecting(false);

      toast({
        title: "Authentication Failed",
        description: error.message,
      });

      onError?.(error);
      throw error;
    }
  }, [accountId, disconnect, signer, accountInfo, onSuccess, onError]);

  const connectAndAuthenticate = useCallback(async () => {
    try {
      setConnecting(true);

      // Step 1: Connect the wallet
      await connectHashpack();

      toast({
        title: "Wallet Connected",
        description: "Please sign the authentication challenge",
      });
    } catch (e) {
      setConnecting(false);
      const error =
        e instanceof Error ? e : new Error("Failed to connect wallet");

      toast({
        title: "Connection Failed",
        description: error.message,
      });

      onError?.(error);
      throw error;
    }
  }, [connectHashpack, onError]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    localStorage.removeItem("hasura_jwt");
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [disconnect]);

  // Auto-authenticate after wallet connects and accountId is available
  useEffect(() => {
    if (isConnected && accountId && connecting && accountInfo?.key?.key) {
      authenticate();
    }
  }, [isConnected, accountId, connecting, authenticate, accountInfo]);

  return {
    // State
    isConnected,
    accountId,
    accountInfo,
    connecting,
    authenticating,
    isLoading: connecting || authenticating,

    // Actions
    connectAndAuthenticate,
    authenticate,
    disconnect: disconnectWallet,

    // Raw wallet functions (for advanced usage)
    signer,
  };
};
