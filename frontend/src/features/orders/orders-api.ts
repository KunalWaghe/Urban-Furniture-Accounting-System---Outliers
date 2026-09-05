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

export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const [contacts, products] = await Promise.all([
    fetchDashboardContacts(),
    fetchDashboardProducts(),
  ]);

  return buildDashboardDataFromBackend(contacts, products).salesOrders;
}

// Legacy: fetches all POs at once (kept for dashboard usage)
export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { orders } = await fetchPurchaseOrdersPage({ limit: 100 });
  return orders;
}

// Paginated fetch for the purchase orders list page
export async function fetchPurchaseOrdersPaged(
  params: PurchaseOrderListParams
): Promise<{ orders: PurchaseOrder[]; total: number; page: number; pages: number }> {
  return fetchPurchaseOrdersPage(params);
}
