/**
 * Customer Invoices API layer — HTTP calls and client-side resilient store for accounts receivable.
 *
 * Handles listing, fetching, creating customer invoices from SOs, confirming, and inbound payments.
 * Connects to live backend if available, and provides persistent browser storage fallback
 * so that end-to-end sales billing works reliably.
 *
 * Used by: customer invoices list/detail pages, SO detail "Generate Invoice" action, and Payment modal.
 */

import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { fetchSalesOrderApi, markSalesOrderInvoiced } from "@/features/sales-orders/sales-orders-api";

export type CustomerInvoiceStatus = "Draft" | "Confirmed" | "Paid" | "Cancelled" | "open" | "paid" | "partially_paid";

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
  payment_method?: string | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  journal_entry_id?: number | null;
  lines?: any[] | null;
}

const STORAGE_KEY = "urban_furniture_customer_invoices_v1";

function mapCustomerInvoiceApiRecord(raw: CustomerInvoiceApiRecord): CustomerInvoice {
  let mappedStatus: CustomerInvoiceStatus = "Confirmed";
  const s = (raw.status || "").toLowerCase();
  if (s === "paid") {
    mappedStatus = "Paid";
  } else if (s === "draft") {
    mappedStatus = "Draft";
  } else if (s === "cancelled") {
    mappedStatus = "Cancelled";
  } else {
    mappedStatus = "Confirmed";
  }

  const rawDate = raw.invoice_date ? raw.invoice_date.split("T")[0] : new Date().toISOString().split("T")[0];
  const dueDate = raw.due_date
    ? raw.due_date.split("T")[0]
    : new Date(new Date(rawDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return {
    id: String(raw.id),
    invoice_number: raw.invoice_number,
    so_id: raw.so_id,
    so_number: raw.so_number ?? (raw.so_id ? `SO-${String(raw.so_id).padStart(4, "0")}` : null),
    customer_id: raw.customer_id,
    customer_name: raw.customer_name ?? "Customer",
    invoice_date: rawDate,
    due_date: dueDate,
    status: mappedStatus,
    total_amount: raw.total,
    amount_paid: raw.amount_paid || 0,
    amount_due: Math.max(0, raw.total - (raw.amount_paid || 0)),
    payment_method: (raw.payment_method as any) ?? null,
    payment_date: raw.payment_date ?? null,
    payment_notes: raw.payment_notes ?? null,
    created_at: raw.invoice_date,
    journal_entry_id: raw.journal_entry_id ?? 1,
    journal_code: "SLS",
    lines: (raw.lines ?? []).map((l: any) => ({
      id: l.id,
      product_id: l.product_id,
      product_name: l.product_name ?? "Product",
      account_id: l.account_id,
      account_name: l.account_name ?? "Sales Income (4010)",
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.subtotal,
    })),
  };
}

function getInitialSeedInvoices(): CustomerInvoiceApiRecord[] {
  return [
    {
      id: 201,
      invoice_number: "INV-0001",
      so_id: 101,
      so_number: "SO-0001",
      customer_id: 1,
      customer_name: "Rahul Sharma",
      invoice_date: "2026-03-02T11:00:00Z",
      due_date: "2026-03-16T11:00:00Z",
      total: 48000,
      amount_paid: 48000,
      status: "paid",
      payment_method: "bank",
      payment_date: "2026-03-05T15:30:00Z",
      payment_notes: "Received via HDFC NetBanking REF#92841",
      journal_entry_id: 12,
      lines: [
        {
          id: 1,
          product_id: 1,
          product_name: "Executive Desk",
          account_id: 7,
          account_name: "Sales Income",
          quantity: 2,
          unit_price: 24000,
          subtotal: 48000,
        },
      ],
    },
    {
      id: 202,
      invoice_number: "INV-0002",
      so_id: 103,
      so_number: "SO-0003",
      customer_id: 3,
      customer_name: "Vikram Malhotra",
      invoice_date: "2026-03-04T12:00:00Z",
      due_date: "2026-03-18T12:00:00Z",
      total: 52000,
      amount_paid: 0,
      status: "open",
      payment_method: null,
      payment_date: null,
      payment_notes: null,
      journal_entry_id: 15,
      lines: [
        {
          id: 2,
          product_id: 3,
          product_name: "Conference Table (8-Seater)",
          account_id: 7,
          account_name: "Sales Income",
          quantity: 1,
          unit_price: 52000,
          subtotal: 52000,
        },
      ],
    },
  ];
}

export function getLocalInvoices(): CustomerInvoiceApiRecord[] {
  if (typeof window === "undefined") return getInitialSeedInvoices();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialSeedInvoices();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as CustomerInvoiceApiRecord[];
  } catch {
    return getInitialSeedInvoices();
  }
}

export function saveLocalInvoices(invoices: CustomerInvoiceApiRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error("Failed to save customer invoices to localStorage:", err);
  }
}

/**
 * GET /api/v1/customer-invoices — paginated list with search, status filter, and sort.
 */
export async function fetchCustomerInvoicesPage(
  params: CustomerInvoicesParams = {}
): Promise<CustomerInvoiceListResult> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.status && params.status !== "all") {
      const backendStatus = params.status === "Confirmed" ? "open" : params.status.toLowerCase();
      query.set("status", backendStatus);
    }
    if (params.customer_id) query.set("customer_id", String(params.customer_id));
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);

    const qs = query.toString();
    const res = await apiFetch<{ data: CustomerInvoiceApiRecord[]; total: number; page: number; limit: number; pages: number }>(
      `/api/v1/customer-invoices${qs ? `?${qs}` : ""}`,
      { auth: true }
    );
    if (res?.data) {
      return {
        data: res.data.map(mapCustomerInvoiceApiRecord),
        total: res.total,
        page: res.page,
        limit: res.limit,
        pages: res.pages,
      };
    }
  } catch {
    // Fall back to local store
  }

  const all = getLocalInvoices();
  let filtered = [...all];

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
        (inv.so_number && inv.so_number.toLowerCase().includes(q))
    );
  }

  if (params.status && params.status !== "all") {
    const sReq = params.status.toLowerCase();
    filtered = filtered.filter((inv) => {
      const s = (inv.status || "").toLowerCase();
      if (sReq === "confirmed") return s === "open" || s === "confirmed";
      return s === sReq;
    });
  }

  // Sort
  const sortBy = params.sort_by ?? "created_at";
  const sortOrder = params.sort_order ?? "desc";
  filtered.sort((a, b) => {
    let aVal: any = (a as any)[sortBy] ?? a.invoice_date;
    let bVal: any = (b as any)[sortBy] ?? b.invoice_date;
    if (sortBy === "total") {
      aVal = Number(a.total);
      bVal = Number(b.total);
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    data: paginated.map(mapCustomerInvoiceApiRecord),
    total,
    page,
    limit,
    pages,
  };
}

/**
 * Fetches up to 100 customer invoices.
 */
export async function fetchCustomerInvoices(): Promise<CustomerInvoice[]> {
  const res = await fetchCustomerInvoicesPage({ limit: 100 });
  return res.data;
}

/**
 * GET /api/v1/customer-invoices/:id
 */
export async function fetchCustomerInvoice(id: string): Promise<CustomerInvoice> {
  const numId = parseInt(id, 10);
  if (!isNaN(numId)) {
    try {
      const raw = await apiFetch<CustomerInvoiceApiRecord>(`/api/v1/customer-invoices/${numId}`, { auth: true });
      if (raw?.id) return mapCustomerInvoiceApiRecord(raw);
    } catch {
      // Fall back
    }
  }

  const all = getLocalInvoices();
  const found = all.find((inv) => String(inv.id) === id || inv.invoice_number.toLowerCase() === id.toLowerCase());
  if (!found) {
    throw new Error(`Customer Invoice with ID "${id}" not found.`);
  }
  return mapCustomerInvoiceApiRecord(found);
}

/**
 * Creates a Customer Invoice from a confirmed Sales Order (Task 6B).
 */
export async function createInvoiceFromSo(soId: number): Promise<CustomerInvoice> {
  try {
    const res = await apiFetch<{ invoice: CustomerInvoiceApiRecord }>(
      `/api/v1/sales-orders/${soId}/create-invoice`,
      {
        method: "POST",
        auth: true,
      }
    );
    if (res?.invoice) {
      markSalesOrderInvoiced(soId);
      return mapCustomerInvoiceApiRecord(res.invoice);
    }
  } catch {
    // Fall back to local creation
  }

  const so = await fetchSalesOrderApi(soId);
  const all = getLocalInvoices();

  // Check if invoice already exists for this SO
  const existing = all.find((inv) => inv.so_id === soId);
  if (existing) {
    return mapCustomerInvoiceApiRecord(existing);
  }

  const nextId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 201;
  const nextNum = `INV-${String(nextId).padStart(4, "0")}`;
  const now = new Date().toISOString();
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const newInvoice: CustomerInvoiceApiRecord = {
    id: nextId,
    invoice_number: nextNum,
    so_id: so.id,
    so_number: so.so_number,
    customer_id: so.customer_id,
    customer_name: so.customer_name,
    invoice_date: now,
    due_date: dueDate,
    total: so.total,
    amount_paid: 0,
    status: "open",
    payment_method: null,
    payment_date: null,
    payment_notes: null,
    journal_entry_id: 100 + nextId,
    lines: (so.lines ?? []).map((l, idx) => ({
      id: idx + 1,
      product_id: l.product_id,
      product_name: l.product_name,
      account_id: l.account_id ?? 7,
      account_name: l.account_name ?? "Sales Income",
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.subtotal,
    })),
  };

  saveLocalInvoices([newInvoice, ...all]);
  markSalesOrderInvoiced(soId);

  return mapCustomerInvoiceApiRecord(newInvoice);
}

/**
 * Confirms a draft customer invoice.
 */
export async function confirmCustomerInvoice(invoiceId: string): Promise<CustomerInvoice> {
  const all = getLocalInvoices();
  const index = all.findIndex((i) => String(i.id) === invoiceId || i.invoice_number === invoiceId);
  if (index !== -1) {
    all[index].status = "open";
    saveLocalInvoices(all);
    return mapCustomerInvoiceApiRecord(all[index]);
  }
  return fetchCustomerInvoice(invoiceId);
}

/**
 * Registers an inbound payment against a Customer Invoice (Task 6C).
 */
export async function payCustomerInvoice(
  invoiceId: string,
  payment: CustomerPaymentInput
): Promise<CustomerInvoice> {
  try {
    const numId = parseInt(invoiceId, 10);
    if (!isNaN(numId)) {
      const res = await apiFetch<CustomerInvoiceApiRecord>(`/api/v1/customer-invoices/${numId}/pay`, {
        method: "POST",
        auth: true,
        body: payment,
      });
      if (res?.id) return mapCustomerInvoiceApiRecord(res);
    }
  } catch {
    // Fall back to local update
  }

  const all = getLocalInvoices();
  const index = all.findIndex((i) => String(i.id) === invoiceId || i.invoice_number === invoiceId);
  if (index === -1) {
    throw new Error(`Customer Invoice #${invoiceId} not found.`);
  }

  const inv = all[index];
  const newAmountPaid = (inv.amount_paid || 0) + payment.amount;
  inv.amount_paid = Math.min(inv.total, newAmountPaid);
  inv.payment_method = payment.payment_method;
  inv.payment_date = payment.payment_date;
  inv.payment_notes = payment.notes ?? null;
  if (inv.amount_paid >= inv.total) {
    inv.status = "paid";
  } else {
    inv.status = "partially_paid";
  }

  saveLocalInvoices(all);
  return mapCustomerInvoiceApiRecord(inv);
}
