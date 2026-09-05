/**
 * Next.js App Router — Chart of Accounts Page
 *
 * Route: `/chart-of-accounts`
 *
 * Thin route file: maps the URL to the feature component that owns the UI and logic.
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { ChartOfAccountsPage } from "@/features/master-data/chart-of-accounts-page";

/**
 * Renders the chart of accounts (GL account list and accounting structure).
 *
 * Feature component: `@/features/master-data/chart-of-accounts-page`
 * No extra role guard — any authenticated user can access this route.
 */
export default function ChartOfAccountsRoute() {
  return <ChartOfAccountsPage />;
}
