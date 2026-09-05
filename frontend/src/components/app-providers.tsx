/**
 * Root provider composition for the app shell.
 *
 * Role in the app:
 * - Wraps the entire app in QueryClient (server state) and Auth (session state)
 * - Mounted once in the root layout so all pages share the same context
 *
 * Provider order matters: QueryProvider is outermost so AuthProvider (and any
 * auth-related queries) can use React Query hooks.
 */

"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-context";
import { QueryProvider } from "@/components/query-provider";
import { ToastProvider } from "@/components/toast-provider";

/**
 * Composes global React context providers around the app tree.
 *
 * When to use: wrap `{children}` in the root layout — do not nest this
 * inside individual pages.
 *
 * State owned: none (this component only nests providers)
 * State consumed: none directly — children inherit Query + Auth context
 * Source of truth: delegated to QueryProvider and AuthProvider
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
    </QueryProvider>
  );
}
