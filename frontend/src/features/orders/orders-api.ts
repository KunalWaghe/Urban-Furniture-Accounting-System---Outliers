import {
  buildDashboardDataFromBackend,
  fetchDashboardContacts,
  fetchDashboardProducts,
} from "@/features/dashboard/dashboard-api";
import type { PurchaseOrder, SalesOrder } from "@/lib/types";

export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const [contacts, products] = await Promise.all([
    fetchDashboardContacts(),
    fetchDashboardProducts(),
  ]);

  return buildDashboardDataFromBackend(contacts, products).salesOrders;
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const [contacts, products] = await Promise.all([
    fetchDashboardContacts(),
    fetchDashboardProducts(),
  ]);

  return buildDashboardDataFromBackend(contacts, products).purchaseOrders;
}
