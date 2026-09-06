/**
 * Vendor Bills API layer — HTTP calls and data mapping for accounts payable.
 *
 * Handles listing, fetching, creating bills from POs, confirming, and paying bills.
 * Backend status values (e.g. "open", "paid") are mapped to UI-friendly labels.
 *
 * Used by: vendor bills list/detail pages, PO detail "Create Bill" action.
 */

import { apiFetch } from "@/lib/api";
import { toPaymentDateTime } from "@/lib/format";
import { payVendorBill as recordVendorBillPayment } from "@/features/payments/payments-api";

/** Bill status values used in the UI (includes legacy backend strings). */
export type VendorBillStatus =
  | "Draft"
  | "Confirmed"
  | "Partially Paid"
  | "Paid"
  | "Cancelled"
  | "Unknown";

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
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total_with_tax: number;
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
  due_date?: string | null;
  total: number;
  tax_percent?: number;
  tax_amount?: number;
  total_with_tax?: number;
  amount_paid: number;
  status: string;
  created_at?: string | null;
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
function mapVendorBillStatus(status: string): VendorBillStatus {
  switch (status.toLowerCase()) {
    case "draft":
      return "Draft";
    case "open":
    case "confirmed":
      return "Confirmed";
    case "partially_paid":
    case "partially paid":
      return "Partially Paid";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

function toDateOnly(value: string | null | undefined): string {
  return value ? value.split("T")[0] : "Unavailable";
}

function mapVendorBillApiRecord(raw: VendorBillApiRecord): VendorBill {
  const amountPaid = raw.amount_paid ?? 0;
  const totalWithTax = raw.total_with_tax ?? raw.total;

  return {
    id: String(raw.id),
    bill_number: raw.bill_number,
    po_id: raw.po_id,
    po_number: raw.po_number ?? null,
    vendor_id: raw.vendor_id,
    vendor_name: raw.vendor_name ?? "Unavailable",
    bill_date: toDateOnly(raw.bill_date),
    due_date: toDateOnly(raw.due_date),
    status: mapVendorBillStatus(raw.status),
    subtotal: raw.total,
    tax_percent: raw.tax_percent ?? 0,
    tax_amount: raw.tax_amount ?? 0,
    total_with_tax: totalWithTax,
    total_amount: totalWithTax,
    amount_due: Math.max(0, totalWithTax - amountPaid),
    created_at: raw.created_at ?? raw.bill_date,
    journal_entry_id: raw.journal_entry_id,
    lines: (raw.lines ?? []).map((l) => ({
      id: l.id,
      product_id: l.product_id,
      product_name: l.product_name ?? "Unavailable",
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
  query.set("limit", String(params.limit ?? 10));
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
 * Records the payment through the canonical payments client, then re-fetches
 * the persisted vendor bill. A failed request never changes local bill state.
 *
 * @param billId - Bill being paid.
 * @param payment - Method, date, amount, and optional notes.
 */
export async function payVendorBill(billId: string, payment: PaymentInput): Promise<VendorBill> {
  const numericId = Number(billId);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("A valid vendor bill ID is required.");
  }

  await recordVendorBillPayment(numericId, {
    amount: payment.amount,
    payment_method: payment.payment_method,
    date: toPaymentDateTime(payment.payment_date),
    note: payment.notes,
  });

  return fetchVendorBill(String(numericId));
}
