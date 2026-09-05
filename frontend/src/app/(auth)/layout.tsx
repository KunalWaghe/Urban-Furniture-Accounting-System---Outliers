/**
 * Next.js App Router — Auth Layout
 *
 * Route group: `(auth)` — applies to `/login` and `/signup`.
 *
 * The `(auth)` folder is a route group (parentheses do not appear in the URL).
 * This layout centers auth forms on a full-screen background and redirects users
 * who are already logged in away from login/signup pages.
 */
import type { ReactNode } from "react";

import { RedirectIfAuth } from "@/components/redirect-if-auth";

/**
 * Layout for unauthenticated auth pages (login and signup).
 *
 * Auth guard: `RedirectIfAuth` sends logged-in users to the dashboard (`/dashboard`)
 * so they cannot open login/signup while already signed in.
 *
 * @param children - The active auth page (`LoginPage` or `SignupPage`).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RedirectIfAuth>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-text sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-100 opacity-60 blur-3xl dark:bg-primary-900/20" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-50 opacity-70 blur-3xl dark:bg-primary-900/10" />
        </div>
        <div className="relative z-10 flex w-full flex-col items-center">
          {children}
          <div className="mt-6 space-y-2 text-center">
            <p className="text-xs text-text-muted">
              Urban Furniture Accounting System v0.1 &middot; Double-entry ledger
              environment
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
              <a href="/security-policy" className="transition-colors hover:text-text">
                Security Policy
              </a>
              <span>&middot;</span>
              <a href="/terms" className="transition-colors hover:text-text">
                Terms
              </a>
              <span>&middot;</span>
              <a href="/support" className="transition-colors hover:text-text">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </RedirectIfAuth>
  );
}
