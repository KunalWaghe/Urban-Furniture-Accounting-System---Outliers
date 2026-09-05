/**
 * Next.js App Router — New Purchase Order Page
 *
 * Route: `/purchase-orders/new`
 *
 * Thin route file for creating a new purchase order (no `:id` in the URL).
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { PurchaseOrderFormPage } from "@/features/purchase-orders/purchase-order-form-page";

/**
 * Renders the purchase order creation form (vendor, line items, submit to API).
 *
 * Feature component: `@/features/purchase-orders/purchase-order-form-page`
 * No extra role guard — any authenticated user can access this route.
 */
export default function NewPurchaseOrderPage() {
  return <PurchaseOrderFormPage />;
}
