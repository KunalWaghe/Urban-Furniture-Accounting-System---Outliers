/**
 * Orders API layer — thin wrappers that fetch sales and purchase order data.
 *
 * Sales orders are built locally from dashboard contacts + products (no dedicated
 * backend endpoint yet). Purchase orders delegate to the purchase-orders API.
 *
 * Used by: `queries.ts` React Query hooks → `OrdersListPage` UI.
 */

import {
  buildDashboardDataFromBackend,
  fetchDashboardContacts,
  fetchDashboardProducts,
} from "@/features/dashboard/dashboard-api";
import {
  fetchPurchaseOrdersPage,
  type PurchaseOrderListParams,
} from "@/features/purchase-orders/purchase-orders-api";
import type { PurchaseOrder, SalesOrder } from "@/lib/types";

/**
 * Fetches all sales orders by combining contacts and products, then building
 * synthetic sales order records from the dashboard data helper.
 *
 * @returns Array of sales orders for the list page and dashboard.
 */
export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const [contacts, products] = await Promise.all([
    fetchDashboardContacts(),
    fetchDashboardProducts(),
  ]);

  return buildDashboardDataFromBackend(contacts, products).salesOrders;
}

/**
 * Fetches every purchase order in one request (up to 100 rows).
 * Kept for dashboard widgets that need the full list without pagination.
 *
 * @returns All purchase orders as a flat array.
 */
export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { orders } = await fetchPurchaseOrdersPage({ limit: 100 });
  return orders;
}

/**
 * Fetches a single page of purchase orders with server-side search, filter, and sort.
 * Used by the purchase orders list page for paginated table display.
 *
 * @param params - Page, limit, search, status, sort_by, sort_order.
 * @returns Paginated result: orders array plus total/page/pages metadata.
 */
export async function fetchPurchaseOrdersPaged(
  params: PurchaseOrderListParams
): Promise<{ orders: PurchaseOrder[]; total: number; page: number; pages: number }> {
  return fetchPurchaseOrdersPage(params);
}
