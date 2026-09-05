/**
 * Next.js App Router — Vendor Bills List Page
 *
 * Route: `/vendor-bills`
 *
 * Thin route file: maps the URL to the vendor bills list feature component.
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { VendorBillsListPage } from "@/features/vendor-bills/vendor-bills-list-page";

/** Page-specific browser tab title and description (overrides root layout defaults). */
export const metadata = {
  title: "Vendor Bills | Urban Furniture Accounting",
  description: "Manage vendor commercial bills, accounts payable, and disbursements.",
};

/**
 * Renders the vendor bills list (payables, filters, links to bill detail).
 *
 * Feature component: `@/features/vendor-bills/vendor-bills-list-page`
 * No extra role guard — any authenticated user can access this route.
 */
export default function Page() {
  return <VendorBillsListPage />;
}
