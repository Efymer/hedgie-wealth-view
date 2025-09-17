import { useState, useEffect } from "react";

export interface FollowedAccount {
  accountId: string;
  accountName?: string;
  followedAt: string;
}

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
      }
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