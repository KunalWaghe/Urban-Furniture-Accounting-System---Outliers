import { useQuery } from "@tanstack/react-query";

import type { PurchaseOrderListParams } from "@/features/purchase-orders/purchase-orders-api";

import { fetchPurchaseOrders, fetchPurchaseOrdersPaged, fetchSalesOrders } from "./orders-api";

// `OrdersListPage` is shared by /sales-orders and /purchase-orders. Hooks can't
// be called conditionally, so callers pass `enabled` to ensure only the active
// kind actually fetches.
export function useSalesOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["sales-orders"],
    queryFn: fetchSalesOrders,
    enabled,
  });
}

export function usePurchaseOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: fetchPurchaseOrders,
    enabled,
  });
}

// Server-side paginated purchase orders for the list page
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
