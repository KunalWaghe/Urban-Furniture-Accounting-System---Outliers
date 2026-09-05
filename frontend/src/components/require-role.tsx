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

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ArrowLeft, LogOut, ShieldAlert } from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

/** Props for the RequireRole guard component. */
interface RequireRoleProps {
  /** Role strings that are allowed to see `children` (e.g. `["admin"]`). */
  allowedRoles: string[];
  children: ReactNode;
  /** Heading on the 403 fallback screen. */
  fallbackTitle?: string;
  /** Custom body text; auto-generated from roles if omitted. */
  fallbackMessage?: string;
}

/** Maps backend role slugs to human-readable labels for error messages. */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
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
  fallbackTitle = "Access Denied",
  fallbackMessage,
}: RequireRoleProps) {
  const { user, isAuthenticated, bootstrapping, logout } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (mounted && !bootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, bootstrapping, isAuthenticated, router]);

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

  const isAllowed = allowedRoles.includes(user.role);

  if (!isAllowed) {
    const roleName = ROLE_DISPLAY_NAMES[user.role] || user.role;
    const requiredRoles = allowedRoles
      .map((r) => ROLE_DISPLAY_NAMES[r] || r)
      .join(" or ");

    return (
      <div className="mx-auto my-12 max-w-lg rounded-2xl border border-destructive/20 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <span className="mt-4 inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive">
          403 Forbidden
        </span>

        <h2 className="mt-3 text-xl font-bold text-text">{fallbackTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {fallbackMessage ||
            `Your current role (${roleName}) does not have permission to access this screen. This module requires ${requiredRoles} authorization.`}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Switch Account
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
