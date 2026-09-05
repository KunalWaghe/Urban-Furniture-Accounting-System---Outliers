import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteSidebar } from "@/components/site-sidebar";
import { RequireAuth } from "@/components/require-auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-background text-foreground">
        <SiteSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <SiteHeader />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          <SiteFooter />
        </div>
      </div>
    </RequireAuth>
  );
}
