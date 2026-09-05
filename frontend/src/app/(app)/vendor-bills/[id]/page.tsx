/**
 * Next.js App Router — Vendor Bill Detail Page
 *
 * Route: `/vendor-bills/[id]` (dynamic segment — `[id]` is the bill id from the URL)
 *
 * Resolves the async `params` with React's `use()` hook and passes the id to the
 * detail feature component.
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { use } from "react";
import { VendorBillDetailPage } from "@/features/vendor-bills/vendor-bill-detail-page";

/** Page-specific browser tab title (overrides root layout defaults). */
export const metadata = {
  title: "Vendor Bill Details | Urban Furniture Accounting",
};

/** Props provided by Next.js for dynamic routes — `params` is async in the App Router. */
interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Renders a single vendor bill's detail view (amount, vendor, payment status).
 *
 * Feature component: `@/features/vendor-bills/vendor-bill-detail-page`
 * @param params - Route params; `id` comes from the URL segment after `/vendor-bills/`.
 */
export default function Page({ params }: PageProps) {
  const { id } = use(params);
  return <VendorBillDetailPage billId={id} />;
}
