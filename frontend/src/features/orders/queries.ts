/**
 * React Query hooks for the shared orders list page.
 *
 * Data flow: hook → orders-api.ts → backend (or dashboard helpers for sales).
 * `OrdersListPage` is reused for both /sales-orders and /purchase-orders routes,
 * so each hook accepts an `enabled` flag to avoid fetching unused data.
 */

import { useQuery } from "@tanstack/react-query";

import type { PurchaseOrderListParams } from "@/features/purchase-orders/purchase-orders-api";

import { fetchPurchaseOrders, fetchPurchaseOrdersPaged, fetchSalesOrders } from "./orders-api";

/**
 * Loads all sales orders (client-side data built from dashboard sources).
 *
 * @param enabled - Pass `true` only when the sales orders tab/page is active.
 */
export function useSalesOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["sales-orders"],
    queryFn: fetchSalesOrders,
    enabled,
  });
}

/**
 * Loads all purchase orders at once (no pagination).
 * Used by dashboard or legacy views that need the full list.
 *
 * @param enabled - Pass `true` only when purchase orders should be fetched.
 */
export function usePurchaseOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: fetchPurchaseOrders,
    enabled,
  });
}

/**
 * Loads one page of purchase orders with server-side pagination, search, filter, and sort.
 * Keeps the previous page visible while the next page loads (`placeholderData`).
 *
 * @param params - Page, limit, search, status, sort fields sent to the API.
 * @param enabled - Pass `true` only when the purchase orders list is visible.
 */
export function usePaginatedPurchaseOrders(
  params: PurchaseOrderListParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["purchase-orders-paged", params],
    queryFn: () => fetchPurchaseOrdersPaged(params),
    enabled,
    placeholderData: (prev) => prev, // keep previous page visible while loading next
  });
}
