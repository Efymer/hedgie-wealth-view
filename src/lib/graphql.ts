// Minimal GraphQL HTTP client using fetch with Hasura JWT
// Expects HASURA_GRAPHQL_ENDPOINT (public) and an auth token retrievable from localStorage

import { useMutation, useQuery, UseMutationOptions, UseQueryOptions, QueryKey } from "@tanstack/react-query";

export type GraphQLResponse<T> = { data?: T; errors?: Array<{ message: string }> };

export function getAuthToken(): string | null {
  // You should set this after wallet auth flow
  return localStorage.getItem("hasura_jwt");
}

export async function graphQLFetch<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const endpoint = (import.meta as any).env?.VITE_HASURA_GRAPHQL_ENDPOINT || (window as any).HASURA_GRAPHQL_ENDPOINT;
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

// React Query helpers for GraphQL

export function useGQLQuery<TData = unknown, TError = Error>(
  key: QueryKey,
  query: string,
  variables?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, "queryKey" | "queryFn">
) {
  return useQuery<TData, TError, TData, QueryKey>({
    queryKey: key,
    queryFn: async () => graphQLFetch<TData>(query, variables || {}),
    ...(options || {}),
  });
}

export function useGQLMutation<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>, TError = Error>(
  query: string,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (vars: TVariables) => graphQLFetch<TData>(query, vars || {}),
    ...(options || {}),
  });
}
