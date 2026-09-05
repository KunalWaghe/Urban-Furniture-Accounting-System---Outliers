/**
 * Dashboard API
 *
 * Fetches live backend data for the home dashboard: master data, orders,
 * vendor bills, and derived budget metrics computed from real transactions.
 */

import { fetchCustomerInvoicesPage } from "@/features/customer-invoices/customer-invoices-api";
import { fetchSalesOrdersPage } from "@/features/sales-orders/sales-orders-api";
import { fetchPurchaseOrdersPage } from "@/features/purchase-orders/purchase-orders-api";
import {
  fetchVendorBillsPage,
  type VendorBill as ApiVendorBill,
} from "@/features/vendor-bills/vendor-bills-api";
import { apiFetch } from "@/lib/api";
import { DASHBOARD_RECENT_LIMIT } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type {
  Contact,
  ContactListResponse,
  Product,
  ProductListResponse,
  Account,
  Journal,
  SalesOrder,
  PurchaseOrder,
  DashboardVendorBill,
  BudgetMetric,
} from "@/lib/types";

/** Fetch active contacts for the dashboard. Failures propagate to the UI. */
export async function fetchDashboardContacts(): Promise<Contact[]> {
  const res = await apiFetch<ContactListResponse>("/api/v1/contacts?is_active=true&limit=100", {
    auth: true,
  });
  return res.data;
}

/** Fetch active products for the dashboard (max 100). */
export async function fetchDashboardProducts(): Promise<Product[]> {
  const res = await apiFetch<ProductListResponse>("/api/v1/products?is_active=true&limit=100", {
    auth: true,
  });
  return res.data;
}

/** Fetch active ledger accounts for the dashboard (max 100). */
export async function fetchDashboardAccounts(): Promise<Account[]> {
  const res = await apiFetch<{ data: Account[]; total: number }>(
    "/api/v1/accounts?is_active=true&limit=100",
    { auth: true }
  );
  return res.data;
}

/** Fetch active journals for the dashboard (max 100). */
export async function fetchDashboardJournals(): Promise<Journal[]> {
  const res = await apiFetch<{ data: Journal[]; total: number }>(
    "/api/v1/journals?is_active=true&limit=100",
    { auth: true }
  );
  return res.data;
}

/** Fetch recent sales orders from the live API. */
export async function fetchDashboardSalesOrders(): Promise<SalesOrder[]> {
  const { orders } = await fetchSalesOrdersPage({
    limit: DASHBOARD_RECENT_LIMIT,
    sort_by: "created_at",
    sort_order: "desc",
  });
  return orders;
}

/** Fetch recent purchase orders from the backend API. */
export async function fetchDashboardPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { orders } = await fetchPurchaseOrdersPage({
    limit: DASHBOARD_RECENT_LIMIT,
    sort_by: "created_at",
    sort_order: "desc",
  });
  return orders;
}

/** Fetch recent vendor bills from the backend API. */
export async function fetchDashboardVendorBills(): Promise<ApiVendorBill[]> {
  const res = await fetchVendorBillsPage({
    limit: DASHBOARD_RECENT_LIMIT,
    sort_by: "created_at",
    sort_order: "desc",
  });
  return res.data;
}

/** Invoice totals for dashboard summary links. */
export interface DashboardInvoiceStats {
  total: number;
  paid: number;
}

/** Fetch customer invoice counts for dashboard summary links. */
export async function fetchDashboardCustomerInvoiceStats(): Promise<DashboardInvoiceStats> {
  const res = await fetchCustomerInvoicesPage({ limit: 100 });
  const paid = res.data.filter(
    (invoice) => invoice.status === "Paid" || invoice.amount_paid > 0
  ).length;
  return { total: res.total, paid };
}

/** Maps vendor-bills API records to the simplified dashboard bill shape. */
export function mapDashboardVendorBill(bill: ApiVendorBill): DashboardVendorBill {
  let payment_status: DashboardVendorBill["payment_status"];
  const amount_paid = bill.total_amount - bill.amount_due;
  if (bill.status === "Paid" || bill.amount_due <= 0) {
    payment_status = "Paid";
  } else if (bill.amount_due > 0 && bill.amount_due < bill.total_amount) {
    payment_status = "Partially Paid";
  } else {
    payment_status = "Unpaid";
  }

  return {
    id: bill.id,
    bill_number: bill.bill_number,
    vendor_name: bill.vendor_name,
    due_date: formatDate(bill.due_date),
    amount: bill.total_amount,
    amount_paid,
    payment_status,
  };
}

/** Adds customer contact details to sales orders for dashboard display. */
export function enrichSalesOrdersWithContacts(
  orders: SalesOrder[],
  contacts: Contact[]
): SalesOrder[] {
  return orders.map((order) => {
    const contactId = order.contact_id ?? order.customer_id;
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return order;

    const locationParts = [contact.city, contact.state].filter(Boolean);
    const location =
      locationParts.length > 0
        ? `${locationParts.join(", ")}${contact.pincode ? ` (${contact.pincode})` : ""}`
        : order.customer_location;

    return {
      ...order,
      customer_location: location,
      customer_email: contact.email || order.customer_email,
      customer_phone: contact.mobile || order.customer_phone,
    };
  });
}

/** Adds vendor contact details to purchase orders for dashboard display. */
export function enrichPurchaseOrdersWithContacts(
  orders: PurchaseOrder[],
  contacts: Contact[]
): PurchaseOrder[] {
  return orders.map((order) => {
    const contact = contacts.find((c) => c.id === order.vendor_id);
    if (!contact) return order;

    const locationParts = [contact.city, contact.state].filter(Boolean);
    const location =
      locationParts.length > 0
        ? `${locationParts.join(", ")}${contact.pincode ? ` (${contact.pincode})` : ""}`
        : order.vendor_location;

    return {
      ...order,
      vendor_location: location,
      vendor_email: contact.email || order.vendor_email,
    };
  });
}

/** Marks POs that already have vendor bills as Partially Billed. */
export function markPurchaseOrdersWithBills(
  orders: PurchaseOrder[],
  bills: ApiVendorBill[]
): PurchaseOrder[] {
  const billedPoIds = new Set(
    bills.filter((b) => b.po_id != null).map((b) => String(b.po_id))
  );

  return orders.map((po) =>
    billedPoIds.has(po.id) ? { ...po, status: "Partially Billed" as const } : po
  );
}

/**
 * Derives budget utilization metrics from live sales, purchase, and bill data.
 * No dedicated budget API exists yet — these are computed aggregates.
 */
export function buildBudgetMetricsFromTransactions(params: {
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  vendorBills: DashboardVendorBill[];
}): BudgetMetric {
  const { salesOrders, purchaseOrders, vendorBills } = params;

  const confirmedSOs = salesOrders.filter(
    (o) => o.status === "Confirmed" || o.status === "Partially Billed"
  );
  const draftSOs = salesOrders.filter((o) => o.status === "Draft");
  const confirmedPOs = purchaseOrders.filter(
    (po) => po.status === "Confirmed" || po.status === "Partially Billed"
  );

  const achievedRevenue = confirmedSOs.reduce((sum, o) => sum + o.total_amount, 0);
  const committedAmount = confirmedPOs.reduce((sum, po) => sum + po.total_amount, 0);
  const actualIncurred = vendorBills.reduce((sum, b) => sum + b.amount, 0);

  const budgetCap = Math.max(committedAmount * 1.25, achievedRevenue * 1.2, 100_000);

  const committedPercent =
    budgetCap > 0 ? Math.round((committedAmount / budgetCap) * 1000) / 10 : 0;
  const actualIncurredPercent =
    budgetCap > 0 ? Math.round((actualIncurred / budgetCap) * 1000) / 10 : 0;
  const pendingCommittedPercent = Math.max(
    0,
    Math.round((committedPercent - actualIncurredPercent) * 10) / 10
  );
  const availableCapacityPercent = Math.max(
    0,
    Math.round((100 - committedPercent) * 10) / 10
  );
  const achievedTargetPercent =
    budgetCap > 0 ? Math.round((achievedRevenue / budgetCap) * 1000) / 10 : 0;

  return {
    cost_center_code: "PROC-OPS",
    cost_center_name: "Procurement & Operations",
    achieved_count: confirmedSOs.length,
    achieved_target_percent: Math.min(achievedTargetPercent, 100),
    budget_count: confirmedPOs.length + draftSOs.length,
    budget_cap: Math.round(budgetCap),
    committed_count: confirmedPOs.length,
    committed_amount: Math.round(committedAmount),
    committed_percent: Math.min(committedPercent, 100),
    actual_incurred_percent: Math.min(actualIncurredPercent, 100),
    pending_committed_percent: Math.min(pendingCommittedPercent, 100),
    available_capacity_percent: availableCapacityPercent,
  };
}
