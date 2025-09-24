import { useMutation, UseMutationOptions } from "@tanstack/react-query";

// GraphQL Types
export type GraphQLResponse<T> = { data?: T; errors?: Array<{ message: string }> };

// Auth token management
export function getAuthToken(): string | null {
  // You should set this after wallet auth flow
  return localStorage.getItem("hasura_jwt");
}

// Core GraphQL fetch function
export async function graphQLFetch<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const endpoint = import.meta.env?.VITE_HASURA_GRAPHQL_ENDPOINT || (window as unknown as Record<string, unknown>)?.HASURA_GRAPHQL_ENDPOINT;
  if (!endpoint) throw new Error("Missing VITE_HASURA_GRAPHQL_ENDPOINT");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
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

// React Query mutation hook for GraphQL
export function useGQLMutation<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>, TError = Error>(
  query: string,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (vars: TVariables) => graphQLFetch<TData>(query, vars || {}),
    ...(options || {}),
  });
}

// Example mutations - you can add your specific GraphQL mutations here
export const useCreateUserMutation = () => {
  return useGQLMutation<
    { insert_users_one: { id: string; account_id: string } },
    { account_id: string; public_key: string }
  >(
    `
    mutation CreateUser($account_id: String!, $public_key: String!) {
      insert_users_one(object: { account_id: $account_id, public_key: $public_key }) {
        id
        account_id
      }
    }
    `,
    {
      onSuccess: (data) => {
        console.log("User created:", data);
      },
      onError: (error) => {
        console.error("Failed to create user:", error);
      },
    }
  );
};

export const useUpdateUserMutation = () => {
  return useGQLMutation<
    { update_users_by_pk: { id: string; account_id: string } },
    { id: string; account_id?: string; public_key?: string }
  >(
    `
    mutation UpdateUser($id: uuid!, $account_id: String, $public_key: String) {
      update_users_by_pk(pk_columns: { id: $id }, _set: { account_id: $account_id, public_key: $public_key }) {
        id
        account_id
      }
    }
    `,
    {
      onSuccess: (data) => {
        console.log("User updated:", data);
      },
      onError: (error) => {
        console.error("Failed to update user:", error);
      },
    }
  );
};