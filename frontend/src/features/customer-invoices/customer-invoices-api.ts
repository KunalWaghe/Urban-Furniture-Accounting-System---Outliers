/**
 * Customer invoice API client.
 *
 * Accounting data is server-authoritative. This module never creates or
 * updates invoices in browser storage when a request fails.
 */

import { apiFetch } from "@/lib/api";
import type { PaymentRecord } from "@/features/payments/payments-api";

export type CustomerInvoiceStatus =
  | "Draft"
  | "Confirmed"
  | "Partially Paid"
  | "Paid"
  | "Cancelled"
  | "Unknown";

export interface CustomerInvoiceLine {
  id: number;
  product_id: number;
  product_name: string;
  account_id?: number | null;
  account_name?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CustomerInvoice {
  id: string;
  invoice_number: string;
  so_id?: number | null;
  so_number?: string | null;
  customer_id: number;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  status: CustomerInvoiceStatus;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_method?: "bank" | "cash" | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  created_at: string;
  lines: CustomerInvoiceLine[];
  journal_entry_id?: number | null;
  journal_code?: string | null;
}

export interface CustomerPaymentInput {
  payment_method: "bank" | "cash";
  payment_date: string;
  amount: number;
  notes?: string;
}

export interface CustomerInvoicesParams {
  status?: string;
  customer_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface CustomerInvoiceListResult {
  data: CustomerInvoice[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface CustomerInvoiceApiLine {
  id: number;
  product_id: number;
  product_name?: string | null;
  account_id?: number | null;
  account_name?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CustomerInvoiceApiRecord {
  id: number;
  invoice_number: string;
  so_id?: number | null;
  so_number?: string | null;
  customer_id: number;
  customer_name?: string | null;
  invoice_date: string;
  due_date?: string | null;
  total: number;
  amount_paid: number;
  status: string;
  journal_entry_id?: number | null;
  lines?: CustomerInvoiceApiLine[] | null;
}

interface CustomerInvoiceApiResponseList {
  data: CustomerInvoiceApiRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function mapCustomerInvoiceStatus(status: string): CustomerInvoiceStatus {
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

function mapCustomerInvoiceApiRecord(raw: CustomerInvoiceApiRecord): CustomerInvoice {
  const amountPaid = raw.amount_paid ?? 0;

  return {
    id: String(raw.id),
    invoice_number: raw.invoice_number,
    so_id: raw.so_id ?? null,
    so_number: raw.so_number ?? null,
    customer_id: raw.customer_id,
    customer_name: raw.customer_name ?? "Unavailable",
    invoice_date: toDateOnly(raw.invoice_date),
    due_date: toDateOnly(raw.due_date),
    status: mapCustomerInvoiceStatus(raw.status),
    total_amount: raw.total,
    amount_paid: amountPaid,
    amount_due: Math.max(0, raw.total - amountPaid),
    created_at: raw.invoice_date,
    journal_entry_id: raw.journal_entry_id ?? null,
    journal_code: null,
    lines: (raw.lines ?? []).map((line) => ({
      id: line.id,
      product_id: line.product_id,
      product_name: line.product_name ?? "Unavailable",
      account_id: line.account_id ?? null,
      account_name: line.account_name ?? null,
      quantity: line.quantity,
      unit_price: line.unit_price,
      subtotal: line.subtotal,
    })),
  };
}

/** GET /api/v1/customer-invoices with server-side filters and pagination. */
export async function fetchCustomerInvoicesPage(
  params: CustomerInvoicesParams = {}
): Promise<CustomerInvoiceListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") {
    const backendStatus = params.status === "Confirmed" ? "open" : params.status.toLowerCase().replaceAll(" ", "_");
    query.set("status", backendStatus);
  }
  if (params.customer_id) query.set("customer_id", String(params.customer_id));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const qs = query.toString();
  const response = await apiFetch<CustomerInvoiceApiResponseList>(
    `/api/v1/customer-invoices${qs ? `?${qs}` : ""}`,
    { auth: true }
  );

  return {
    data: response.data.map(mapCustomerInvoiceApiRecord),
    total: response.total,
    page: response.page,
    limit: response.limit,
    pages: response.pages,
  };
}

/** GET /api/v1/customer-invoices/:id. Invoice numbers are not route IDs. */
export async function fetchCustomerInvoice(id: string): Promise<CustomerInvoice> {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("A valid customer invoice ID is required.");
  }

  const response = await apiFetch<CustomerInvoiceApiRecord>(
    `/api/v1/customer-invoices/${numericId}`,
    { auth: true }
  );
  return mapCustomerInvoiceApiRecord(response);
}

/** Creates a server-posted invoice from a confirmed sales order. */
export async function createInvoiceFromSo(soId: number): Promise<CustomerInvoice> {
  const response = await apiFetch<{ invoice: CustomerInvoiceApiRecord }>(
    `/api/v1/sales-orders/${soId}/create-invoice`,
    { method: "POST", auth: true }
  );
  return mapCustomerInvoiceApiRecord(response.invoice);
}

/**
 * The backend creates customer invoices directly in their posted/open state.
 * There is intentionally no local "confirm" mutation to fabricate a state.
 */
export async function confirmCustomerInvoice(_invoiceId: string): Promise<CustomerInvoice> {
  throw new Error("Customer invoices are confirmed by the server when they are created.");
}

/**
 * Records a persisted receipt, then re-reads the invoice as the source of
 * truth. The payment endpoint returns a payment record, not an invoice.
 */
export async function payCustomerInvoice(
  invoiceId: string,
  payment: CustomerPaymentInput
): Promise<CustomerInvoice> {
  const numericId = Number(invoiceId);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("A valid customer invoice ID is required.");
  }

  await apiFetch<PaymentRecord>(`/api/v1/customer-invoices/${numericId}/pay`, {
    method: "POST",
    auth: true,
    body: {
      amount: payment.amount,
      payment_method: payment.payment_method,
      date: payment.payment_date + "T00:00:00",
      note: payment.notes,
    },
  });

  return fetchCustomerInvoice(invoiceId);
}
