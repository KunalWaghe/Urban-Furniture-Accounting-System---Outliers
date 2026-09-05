"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Wraps any (app) layout or page.
 *
 * States:
 *  1. !mounted            → SSR or initial client hydration; render loading spinner
 *                           so server HTML and client initial render match identically.
 *  2. bootstrapping=true  → /auth/me in-flight; show a centered spinner so
 *                           the user sees feedback, not a blank screen.
 *  3. bootstrapping=false, isAuthenticated=true  → render children.
 *  4. bootstrapping=false, isAuthenticated=false → redirect to /login.
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
