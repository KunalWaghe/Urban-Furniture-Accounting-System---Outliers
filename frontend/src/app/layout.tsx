/**
 * Next.js App Router — Root Layout
 *
 * Route: Wraps every page in the app (all URLs).
 *
 * This is the outermost shell. It sets up global HTML/body, loads global CSS,
 * and wraps the entire app with shared providers (theme, React Query, auth context).
 * There is no auth guard here — login protection lives in `(app)/layout.tsx`.
 */
import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/components/app-providers";
import { ThemeProvider } from "@/components/theme-provider";

/** Browser tab title and SEO description for the whole application. */
export const metadata: Metadata = {
  title: "Urban Furniture Accounting System",
  description:
    "Manage purchase orders, bills, payments, and reports for urban furniture operations.",
};

/**
 * Root layout component — renders once around every page.
 *
 * @param children - The active page or nested layout for the current route.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        {/* ThemeProvider: light/dark mode. AppProviders: auth, React Query, toasts, etc. */}
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
