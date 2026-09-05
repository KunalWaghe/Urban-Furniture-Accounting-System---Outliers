/**
 * Inverse auth guard — keeps logged-in users off public auth pages.
 *
 * Role in the app:
 * - Wraps the `(auth)` layout (login, register)
 * - Redirects authenticated users to `/dashboard`
 * - Prevents a flash of the login form while `/auth/me` is loading
 *
 * Pair with RequireAuth on the `(app)` layout for the protected area.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Renders auth pages (login/register) only for guests.
 *
 * When to use: wrap the `(auth)` layout so logged-in users skip login.
 *
 * Flow:
 * 1. Before mount → render children (SSR/hydration must match)
 * 2. While bootstrapping → render nothing (avoid login flash)
 * 3. If authenticated → redirect to `/dashboard` and render nothing
 * 4. If guest → render children (login form)
 *
 * State owned: none (no local useState)
 * State consumed: AuthContext (`isAuthenticated`, `bootstrapping`), useMounted
 * Source of truth: AuthContext (backed by stored JWT + `/auth/me` API)
 *
 * Render states:
 *  1. !mounted            → children (SSR/hydration match)
 *  2. bootstrapping       → null (`/auth/me` in-flight)
 *  3. authenticated       → null (redirect effect runs)
 *  4. guest               → children (auth form)
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (mounted && !bootstrapping && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [mounted, bootstrapping, isAuthenticated, router]);

  // Before mounting, render children so SSR HTML matches initial client hydration.
  if (!mounted) {
    return <>{children}</>;
  }

  // Still verifying — show nothing to avoid a flash of the login form.
  if (bootstrapping) return null;

  // Authenticated — the effect is redirecting; render nothing.
  if (isAuthenticated) return null;

  return <>{children}</>;
}
