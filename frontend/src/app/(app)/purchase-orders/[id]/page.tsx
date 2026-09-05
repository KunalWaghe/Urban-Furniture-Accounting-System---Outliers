/**
 * Next.js App Router — Purchase Order Detail Page
 *
 * Route: `/purchase-orders/[id]` (dynamic segment — `[id]` is the PO id from the URL)
 *
 * Reads the route param on the server, converts it to a number, and passes it
 * to the detail feature component.
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { PurchaseOrderDetailPage } from "@/features/purchase-orders/purchase-order-detail-page";

/** Props provided by Next.js for dynamic routes — `params` is async in the App Router. */
interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Renders a single purchase order's detail view (status, lines, actions).
 *
 * Feature component: `@/features/purchase-orders/purchase-order-detail-page`
 * @param params - Route params; `id` comes from the URL segment after `/purchase-orders/`.
 */
export default async function PurchaseOrderDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <PurchaseOrderDetailPage poId={Number(id)} />;
}
