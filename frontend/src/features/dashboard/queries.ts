/**
 * Dashboard React Query Hooks
 *
 * Connects the dashboard UI to live backend APIs via `dashboard-api.ts`.
 */

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants";

import {
  buildBudgetMetricsFromTransactions,
  enrichPurchaseOrdersWithContacts,
  enrichSalesOrdersWithContacts,
  fetchDashboardContacts,
  fetchDashboardCustomerInvoiceStats,
  fetchDashboardProducts,
  fetchDashboardPurchaseOrders,
  fetchDashboardSalesOrders,
  fetchDashboardVendorBills,
  mapDashboardVendorBill,
  markPurchaseOrdersWithBills,
} from "./dashboard-api";

export function useContacts() {
  return useQuery({
    queryKey: QUERY_KEYS.CONTACTS,
    queryFn: fetchDashboardContacts,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: fetchDashboardProducts,
  });
}

export function useDashboardSalesOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_ORDERS,
    queryFn: fetchDashboardSalesOrders,
  });
}

export function useDashboardPurchaseOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.PURCHASE_ORDERS,
    queryFn: fetchDashboardPurchaseOrders,
  });
}

export function useDashboardVendorBills() {
  return useQuery({
    queryKey: QUERY_KEYS.VENDOR_BILLS,
    queryFn: fetchDashboardVendorBills,
  });
}

export function useDashboardCustomerInvoiceStats() {
  return useQuery({
    queryKey: ["customer-invoices", "stats"],
    queryFn: fetchDashboardCustomerInvoiceStats,
  });
}

/**
 * Combines order/bill queries with contacts to produce enriched dashboard data
 * and derived budget metrics from live transactions.
 */
export function useDashboardOrderData() {
  const contactsQuery = useContacts();
  const salesQuery = useDashboardSalesOrders();
  const purchaseQuery = useDashboardPurchaseOrders();
  const billsQuery = useDashboardVendorBills();

  const contacts = contactsQuery.data ?? [];
  const apiBills = billsQuery.data ?? [];

  const salesOrders = enrichSalesOrdersWithContacts(salesQuery.data ?? [], contacts);
  const purchaseOrders = markPurchaseOrdersWithBills(
    enrichPurchaseOrdersWithContacts(purchaseQuery.data ?? [], contacts),
    apiBills
  );
  const vendorBills = apiBills.map(mapDashboardVendorBill);

  const budgetMetric =
    salesQuery.isSuccess && purchaseQuery.isSuccess && billsQuery.isSuccess
      ? buildBudgetMetricsFromTransactions({ salesOrders, purchaseOrders, vendorBills })
      : null;

  const isLoading =
    contactsQuery.isLoading ||
    salesQuery.isLoading ||
    purchaseQuery.isLoading ||
    billsQuery.isLoading;

  const refetchAll = async () => {
    await Promise.all([
      contactsQuery.refetch(),
      salesQuery.refetch(),
      purchaseQuery.refetch(),
      billsQuery.refetch(),
    ]);
  };

  return {
    contacts,
    salesOrders,
    purchaseOrders,
    vendorBills,
    budgetMetric,
    isLoading,
    refetchAll,
  };
}
