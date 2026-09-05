"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-context";
import { QueryProvider } from "@/components/query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
