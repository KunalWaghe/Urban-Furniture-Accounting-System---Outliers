import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Account, Contact, ContactListResponse, Product, ProductListResponse } from "@/lib/types";
import type { PurchaseOrder } from "@/lib/types";

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

export interface PurchaseOrderListResponse {
  data: PurchaseOrderApi[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PurchaseOrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface PurchaseOrderLineInput {
  product_id: number;
  account_id?: number;
  quantity: number;
  unit_price: number;
}

export interface PurchaseOrderInput {
  vendor_id: number;
  order_date?: string;
  lines: PurchaseOrderLineInput[];
}

function mapPoStatus(status: string): PurchaseOrder["status"] {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Draft";
  }
}

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

export async function fetchPurchaseOrderApi(id: number): Promise<PurchaseOrderApi> {
  return apiFetch<PurchaseOrderApi>(`/api/v1/purchase-orders/${id}`, { auth: true });
}

export async function fetchPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const po = await fetchPurchaseOrderApi(id);
  return mapPurchaseOrder(po);
}

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<PurchaseOrder> {
  const po = await apiFetch<PurchaseOrderApi>("/api/v1/purchase-orders", {
    method: "POST",
    auth: true,
    body: input,
  });
  return mapPurchaseOrder(po);
}

export async function confirmPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const po = await apiFetch<PurchaseOrderApi>(`/api/v1/purchase-orders/${id}/confirm`, {
    method: "PATCH",
    auth: true,
  });
  return mapPurchaseOrder(po);
}

export async function fetchVendors(): Promise<Contact[]> {
  const res = await apiFetch<ContactListResponse>("/api/v1/contacts?is_active=true", { auth: true });
  return (res.data ?? []).filter((c) => c.type === "vendor" || c.type === "both");
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await apiFetch<ProductListResponse>("/api/v1/products?is_active=true", { auth: true });
  return res.data ?? [];
}

export async function fetchExpenseAccounts(): Promise<Account[]> {
  const res = await apiFetch<{ data: Account[] }>("/api/v1/accounts?is_active=true", { auth: true });
  return (res.data ?? []).filter((a) => a.type === "expense" || a.type === "other_expense");
}
