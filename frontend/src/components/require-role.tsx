/**
 * Role-based route guard — restricts pages to specific user roles.
 *
 * Role in the app:
 * - Wraps admin-only or role-specific pages inside RequireAuth
 * - Shows a 403 "Access Denied" screen when the user's role is not allowed
 * - Redirects unauthenticated users to `/login` (same as RequireAuth)
 *
 * Use after RequireAuth in the component tree, or on pages that already
 * sit behind the auth layout.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { getHomeRouteForRole } from "@/features/auth/validation";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useMounted } from "@/hooks/use-mounted";
import type { UserRole } from "@/lib/types";

/** Props for the RequireRole guard component. */
interface RequireRoleProps {
  /** Role strings that are allowed to see `children` (e.g. `["admin"]`). */
  allowedRoles: readonly UserRole[];
  children: ReactNode;
  /** Heading on the 403 fallback screen. */
  fallbackTitle?: string;
  /** Custom body text; auto-generated from roles if omitted. */
  fallbackMessage?: string;
}

/** Maps backend role slugs to human-readable labels for error messages. */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: "Administrator",
  invoicing_user: "Accountant",
  contact: "Portal User (Contact)",
};

/**
 * Restricts a route to users whose role is in `allowedRoles`.
 *
 * When to use: admin settings, user management, or any role-gated module.
 *
 * Flow:
 * 1. Wait for client mount and auth bootstrapping
 * 2. Redirect to `/login` if not authenticated
 * 3. Check `user.role` against `allowedRoles`
 * 4. Allowed → render children; denied → show 403 fallback UI
 *
 * State owned: none (no local useState)
 * State consumed: AuthContext (`user`, `isAuthenticated`, `bootstrapping`, `logout`), useMounted
 * Source of truth: AuthContext user.role (from `/auth/me`)
 */
export function RequireRole({
  allowedRoles,
  children,
}: RequireRoleProps) {
  const { user, isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (mounted && !bootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, bootstrapping, isAuthenticated, router]);

  const isAllowed = user ? allowedRoles.includes(user.role) : false;

  useEffect(() => {
    if (mounted && !bootstrapping && user && !isAllowed) {
      router.replace(getHomeRouteForRole(user.role));
    }
  }, [mounted, bootstrapping, user, isAllowed, router]);

  if (!mounted || bootstrapping) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying permissions…" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Redirecting…" />
      </div>
    );
  }

  return <>{children}</>;
}
