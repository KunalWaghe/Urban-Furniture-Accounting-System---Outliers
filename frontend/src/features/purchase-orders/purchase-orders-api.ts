/**
 * Purchase Orders API layer — HTTP calls and data mapping for PO features.
 *
 * Talks to `/api/v1/purchase-orders` and related master-data endpoints
 * (vendors, products, expense accounts). Raw API shapes are mapped to
 * frontend `PurchaseOrder` types used by pages and hooks.
 *
 * Used by: orders list, PO detail/form pages, vendor bill creation.
 */

import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Account, Contact, ContactListResponse, Product, ProductListResponse } from "@/lib/types";
import type { PurchaseOrder } from "@/lib/types";

/** Single line item as returned by the backend PO endpoint. */
export interface PurchaseOrderLineApi {
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

/** Full purchase order record from the backend API. */
export interface PurchaseOrderApi {
  id: number;
  po_number: string;
  vendor_id: number;
  vendor_name: string | null;
  status: string;
  total: number;
  order_date: string;
  created_at: string;
  lines: PurchaseOrderLineApi[];
}

/** Paginated list response wrapper from GET /purchase-orders. */
export interface PurchaseOrderListResponse {
  data: PurchaseOrderApi[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Query params for listing purchase orders (search, filter, sort, page). */
export interface PurchaseOrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/** Payload for one line when creating a PO. */
export interface PurchaseOrderLineInput {
  product_id: number;
  account_id?: number;
  quantity: number;
  unit_price: number;
}

/** Payload for POST /purchase-orders. */
export interface PurchaseOrderInput {
  vendor_id: number;
  order_date?: string;
  lines: PurchaseOrderLineInput[];
}

/** Converts backend status strings (e.g. "confirmed") to display labels. */
function mapPoStatus(status: string): PurchaseOrder["status"] {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "billed":
      return "Billed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Draft";
  }
}

/**
 * Maps a raw API purchase order to the frontend `PurchaseOrder` shape.
 * Formats dates and normalizes line items for UI consumption.
 *
 * @param po - Raw record from the backend.
 */
export function mapPurchaseOrder(po: PurchaseOrderApi): PurchaseOrder {
  return {
    id: String(po.id),
    po_number: po.po_number,
    vendor_id: po.vendor_id,
    vendor_name: po.vendor_name ?? "Unknown vendor",
    po_date: formatDate(po.order_date),
    status: mapPoStatus(po.status),
    total_amount: po.total,
    items: po.lines.map((line) => ({
      id: line.id,
      product_name: line.product_name ?? "Unknown product",
      quantity: line.quantity,
      unit_cost: line.unit_price,
      total: line.subtotal,
      account_name: line.account_name ?? undefined,
    })),
  };
}

/**
 * GET /api/v1/purchase-orders — paginated list with search, status filter, and sort.
 *
 * @param params - Optional page, limit, search, status, sort_by, sort_order.
 * @returns Mapped orders plus pagination metadata (total, page, pages).
 */
export async function fetchPurchaseOrdersPage(
  params: PurchaseOrderListParams = {}
): Promise<{ orders: PurchaseOrder[]; total: number; page: number; pages: number }> {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 100));
  search.set("sort_by", params.sort_by ?? "created_at");
  search.set("sort_order", params.sort_order ?? "desc");
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.status && params.status !== "all") search.set("status", params.status);

  const res = await apiFetch<PurchaseOrderListResponse>(
    `/api/v1/purchase-orders?${search.toString()}`,
    { auth: true }
  );

  return {
    orders: res.data.map(mapPurchaseOrder),
    total: res.total,
    page: res.page,
    pages: res.pages,
  };
}

/**
 * GET /api/v1/purchase-orders/:id — raw API record (unmapped).
 * Used when the detail page needs backend fields like raw status strings.
 *
 * @param id - Numeric purchase order ID.
 */
export async function fetchPurchaseOrderApi(id: number): Promise<PurchaseOrderApi> {
  return apiFetch<PurchaseOrderApi>(`/api/v1/purchase-orders/${id}`, { auth: true });
}

/**
 * GET /api/v1/purchase-orders/:id — single PO mapped to frontend type.
 *
 * @param id - Numeric purchase order ID.
 */
export async function fetchPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const po = await fetchPurchaseOrderApi(id);
  return mapPurchaseOrder(po);
}

/**
 * POST /api/v1/purchase-orders — creates a new draft purchase order.
 *
 * @param input - Vendor, date, and line items.
 * @returns The newly created PO in frontend shape.
 */
export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<PurchaseOrder> {
  const po = await apiFetch<PurchaseOrderApi>("/api/v1/purchase-orders", {
    method: "POST",
    auth: true,
    body: input,
  });
  return mapPurchaseOrder(po);
}

/** PATCH /api/v1/purchase-orders/:id — updates a draft purchase order. */
export async function updatePurchaseOrder(id: number, input: PurchaseOrderInput): Promise<PurchaseOrder> {
  const po = await apiFetch<PurchaseOrderApi>(`/api/v1/purchase-orders/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });
  return mapPurchaseOrder(po);
}

/**
 * PATCH /api/v1/purchase-orders/:id/confirm — locks a draft PO for billing.
 *
 * @param id - Numeric purchase order ID.
 * @returns Updated PO with Confirmed status.
 */
export async function confirmPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const po = await apiFetch<PurchaseOrderApi>(`/api/v1/purchase-orders/${id}/confirm`, {
    method: "PATCH",
    auth: true,
  });
  return mapPurchaseOrder(po);
}

export async function createBillFromPo(id: number): Promise<any> {
  return apiFetch(`/api/v1/purchase-orders/${id}/create-bill`, {
    method: "POST",
    auth: true,
  });
}

export async function fetchVendors(): Promise<Contact[]> {
  const res = await apiFetch<ContactListResponse>("/api/v1/contacts?is_active=true&limit=100", { auth: true });
  return (res.data ?? []).filter((c) => c.type === "vendor" || c.type === "both");
}

/**
 * GET /api/v1/products — active products for PO line item dropdowns.
 */
export async function fetchProducts(): Promise<Product[]> {
  const res = await apiFetch<ProductListResponse>("/api/v1/products?is_active=true&limit=100", { auth: true });
  return res.data ?? [];
}

/**
 * GET /api/v1/accounts — expense accounts for PO line purchase account dropdown.
 * Filters to expense and other_expense account types.
 */
export async function fetchExpenseAccounts(): Promise<Account[]> {
  const res = await apiFetch<{ data: Account[] }>("/api/v1/accounts?is_active=true&limit=100", { auth: true });
  return (res.data ?? []).filter((a) => a.type === "expense" || a.type === "other_expense");
}
