/**
 * Sales-order API client. All reads and mutations are server-authoritative;
 * unavailable routes and failed requests are surfaced to the caller.
 */

import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type {
  Account,
  Contact,
  ContactListResponse,
  Product,
  ProductListResponse,
  SalesOrder,
} from "@/lib/types";

export interface SalesOrderLineApi {
  id: number;
  product_id: number;
  product_name: string | null;
  account_id: number | null;
  account_name: string | null;
  analytic_account_id: number | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SalesOrderApi {
  id: number;
  so_number: string;
  customer_id: number;
  customer_name: string | null;
  status: string;
  total: number;
  order_date: string;
  created_at: string;
  lines: SalesOrderLineApi[];
}

export interface SalesOrderListResponse {
  data: SalesOrderApi[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SalesOrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface SalesOrderLineInput {
  product_id: number;
  account_id?: number;
  quantity: number;
  unit_price: number;
}

export interface SalesOrderInput {
  customer_id: number;
  order_date?: string;
  lines: SalesOrderLineInput[];
}

function mapSoStatus(status: string): SalesOrder["status"] {
  switch (status.toLowerCase()) {
    case "draft":
      return "Draft";
    case "confirmed":
      return "Confirmed";
    case "invoiced":
    case "partially billed":
    case "partially_billed":
    case "billed":
      return "Partially Billed";
    case "cancelled":
      return "Cancelled";
    default:
      // Log unrecognised statuses in development to catch backend drift early
      if (process.env.NODE_ENV === "development") {
        console.warn(`[SO] Unrecognised status from backend: "${status}". Falling back to "Unknown".`);
      }
      return "Unknown";
  }
}

export function mapSalesOrder(order: SalesOrderApi): SalesOrder {
  return {
    id: String(order.id),
    order_number: order.so_number,
    contact_id: order.customer_id,
    customer_id: order.customer_id,
    customer_name: order.customer_name ?? "Unavailable",
    order_date: formatDate(order.order_date),
    created_at: order.created_at,
    status: mapSoStatus(order.status),
    total_amount: order.total,
    items: order.lines.map((line) => ({
      id: line.id,
      product_name: line.product_name ?? "Unavailable",
      quantity: line.quantity,
      unit_price: line.unit_price,
      total: line.subtotal,
      account_name: line.account_name ?? undefined,
    })),
  };
}

/** GET /api/v1/sales-orders with server-side filtering and pagination. */
export async function fetchSalesOrdersPage(
  params: SalesOrderListParams = {}
): Promise<{ orders: SalesOrder[]; total: number; page: number; pages: number }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  query.set("sort_by", params.sort_by ?? "created_at");
  query.set("sort_order", params.sort_order ?? "desc");
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") {
    const backendStatus = params.status === "Partially Billed" ? "invoiced" : params.status.toLowerCase();
    query.set("status", backendStatus);
  }

  const response = await apiFetch<SalesOrderListResponse>(
    `/api/v1/sales-orders?${query.toString()}`,
    { auth: true }
  );

  return {
    orders: response.data.map(mapSalesOrder),
    total: response.total,
    page: response.page,
    pages: response.pages,
  };
}

export async function fetchSalesOrderApi(id: number): Promise<SalesOrderApi> {
  return apiFetch<SalesOrderApi>(`/api/v1/sales-orders/${id}`, { auth: true });
}

export async function fetchSalesOrder(id: number): Promise<SalesOrder> {
  return mapSalesOrder(await fetchSalesOrderApi(id));
}

export async function createSalesOrder(input: SalesOrderInput): Promise<SalesOrder> {
  const response = await apiFetch<SalesOrderApi>("/api/v1/sales-orders", {
    method: "POST",
    auth: true,
    body: input,
  });
  return mapSalesOrder(response);
}

export async function confirmSalesOrder(id: number): Promise<SalesOrder> {
  const response = await apiFetch<SalesOrderApi>(`/api/v1/sales-orders/${id}/confirm`, {
    method: "PATCH",
    auth: true,
  });
  return mapSalesOrder(response);
}

/**
 * PATCH /api/v1/sales-orders/:id/cancel — cancels a draft or confirmed SO.
 *
 * @param id - Numeric sales order ID.
 * @returns Updated SO with Cancelled status.
 */
export async function cancelSalesOrder(id: number): Promise<SalesOrder> {
  const response = await apiFetch<SalesOrderApi>(`/api/v1/sales-orders/${id}/cancel`, {
    method: "PATCH",
    auth: true,
  });
  return mapSalesOrder(response);
}


const PICKER_LIMIT = 100;

export async function fetchCustomers(): Promise<Contact[]> {
  const response = await apiFetch<ContactListResponse>(
    `/api/v1/contacts?type=customer&is_active=true&limit=${PICKER_LIMIT}`,
    { auth: true }
  );
  return response.data.filter((contact) => contact.type === "customer" || contact.type === "both");
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await apiFetch<ProductListResponse>(
    `/api/v1/products?is_active=true&limit=${PICKER_LIMIT}`,
    { auth: true }
  );
  return response.data;
}

export async function fetchIncomeAccounts(): Promise<Account[]> {
  const response = await apiFetch<{ data: Account[] }>(
    `/api/v1/accounts?is_active=true&limit=${PICKER_LIMIT}`,
    { auth: true }
  );
  return response.data.filter((account) => account.type === "income");
}
