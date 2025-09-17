import { useState, useEffect } from "react";

export interface FollowedAccount {
  accountId: string;
  accountName?: string;
  followedAt: string;
}

const getDummyAccounts = (): FollowedAccount[] => [
  {
    accountId: "0.0.800",
    accountName: "Hedera Treasury",
    followedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    accountId: "0.0.98",
    accountName: "Hedera Fee Collection",
    followedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    accountId: "0.0.1234567",
    accountName: "Whale Investor",
    followedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    accountId: "0.0.987654",
    followedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
  {
    accountId: "0.0.555888",
    accountName: "DeFi Protocol",
    followedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
];

export const useFollowedAccounts = () => {
  const [followedAccounts, setFollowedAccounts] = useState<FollowedAccount[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("followedAccounts");
    if (stored) {
      try {
        setFollowedAccounts(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse followed accounts from localStorage", error);
        // Fallback to dummy data if parsing fails
        setFollowedAccounts(getDummyAccounts());
      }
    } else {
      // No data in localStorage, use dummy data
      setFollowedAccounts(getDummyAccounts());
    }
  }, []);

  // Save to localStorage whenever followedAccounts changes
  useEffect(() => {
    localStorage.setItem("followedAccounts", JSON.stringify(followedAccounts));
  }, [followedAccounts]);

  const isFollowing = (accountId: string): boolean => {
    return followedAccounts.some(account => account.accountId === accountId);
  };

  const followAccount = (accountId: string, accountName?: string) => {
    if (isFollowing(accountId)) return;

    const newAccount: FollowedAccount = {
      accountId,
      accountName,
      followedAt: new Date().toISOString(),
    };

    setFollowedAccounts(prev => [...prev, newAccount]);
  };

  const unfollowAccount = (accountId: string) => {
    setFollowedAccounts(prev => prev.filter(account => account.accountId !== accountId));
  };

  const toggleFollow = (accountId: string, accountName?: string) => {
    if (isFollowing(accountId)) {
      unfollowAccount(accountId);
    } else {
      followAccount(accountId, accountName);
    }
  };

  return {
    followedAccounts,
    isFollowing,
    followAccount,
    unfollowAccount,
    toggleFollow,
  };
};