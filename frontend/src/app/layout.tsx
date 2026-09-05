import type { Metadata } from "next";
import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteSidebar } from "@/components/site-sidebar";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Urban Furniture Accounting System",
  description:
    "Manage purchase orders, bills, payments, and reports for urban furniture operations.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
