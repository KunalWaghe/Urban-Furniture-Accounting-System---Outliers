import { apiFetch } from "@/lib/api";
import type {
  Account,
  AnalyticAccount,
  Contact,
  ContactListResponse,
  Product,
  ProductListResponse,
} from "@/lib/types";

// API-shaped Purchase Order types. These differ from the demo-adapter
// PurchaseOrder in lib/types (string ids, display formatting) — this module
// talks to the real backend, so ids are numbers and status is lowercase.
export interface PurchaseOrderLine {
  id: number;
  product_id: number;
  product_name?: string | null;
  account_id?: number | null;
  account_name?: string | null;
  analytic_account_id?: number | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type PurchaseOrderStatus = "draft" | "confirmed" | "cancelled";

export interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  vendor_name?: string | null;
  status: PurchaseOrderStatus;
  total: number;
  order_date: string;
  created_at: string;
  confirmed_at?: string | null;
  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderPage {
  data: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type PurchaseOrderSort = "po_number" | "order_date" | "total" | "created_at" | "id";

export interface PurchaseOrderListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy: PurchaseOrderSort;
  sortOrder: "asc" | "desc";
}

export interface PurchaseOrderLineInput {
  product_id: number;
  account_id?: number | null;
  analytic_account_id?: number | null;
  quantity: number;
  unit_price: number;
}

export interface PurchaseOrderInput {
  vendor_id: number;
  order_date?: string;
  lines: PurchaseOrderLineInput[];
}

export async function fetchPurchaseOrdersPage(params: PurchaseOrderListParams): Promise<PurchaseOrderPage> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sort_by: params.sortBy,
    sort_order: params.sortOrder,
  });
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.status && params.status !== "all") search.set("status", params.status);
  return apiFetch<PurchaseOrderPage>(`/api/v1/purchase-orders?${search.toString()}`, { auth: true });
}

export async function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}`, { auth: true });
}

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders`, { auth: true, method: "POST", body: input });
}

export async function updatePurchaseOrder(id: string, input: PurchaseOrderInput): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}`, { auth: true, method: "PUT", body: input });
}

export async function confirmPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/confirm`, { auth: true, method: "PATCH" });
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/cancel`, { auth: true, method: "PATCH" });
}

export async function fetchVendors(): Promise<Contact[]> {
  const res = await apiFetch<ContactListResponse>(`/api/v1/contacts?type=vendor&is_active=true&limit=100`, { auth: true });
  return res.data;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await apiFetch<ProductListResponse>(`/api/v1/products?is_active=true&limit=100`, { auth: true });
  return res.data;
}

export async function fetchExpenseAccounts(): Promise<Account[]> {
  const res = await apiFetch<{ data: Account[] }>(`/api/v1/accounts?is_active=true&limit=100`, { auth: true });
  return res.data.filter((a) => a.type === "expense" || a.type === "other_expense");
}

export async function fetchAnalyticAccounts(): Promise<AnalyticAccount[]> {
  const res = await apiFetch<{ data: AnalyticAccount[] }>(`/api/v1/analytic-accounts`, { auth: true });
  return res.data;
}

export async function fetchNextPoNumberPreview(): Promise<string> {
  const res = await fetchPurchaseOrdersPage({ page: 1, limit: 1, sortBy: "id", sortOrder: "desc" });
  const latest = res.data[0]?.po_number;
  const nextNumber = latest ? parseInt(latest.replace(/\D/g, ""), 10) + 1 : 1;
  return `PO-${String(nextNumber).padStart(4, "0")}`;
}
