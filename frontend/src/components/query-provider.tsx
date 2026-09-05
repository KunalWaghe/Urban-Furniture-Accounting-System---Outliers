"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, type ReactNode } from "react";

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

export function QueryProvider({ children }: { children: ReactNode }) {
  // Stable client across renders without escaping to module scope so that
  // server components get a fresh instance per request.
  const clientRef = useRef<QueryClient | null>(null);
  if (clientRef.current === null) {
    clientRef.current = makeQueryClient();
  }

  return (
    <QueryClientProvider client={clientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
