/**
 * Vendor Bills API layer — HTTP calls and data mapping for accounts payable.
 *
 * Handles listing, fetching, creating bills from POs, confirming, and paying bills.
 * Backend status values (e.g. "open", "paid") are mapped to UI-friendly labels.
 *
 * Used by: vendor bills list/detail pages, PO detail "Create Bill" action.
 */

import { apiFetch } from "@/lib/api";

/** Bill status values used in the UI (includes legacy backend strings). */
export type VendorBillStatus = "Draft" | "Confirmed" | "Paid" | "Cancelled" | "open" | "paid" | "partially_paid";

/** Single line item on a vendor bill. */
export interface VendorBillLine {
  id: number;
  product_id: number;
  product_name: string;
  account_id?: number | null;
  account_name?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/** Vendor bill as used by list and detail pages. */
export interface VendorBill {
  id: string;
  bill_number: string;
  po_id?: number | null;
  po_number?: string | null;
  vendor_id: number;
  vendor_name: string;
  bill_date: string;
  due_date: string;
  status: VendorBillStatus;
  total_amount: number;
  amount_due: number;
  payment_method?: "bank" | "cash" | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  created_at: string;
  lines: VendorBillLine[];
  journal_entry_id?: number | null;
}

/** Payload for registering a payment against a bill. */
export interface PaymentInput {
  payment_method: "bank" | "cash";
  payment_date: string;
  amount: number;
  notes?: string;
}

/** Query params for listing vendor bills. */
export interface VendorBillsParams {
  status?: string;
  vendor_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/** Paginated list result returned to the UI. */
export interface VendorBillListResult {
  data: VendorBill[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Raw line shape from the backend vendor-bills endpoint. */
interface VendorBillApiLine {
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

/** Raw bill record from the backend. */
interface VendorBillApiRecord {
  id: number;
  bill_number: string;
  po_id: number;
  po_number?: string | null;
  vendor_id: number;
  vendor_name?: string | null;
  bill_date: string;
  total: number;
  amount_paid: number;
  status: string;
  journal_entry_id?: number | null;
  lines?: VendorBillApiLine[] | null;
}

/** Paginated list wrapper from GET /vendor-bills. */
interface VendorBillApiResponseList {
  data: VendorBillApiRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Converts a raw backend bill record into the frontend `VendorBill` shape.
 * Maps status strings, computes due date (+14 days), and normalizes line items.
 */
function mapVendorBillApiRecord(raw: VendorBillApiRecord): VendorBill {
  let mappedStatus: VendorBillStatus = "Confirmed";
  if (raw.status === "paid") {
    mappedStatus = "Paid";
  } else if (raw.status === "draft") {
    mappedStatus = "Draft";
  } else if (raw.status === "cancelled") {
    mappedStatus = "Cancelled";
  } else {
    // "open" or default active status
    mappedStatus = "Confirmed";
  }

  const rawDate = raw.bill_date ? raw.bill_date.split("T")[0] : new Date().toISOString().split("T")[0];
  const dueDateObj = new Date(new Date(rawDate).getTime() + 14 * 24 * 60 * 60 * 1000);
  const dueDate = dueDateObj.toISOString().split("T")[0];

  return {
    id: String(raw.id),
    bill_number: raw.bill_number,
    po_id: raw.po_id,
    po_number: raw.po_number ?? (raw.po_id ? `PO-${String(raw.po_id).padStart(4, "0")}` : null),
    vendor_id: raw.vendor_id,
    vendor_name: raw.vendor_name ?? "Vendor",
    bill_date: rawDate,
    due_date: dueDate,
    status: mappedStatus,
    total_amount: raw.total,
    amount_due: Math.max(0, raw.total - (raw.amount_paid || 0)),
    created_at: raw.bill_date,
    journal_entry_id: raw.journal_entry_id,
    lines: (raw.lines ?? []).map((l) => ({
      id: l.id,
      product_id: l.product_id,
      product_name: l.product_name ?? "Product",
      account_id: l.account_id,
      account_name: l.account_name,
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.subtotal,
    })),
  };
}

/**
 * GET /api/v1/vendor-bills — paginated list with search, status filter, and sort.
 *
 * @param params - Optional page, limit, search, status, vendor_id, sort fields.
 * @returns Mapped bills plus pagination metadata.
 */
export async function fetchVendorBillsPage(params: VendorBillsParams = {}): Promise<VendorBillListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") {
    const backendStatus = params.status === "Confirmed" ? "open" : params.status.toLowerCase();
    query.set("status", backendStatus);
  }
  if (params.vendor_id) query.set("vendor_id", String(params.vendor_id));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const qs = query.toString();
  const path = `/api/v1/vendor-bills${qs ? `?${qs}` : ""}`;
  const res = await apiFetch<VendorBillApiResponseList>(path, { auth: true });

  return {
    data: (res.data ?? []).map(mapVendorBillApiRecord),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

/**
 * Fetches up to 100 vendor bills (non-paginated convenience wrapper).
 * Used where a full list is needed without page params.
 */
export async function fetchVendorBills(): Promise<VendorBill[]> {
  const res = await fetchVendorBillsPage({ limit: 100 });
  return res.data;
}

/**
 * GET /api/v1/vendor-bills/:id — fetches a single bill by numeric ID or bill number.
 * Falls back to search if the ID is not numeric.
 *
 * @param id - Bill ID string or bill number.
 * @throws Error if no matching bill is found.
 */
export async function fetchVendorBill(id: string): Promise<VendorBill> {
  const numId = parseInt(id, 10);
  if (!isNaN(numId)) {
    const raw = await apiFetch<VendorBillApiRecord>(`/api/v1/vendor-bills/${numId}`, { auth: true });
    return mapVendorBillApiRecord(raw);
  }
  const res = await fetchVendorBillsPage({ search: id, limit: 10 });
  const found = res.data.find((b) => b.id === id || b.bill_number.toLowerCase() === id.toLowerCase());
  if (!found) {
    throw new Error(`Vendor Bill with ID "${id}" not found.`);
  }
  return found;
}

/**
 * POST /api/v1/purchase-orders/:poId/create-bill — creates a vendor bill from a confirmed PO.
 *
 * @param poId - Source purchase order ID.
 * @returns The newly created vendor bill.
 */
export async function createBillFromPo(poId: number): Promise<VendorBill> {
  const res = await apiFetch<{ bill: VendorBillApiRecord; journal_entry?: unknown }>(
    `/api/v1/purchase-orders/${poId}/create-bill`,
    {
      method: "POST",
      auth: true,
    }
  );
  return mapVendorBillApiRecord(res.bill);
}

/**
 * Confirms a vendor bill. Currently re-fetches the bill because the backend
 * auto-posts on creation; no separate confirm endpoint is called yet.
 *
 * @param billId - Bill ID to confirm.
 */
export async function confirmVendorBill(billId: string): Promise<VendorBill> {
  // Backend automatically posts/confirms bill on creation
  return fetchVendorBill(billId);
}

/**
 * Registers payment for a vendor bill. Currently updates local state only
 * until a dedicated payment endpoint exists on the backend.
 *
 * @param billId - Bill being paid.
 * @param payment - Method, date, amount, and optional notes.
 */
export async function payVendorBill(billId: string, payment: PaymentInput): Promise<VendorBill> {
  // For UI responsiveness until payment endpoint is added to backend
  const bill = await fetchVendorBill(billId);
  return {
    ...bill,
    status: "Paid",
    amount_due: 0,
    payment_method: payment.payment_method,
    payment_date: payment.payment_date,
    payment_notes: payment.notes,
  };
}
