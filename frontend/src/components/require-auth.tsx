/**
 * Route guard — only renders children for authenticated users.
 *
 * Role in the app:
 * - Wraps protected `(app)` layouts and pages
 * - Shows a loading spinner while auth is bootstrapping
 * - Redirects unauthenticated users to `/login`
 *
 * Pair with RedirectIfAuth on the `(auth)` layout for the login/register flow.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Protects a route segment — renders children only when the user is logged in.
 *
 * When to use: wrap any page or layout under `(app)` that requires login.
 *
 * Flow:
 * 1. Wait for client mount (avoids hydration mismatch)
 * 2. Wait for AuthContext bootstrapping (`/auth/me` check)
 * 3. If authenticated → render children
 * 4. If not → redirect to `/login` and render nothing
 *
 * State owned: none (no local useState)
 * State consumed: AuthContext (`isAuthenticated`, `bootstrapping`), useMounted
 * Source of truth: AuthContext (backed by stored JWT + `/auth/me` API)
 *
 * Render states:
 *  1. !mounted            → loading spinner (SSR/hydration match)
 *  2. bootstrapping       → loading spinner (`/auth/me` in-flight)
 *  3. authenticated       → children
 *  4. unauthenticated     → null (redirect effect runs)
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (mounted && !bootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, bootstrapping, isAuthenticated, router]);

  // Still verifying stored token or waiting for client hydration —
  // show a spinner instead of a blank screen or hydration mismatch.
  if (!mounted || bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" label="Loading…" />
      </div>
    );
  }

  // Unauthenticated — the effect above is redirecting; render nothing.
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
