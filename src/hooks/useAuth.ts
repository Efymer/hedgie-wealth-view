import { useMemo, useEffect } from "react";
import { useWallet } from "@buidlerlabs/hashgraph-react-wallets";

/**
 * Authentication hook that checks both wallet connection and JWT token presence
 * This should be used to gate GraphQL operations that require authentication
 */
export const useAuth = () => {
  const { isConnected } = useWallet();

  // Clear JWT token when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      const token = localStorage.getItem("hasura_jwt");
      if (token) {
        localStorage.removeItem("hasura_jwt");
      }
    }
  }, [isConnected]);

  const authState = useMemo(() => {
    // Check if wallet is connected
    if (!isConnected) {
      return {
        isAuthenticated: false,
        hasWallet: false,
        hasToken: false,
        reason: "Wallet not connected",
      };
    }

    // Check if JWT token exists in localStorage
    const token = localStorage.getItem("hasura_jwt");
    if (!token) {
      return {
        isAuthenticated: false,
        hasWallet: true,
        hasToken: false,
        reason: "No JWT token found",
      };
    }

    // Optionally check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        // Token is expired, remove it
        localStorage.removeItem("hasura_jwt");
        return {
          isAuthenticated: false,
          hasWallet: true,
          hasToken: false,
          reason: "JWT token expired",
        };
      }
    } catch (error) {
      // Invalid token format, remove it
      localStorage.removeItem("hasura_jwt");
      return {
        isAuthenticated: false,
        hasWallet: true,
        hasToken: false,
        reason: "Invalid JWT token format",
      };
    }

    // Both wallet and token are present and valid
    return {
      isAuthenticated: true,
      hasWallet: true,
      hasToken: true,
      reason: "Authenticated",
    };
  }, [isConnected]);

  return authState;
};

/**
 * Hook that returns whether the user is fully authenticated
 * Shorthand for useAuth().isAuthenticated
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook that returns the JWT token if the user is authenticated
 * Returns null if not authenticated
 */
export const useAuthToken = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return null;
  }
  
  return localStorage.getItem("hasura_jwt");
};
