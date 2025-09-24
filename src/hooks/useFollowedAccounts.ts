import {
  useFollowsQuery,
  useFollowedAccountsActions,
  FollowedAccount,
} from "@/queries/index";

/**
 * Main hook for followed accounts functionality using React Query patterns
 *
 * This hook combines the query for fetching followed accounts with the actions
 * for following/unfollowing accounts. It provides optimistic updates and proper
 * cache management through React Query.
 */
export const useFollowedAccounts = () => {
  // Get the followed accounts data
  const followsQuery = useFollowsQuery();
  const actions = useFollowedAccountsActions();

  // Helper function to check if an account is being followed
  const isFollowing = (accountId: string): boolean => {
    return followsQuery.data?.some((a) => a.accountId === accountId) ?? false;
  };

  // Determine overall loading state
  const loading =
    followsQuery.isLoading ||
    actions.isFollowing ||
    actions.isUnfollowing ||
    actions.isUpsertingAccount;

  return {
    followedAccounts: followsQuery.data || [],
    loading,
    isLoading: followsQuery.isLoading,
    error: followsQuery.error,
    isFollowing,
    followAccount: actions.followAccount,
    unfollowAccount: actions.unfollowAccount,
    toggleFollow: actions.toggleFollow,
    // Additional state for more granular loading indicators
    isFollowingAccount: actions.isFollowing,
    isUnfollowingAccount: actions.isUnfollowing,
    isUpsertingAccount: actions.isUpsertingAccount,
  };
};

// Re-export the FollowedAccount type for convenience
export type { FollowedAccount };
