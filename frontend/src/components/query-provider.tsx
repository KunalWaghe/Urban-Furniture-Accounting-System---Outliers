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
        // Retry once on failure before surfacing an error to the UI.
        retry: 1,
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
