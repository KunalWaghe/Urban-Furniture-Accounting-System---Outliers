/**
 * Next.js App Router — Authenticated App Layout
 *
 * Route group: `(app)` — applies to all logged-in pages such as `/`, `/products`,
 * `/purchase-orders`, `/vendor-bills`, and `/admin/users`.
 *
 * The `(app)` folder name is a route group (parentheses mean it does not appear
 * in the URL). This layout adds the main app chrome: header, footer, and content area.
 */
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RequireAuth } from "@/components/require-auth";
import { AppRoleGate } from "@/components/app-role-gate";

/**
 * Layout for all authenticated application pages.
 *
 * Auth guard: `RequireAuth` redirects unauthenticated users to `/login`.
 * Role checks (e.g. admin-only pages) are handled inside individual pages, not here.
 *
 * @param children - The active page component for the current route.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppRoleGate>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <SiteHeader />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 2xl:px-10">
              {children}
            </div>
          </main>
          <SiteFooter />
        </div>
      </AppRoleGate>
    </RequireAuth>
  );
}
