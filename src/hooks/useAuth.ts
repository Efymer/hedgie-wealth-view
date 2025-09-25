import { useMemo, useEffect } from "react";
import { useWallet } from "@buidlerlabs/hashgraph-react-wallets";
import { useLocalStorage } from "usehooks-ts";

/**
 * Authentication hook that checks both wallet connection and JWT token presence
 * This should be used to gate GraphQL operations that require authentication
 */
export const useAuth = () => {
  const { isConnected } = useWallet();
  // Use useLocalStorage to automatically listen for JWT token changes
  // Note: We use string type to avoid JSON parsing since JWT tokens are base64 strings
  const [jwtToken, setJwtToken] = useLocalStorage("hasura_jwt", "");

  // Clear JWT token when wallet disconnects
  useEffect(() => {
    if (!isConnected && jwtToken) {
      setJwtToken("");
    }
  }, [isConnected, jwtToken, setJwtToken]);

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

    // Check if JWT token exists (empty string means no token)
    if (!jwtToken || jwtToken === "") {
      return {
        isAuthenticated: false,
        hasWallet: true,
        hasToken: false,
        reason: "No JWT token found",
      };
    }

    // Optionally check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(jwtToken.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        // Token is expired, remove it
        setJwtToken("");
        return {
          isAuthenticated: false,
          hasWallet: true,
          hasToken: false,
          reason: "JWT token expired",
        };
      }
    } catch (error) {
      // Invalid token format, remove it
      setJwtToken("");
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
  }, [isConnected, jwtToken, setJwtToken]);

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
