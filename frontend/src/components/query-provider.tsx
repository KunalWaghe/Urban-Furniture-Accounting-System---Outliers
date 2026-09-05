/**
 * React Query (TanStack Query) provider setup.
 *
 * Role in the app:
 * - Creates a single QueryClient shared by all pages
 * - Sets default options for caching, retries, and refetch behavior
 *
 * Feature modules define their own `useQuery` / `useMutation` hooks;
 * this file only configures the shared client instance.
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { ApiError } from "@/lib/api";
import { HTTP_STATUS } from "@/lib/constants";

/**
 * Creates a QueryClient with app-wide defaults.
 *
 * Called once per provider mount (via useState lazy initializer) so the
 * client is not recreated on every render.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 30 s; stale data is still shown while refetching.
        staleTime: 30_000,
        // Only transient failures merit a retry. Retrying authorization,
        // validation, and not-found errors delays an actionable UI state.
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            [
              HTTP_STATUS.UNAUTHORIZED,
              HTTP_STATUS.FORBIDDEN,
              HTTP_STATUS.NOT_FOUND,
              HTTP_STATUS.UNPROCESSABLE_ENTITY,
            ].some((status) => status === error.status)
          ) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
        // Don't refetch on window focus for accounting data (avoids jarring
        // table refreshes mid-input).
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Provides React Query context to the component tree.
 *
 * When to use: already included in AppProviders — you rarely mount this
 * directly unless building a standalone test harness.
 *
 * State owned: `queryClient` (created once via useState)
 * State consumed: none
 * Source of truth: React Query cache (server/API data lives here)
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
