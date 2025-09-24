import { useEffect, useState } from "react";
import { useGQLMutation } from "@/mutations/index";
import { useGQLQuery } from "@/queries/index";

export interface FollowedAccount {
  accountId: string;
  accountName?: string;
  followedAt: string;
}

type GqlFollow = {
  account_id: string;
  followed_at: string;
  account?: { display_name?: string | null } | null;
};

const Q_FOLLOWS = /* GraphQL */ `
  query MyFollows {
    follows(order_by: { followed_at: desc }) {
      account_id
      followed_at
      account { display_name }
    }
  }
`;

const M_UPSERT_ACCOUNT = /* GraphQL */ `
  mutation UpsertAccount($id: String!, $display_name: String) {
    insert_accounts_one(
      object: { id: $id, display_name: $display_name }
      on_conflict: { constraint: accounts_pkey, update_columns: [display_name] }
    ) { id }
  }
`;

const M_FOLLOW = /* GraphQL */ `
  mutation Follow($account_id: String!) {
    insert_follows_one(
      object: { account_id: $account_id }
      on_conflict: { constraint: follows_user_id_account_id_key, update_columns: [] }
    ) { id followed_at }
  }
`;

const M_UNFOLLOW = /* GraphQL */ `
  mutation Unfollow($account_id: String!) {
    delete_follows(where: { account_id: { _eq: $account_id } }) { affected_rows }
  }
`;

export const useFollowedAccounts = () => {
  const [followedAccounts, setFollowedAccounts] = useState<FollowedAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // Load follows via React Query helper
  const { data, isLoading } = useGQLQuery<{ follows: GqlFollow[] }>([
    "follows",
  ], Q_FOLLOWS);

  useEffect(() => {
    setLoading(isLoading);
    if (data?.follows) {
      const mapped: FollowedAccount[] = data.follows.map((f) => ({
        accountId: f.account_id,
        accountName: f.account?.display_name || undefined,
        followedAt: f.followed_at,
      }));
      setFollowedAccounts(mapped);
    }
  }, [data, isLoading]);

  const isFollowing = (accountId: string): boolean =>
    followedAccounts.some((a) => a.accountId === accountId);

  // Mutations
  const upsertAccount = useGQLMutation(M_UPSERT_ACCOUNT);
  const followMut = useGQLMutation(M_FOLLOW);
  const unfollowMut = useGQLMutation(M_UNFOLLOW);

  const followAccount = async (accountId: string, accountName?: string) => {
    if (isFollowing(accountId)) return;
    // Optimistic update
    setFollowedAccounts((prev) => [
      ...prev,
      { accountId, accountName, followedAt: new Date().toISOString() },
    ]);
    try {
      await upsertAccount.mutateAsync({ id: accountId, display_name: accountName });
      await followMut.mutateAsync({ account_id: accountId });
    } catch (e) {
      console.error("follow failed", e);
      // Revert
      setFollowedAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
      throw e;
    }
  };

  const unfollowAccount = async (accountId: string) => {
    if (!isFollowing(accountId)) return;
    const prevState = followedAccounts;
    setFollowedAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
    try {
      await unfollowMut.mutateAsync({ account_id: accountId });
    } catch (e) {
      console.error("unfollow failed", e);
      // Revert
      setFollowedAccounts(prevState);
      throw e;
    }
  };

  const toggleFollow = async (accountId: string, accountName?: string) => {
    if (isFollowing(accountId)) {
      await unfollowAccount(accountId);
    } else {
      await followAccount(accountId, accountName);
    }
  };

  return { followedAccounts, loading, isFollowing, followAccount, unfollowAccount, toggleFollow };
};