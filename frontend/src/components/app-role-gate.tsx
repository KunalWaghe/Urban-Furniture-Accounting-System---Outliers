"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { RequireRole } from "@/components/require-role";
import type { UserRole } from "@/lib/types";

const PORTAL_ROLES: readonly UserRole[] = ["contact"];
const ADMIN_ROLES: readonly UserRole[] = ["admin"];
const INTERNAL_ACCOUNTING_ROLES: readonly UserRole[] = ["admin", "invoicing_user"];

function isPortalPath(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Route policy for everything under the authenticated `(app)` layout.
 * Contact users may only access `/portal`; all other app routes require
 * internal accounting roles (admin or invoicing_user).
 */
function getAllowedRolesForPath(pathname: string): readonly UserRole[] {
  if (isPortalPath(pathname)) {
    return PORTAL_ROLES;
  }
  if (isAdminPath(pathname)) {
    return ADMIN_ROLES;
  }
  // dashboard, reports, orders, payments, budgets, journals, master data, invoices, bills, …
  return INTERNAL_ACCOUNTING_ROLES;
}

/**
 * Applies a route policy before a protected page and its queries are rendered.
 * The API remains the authority for permissions; this prevents direct links
 * from rendering accounting UI for an unauthorized browser session.
 */
export function AppRoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const allowedRoles = getAllowedRolesForPath(pathname);

  return <RequireRole allowedRoles={allowedRoles}>{children}</RequireRole>;
}
