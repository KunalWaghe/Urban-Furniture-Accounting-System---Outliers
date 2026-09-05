"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { RequireRole } from "@/components/require-role";
import type { UserRole } from "@/lib/types";

const INTERNAL_ACCOUNTING_ROLES: readonly UserRole[] = ["admin", "invoicing_user"];

/**
 * Applies a route policy before a protected page and its queries are rendered.
 * The API remains the authority for permissions; this prevents direct links
 * from rendering accounting UI for an unauthorized browser session.
 */
export function AppRoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const allowedRoles: readonly UserRole[] = pathname.startsWith("/portal")
    ? ["contact"]
    : pathname.startsWith("/admin")
      ? ["admin"]
      : INTERNAL_ACCOUNTING_ROLES;

  return <RequireRole allowedRoles={allowedRoles}>{children}</RequireRole>;
}
