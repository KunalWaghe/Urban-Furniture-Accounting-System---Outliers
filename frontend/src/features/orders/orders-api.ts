/**
 * Orders API layer — thin wrappers that fetch sales and purchase order data.
 *
 * Both sales and purchase orders delegate to their respective feature APIs.
 *
 * Used by: `queries.ts` React Query hooks → `OrdersListPage` UI.
 */

import {
  fetchPurchaseOrdersPage,
  type PurchaseOrderListParams,
} from "@/features/purchase-orders/purchase-orders-api";
import { fetchSalesOrdersPage } from "@/features/sales-orders/sales-orders-api";
import type { PurchaseOrder, SalesOrder } from "@/lib/types";

/** Fetches all sales orders (up to 100 rows) from the sales-orders API. */
export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const { orders } = await fetchSalesOrdersPage({
    limit: 100,
    sort_by: "created_at",
    sort_order: "desc",
  });
  return orders;
}

/** Fetches every purchase order in one request (up to 100 rows). */
export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { orders } = await fetchPurchaseOrdersPage({ limit: 100 });
  return orders;
}

/** Fetches a single page of purchase orders with server-side search, filter, and sort. */
export async function fetchPurchaseOrdersPaged(
  params: PurchaseOrderListParams
): Promise<{ orders: PurchaseOrder[]; total: number; page: number; pages: number }> {
  return fetchPurchaseOrdersPage(params);
}
