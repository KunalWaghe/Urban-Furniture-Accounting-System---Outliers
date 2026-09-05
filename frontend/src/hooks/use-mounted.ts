import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false on SSR and initial client hydration, then flips to true on the client.
 * Uses useSyncExternalStore to prevent React hydration mismatch and avoid cascading effect setState.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
