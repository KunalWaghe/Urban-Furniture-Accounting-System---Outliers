import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/components/app-providers";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Urban Furniture Accounting System",
  description:
    "Manage purchase orders, bills, payments, and reports for urban furniture operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
