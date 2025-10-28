import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useIsAuthenticated } from "../hooks/useAuth";

// GraphQL Types
export type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

// Auth token management
export function getAuthToken(): string | null {
  // You should set this after wallet auth flow
  return localStorage.getItem("hasura_jwt");
}

// Core GraphQL fetch function
export async function graphQLFetch<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const endpoint = "https://hbarwatch.hasura.app/v1/graphql";
  if (!endpoint) throw new Error("Missing VITE_HASURA_GRAPHQL_ENDPOINT");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as GraphQLResponse<T>;
  if (!res.ok || json.errors) {
    const msg = json.errors?.[0]?.message || `GraphQL error (${res.status})`;
    throw new Error(msg);
  }
  return json.data as T;
}

// React Query mutation hook for GraphQL with Authentication Check
export function useGQLMutation<
  TData = unknown,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
  TError = Error
>(query: string, options?: UseMutationOptions<TData, TError, TVariables>) {
  const isAuthenticated = useIsAuthenticated();
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (vars: TVariables) => {
      if (!isAuthenticated) {
        throw new Error("Must be authenticated to perform GraphQL mutations");
      }
      return graphQLFetch<TData>(query, vars || {});
    },
    ...(options || {}),
  });
}

/**
 * Followed Accounts Mutations
 */
const M_UPSERT_ACCOUNT = /* GraphQL */ `
  mutation UpsertAccount($id: String!, $display_name: String) {
    insert_accounts_one(
      object: { id: $id, display_name: $display_name }
      on_conflict: { constraint: accounts_pkey, update_columns: [display_name] }
    ) {
      id
    }
  }
`;

const M_FOLLOW = /* GraphQL */ `
  mutation Follow($account_id: String!) {
    insert_follows_one(
      object: { account_id: $account_id }
      on_conflict: {
        constraint: follows_user_id_account_id_key
        update_columns: []
      }
    ) {
      id
      followed_at
    }
  }
`;

const M_UNFOLLOW = /* GraphQL */ `
  mutation Unfollow($account_id: String!) {
    delete_follows(where: { account_id: { _eq: $account_id } }) {
      affected_rows
    }
  }
`;

export const useUpsertAccountMutation = () => {
  const isAuthenticated = useIsAuthenticated();
  
  return useGQLMutation<
    { insert_accounts_one: { id: string } },
    { id: string; display_name?: string }
  >(M_UPSERT_ACCOUNT, {
    onError: (error) => {
      console.error("Failed to upsert account:", error);
    },
    onSuccess: () => {
      console.log("Upserted account");
    },
    // Additional check to prevent mutation if not authenticated
    onMutate: () => {
      if (!isAuthenticated) {
        throw new Error("Must be authenticated to upsert accounts");
      }
    },
  });
};

export const useFollowMutation = () => {
  const isAuthenticated = useIsAuthenticated();
  
  return useGQLMutation<
    { insert_follows_one: { id: string; followed_at: string } },
    { account_id: string }
  >(M_FOLLOW, {
    onError: (error) => {
      console.error("Failed to follow account:", error);
    },
    onSuccess: () => {
      console.log("Followed account");
    },
    // Additional check to prevent mutation if not authenticated
    onMutate: () => {
      if (!isAuthenticated) {
        throw new Error("Must be authenticated to follow accounts");
      }
    },
  });
};

export const useUnfollowMutation = () => {
  const isAuthenticated = useIsAuthenticated();
  
  return useGQLMutation<
    { delete_follows: { affected_rows: number } },
    { account_id: string }
  >(M_UNFOLLOW, {
    onError: (error) => {
      console.error("Failed to unfollow account:", error);
    },
    onSuccess: () => {
      console.log("Unfollowed account");
    },
    // Additional check to prevent mutation if not authenticated
    onMutate: () => {
      if (!isAuthenticated) {
        throw new Error("Must be authenticated to unfollow accounts");
      }
    },
  });
};

/**
 * Notification Mutations
 */
const M_MARK_SEEN = /* GraphQL */ `
  mutation MarkSeen($ts: String!) {
    insert_notification_last_seen_one(
      object: { last_seen_consensus_ts: $ts }
      on_conflict: {
        constraint: notification_last_seen_pkey
        update_columns: [last_seen_consensus_ts]
      }
    ) {
      user_id
      last_seen_consensus_ts
    }
  }
`;

export const useMarkNotificationSeenMutation = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  
  return useGQLMutation<
    { insert_notification_last_seen_one: { user_id: string; last_seen_consensus_ts: string } },
    { ts: string }
  >(M_MARK_SEEN, {
    onSuccess: () => {
      // Invalidate the last seen query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["notification_last_seen"] });
    },
    onError: (error) => {
      console.error("Failed to mark notification as seen:", error);
    },
    // Additional check to prevent mutation if not authenticated
    onMutate: () => {
      if (!isAuthenticated) {
        throw new Error("Must be authenticated to mark notifications as seen");
      }
    },
  });
};
