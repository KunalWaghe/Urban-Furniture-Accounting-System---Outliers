/**
 * Client-mount detection hook for SSR-safe rendering.
 *
 * Role in the app:
 * - Tells components whether they are running on the client after hydration
 * - Prevents React hydration mismatches in auth guards and theme logic
 *
 * Prefer this over `useEffect(() => setMounted(true), [])` — it avoids
 * an extra render cycle and uses React's built-in `useSyncExternalStore`.
 */

import { useSyncExternalStore } from "react";

/** No-op subscribe — we only need a snapshot, not live updates. */
const emptySubscribe = () => () => {};

/**
 * Returns whether the component has mounted on the client.
 *
 * When to use: auth guards, theme toggles, or any UI that must differ
 * between server HTML and the first client paint.
 *
 * Flow:
 * 1. Server render → `false`
 * 2. Initial client hydration → `false` (matches server HTML)
 * 3. After hydration → `true`
 *
 * State owned: none (reads from React's external store)
 * State consumed: React hydration lifecycle (via useSyncExternalStore)
 * Source of truth: React client vs server environment
 *
 * @returns `false` during SSR and initial hydration; `true` on the client after mount
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
