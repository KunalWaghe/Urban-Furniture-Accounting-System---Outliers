/**
 * Next.js App Router — Purchase Orders Page
 *
 * Route: `/purchase-orders`
 *
 * Thin route file: passes `kind="purchase"` so one shared list component can serve
 * both sales and purchase order routes.
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { OrdersListPage } from "@/features/orders/orders-list-page";

/**
 * Renders the purchase orders list (filtering, status, links to PO details).
 *
 * Feature component: `@/features/orders/orders-list-page` with `kind="purchase"`.
 * No extra role guard — any authenticated user can access this route.
 */
export default function PurchaseOrdersPage() {
  return <OrdersListPage kind="purchase" />;
}
