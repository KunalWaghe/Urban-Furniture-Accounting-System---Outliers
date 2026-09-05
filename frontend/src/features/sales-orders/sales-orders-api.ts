/**
 * Sales Orders API layer — HTTP calls and client-side resilient store for SO features.
 *
 * Talks to backend master-data endpoints (`/api/v1/contacts`, `/api/v1/products`, `/api/v1/accounts`).
 * Attempts to hit `/api/v1/sales-orders`, falling back gracefully to persistent local storage
 * until backend Sales Order endpoints are deployed by the backend engineer.
 *
 * Used by: sales orders list, SO detail/form pages, customer invoice creation.
 */

import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Account, Contact, ContactListResponse, Product, ProductListResponse, SalesOrder } from "@/lib/types";

/** Single line item as returned by the SO API / store. */
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

/** Full sales order record shape. */
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

/** Paginated list response wrapper. */
export interface SalesOrderListResponse {
  data: SalesOrderApi[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Query params for listing sales orders (search, filter, sort, page). */
export interface SalesOrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/** Payload for one line when creating a Sales Order. */
export interface SalesOrderLineInput {
  product_id: number;
  account_id?: number;
  quantity: number;
  unit_price: number;
}

/** Payload for creating a Sales Order. */
export interface SalesOrderInput {
  customer_id: number;
  order_date?: string;
  lines: SalesOrderLineInput[];
}

const STORAGE_KEY = "urban_furniture_sales_orders_v1";

/** Converts backend status strings to frontend display labels. */
function mapSoStatus(status: string): SalesOrder["status"] {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "Confirmed";
    case "invoiced":
    case "partially billed":
      return "Partially Billed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Draft";
  }
}

/** Maps a raw/stored SO record to the frontend `SalesOrder` interface. */
export function mapSalesOrder(so: SalesOrderApi): SalesOrder {
  return {
    id: String(so.id),
    order_number: so.so_number,
    customer_id: so.customer_id,
    customer_name: so.customer_name ?? "Customer",
    order_date: formatDate(so.order_date),
    status: mapSoStatus(so.status),
    total_amount: so.total,
    items: (so.lines ?? []).map((line) => ({
      id: line.id,
      product_name: line.product_name ?? "Product",
      quantity: line.quantity,
      unit_price: line.unit_price,
      total: line.subtotal,
      account_name: line.account_name ?? undefined,
    })),
  };
}

/** Default seed data if local storage is empty. */
function getInitialSeedSalesOrders(): SalesOrderApi[] {
  return [
    {
      id: 101,
      so_number: "SO-0001",
      customer_id: 1,
      customer_name: "Rahul Sharma",
      status: "confirmed",
      total: 48000,
      order_date: "2026-03-01T10:00:00Z",
      created_at: "2026-03-01T10:00:00Z",
      lines: [
        {
          id: 1,
          product_id: 1,
          product_name: "Executive Desk",
          account_id: 7,
          account_name: "Sales Income",
          analytic_account_id: null,
          quantity: 2,
          unit_price: 24000,
          subtotal: 48000,
        },
      ],
    },
    {
      id: 102,
      so_number: "SO-0002",
      customer_id: 2,
      customer_name: "Priya Patel",
      status: "draft",
      total: 35000,
      order_date: "2026-03-03T14:30:00Z",
      created_at: "2026-03-03T14:30:00Z",
      lines: [
        {
          id: 2,
          product_id: 2,
          product_name: "Ergonomic Mesh Chair",
          account_id: 7,
          account_name: "Sales Income",
          analytic_account_id: null,
          quantity: 5,
          unit_price: 7000,
          subtotal: 35000,
        },
      ],
    },
    {
      id: 103,
      so_number: "SO-0003",
      customer_id: 3,
      customer_name: "Vikram Malhotra",
      status: "invoiced",
      total: 52000,
      order_date: "2026-03-04T09:15:00Z",
      created_at: "2026-03-04T09:15:00Z",
      lines: [
        {
          id: 3,
          product_id: 3,
          product_name: "Conference Table (8-Seater)",
          account_id: 7,
          account_name: "Sales Income",
          analytic_account_id: null,
          quantity: 1,
          unit_price: 52000,
          subtotal: 52000,
        },
      ],
    },
  ];
}

/** Load all stored sales orders from localStorage. */
export function getLocalSalesOrders(): SalesOrderApi[] {
  if (typeof window === "undefined") return getInitialSeedSalesOrders();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialSeedSalesOrders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as SalesOrderApi[];
  } catch {
    return getInitialSeedSalesOrders();
  }
}

/** Save sales orders to localStorage. */
export function saveLocalSalesOrders(orders: SalesOrderApi[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error("Failed to save sales orders to localStorage:", err);
  }
}

/**
 * GET /api/v1/sales-orders — paginated list with search, status filter, and sort.
 */
export async function fetchSalesOrdersPage(
  params: SalesOrderListParams = {}
): Promise<{ orders: SalesOrder[]; total: number; page: number; pages: number }> {
  // First attempt backend call in case BE router is active
  try {
    const search = new URLSearchParams();
    search.set("page", String(params.page ?? 1));
    search.set("limit", String(params.limit ?? 20));
    search.set("sort_by", params.sort_by ?? "created_at");
    search.set("sort_order", params.sort_order ?? "desc");
    if (params.search?.trim()) search.set("search", params.search.trim());
    if (params.status && params.status !== "all") {
      let backendStatus = params.status.toLowerCase();
      if (params.status === "Partially Billed") backendStatus = "invoiced";
      search.set("status", backendStatus);
    }

    const res = await apiFetch<SalesOrderListResponse>(
      `/api/v1/sales-orders?${search.toString()}`,
      { auth: true }
    );
    if (res?.data) {
      return {
        orders: res.data.map(mapSalesOrder),
        total: res.total,
        page: res.page,
        pages: res.pages,
      };
    }
  } catch {
    // Fall back to local store
  }

  const all = getLocalSalesOrders();
  let filtered = [...all];

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.so_number.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q))
    );
  }

  if (params.status && params.status !== "all") {
    const reqStatus = params.status.toLowerCase();
    filtered = filtered.filter((o) => {
      const s = o.status.toLowerCase();
      if (reqStatus === "partially billed" || reqStatus === "invoiced") {
        return s === "invoiced" || s === "partially billed";
      }
      return s === reqStatus;
    });
  }

  // Sorting
  const sortBy = params.sort_by ?? "created_at";
  const sortOrder = params.sort_order ?? "desc";
  filtered.sort((a, b) => {
    let aVal: any = (a as any)[sortBy] ?? a.created_at;
    let bVal: any = (b as any)[sortBy] ?? b.created_at;
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
    orders: paginated.map(mapSalesOrder),
    total,
    page,
    pages,
  };
}

/**
 * GET /api/v1/sales-orders/:id — fetches a single SO by ID.
 */
export async function fetchSalesOrderApi(id: number): Promise<SalesOrderApi> {
  try {
    const res = await apiFetch<SalesOrderApi>(`/api/v1/sales-orders/${id}`, { auth: true });
    if (res?.id) return res;
  } catch {
    // Fall back to local store
  }

  const all = getLocalSalesOrders();
  const found = all.find((o) => o.id === id || String(o.id) === String(id));
  if (found) return found;

  throw new Error(`Sales Order with ID ${id} not found.`);
}

/**
 * GET /api/v1/sales-orders/:id — single SO mapped to frontend type.
 */
export async function fetchSalesOrder(id: number): Promise<SalesOrder> {
  const so = await fetchSalesOrderApi(id);
  return mapSalesOrder(so);
}

/**
 * POST /api/v1/sales-orders — creates a new draft sales order.
 */
export async function createSalesOrder(input: SalesOrderInput): Promise<SalesOrder> {
  // Attempt backend call
  try {
    const res = await apiFetch<SalesOrderApi>("/api/v1/sales-orders", {
      method: "POST",
      auth: true,
      body: input,
    });
    if (res?.id) return mapSalesOrder(res);
  } catch {
    // Fall back to local creation
  }

  // Resolve customer name and products from live APIs
  let customerName = "Customer";
  try {
    const customers = await fetchCustomers();
    const cust = customers.find((c) => c.id === input.customer_id);
    if (cust) customerName = cust.name;
  } catch {
    // Ignore error
  }

  const products = await fetchProducts().catch(() => []);
  const accounts = await fetchIncomeAccounts().catch(() => []);

  const all = getLocalSalesOrders();
  const nextId = all.length > 0 ? Math.max(...all.map((o) => o.id)) + 1 : 101;
  const nextNumber = `SO-${String(nextId).padStart(4, "0")}`;

  let totalAmount = 0;
  const lines: SalesOrderLineApi[] = input.lines.map((l, idx) => {
    const prod = products.find((p) => p.id === l.product_id);
    const acc = accounts.find((a) => a.id === l.account_id);
    const subtotal = round(l.quantity * l.unit_price, 2);
    totalAmount += subtotal;
    return {
      id: idx + 1,
      product_id: l.product_id,
      product_name: prod?.name ?? `Product #${l.product_id}`,
      account_id: l.account_id ?? 7,
      account_name: acc?.name ?? "Sales Income",
      analytic_account_id: null,
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal,
    };
  });

  const now = new Date().toISOString();
  const newOrder: SalesOrderApi = {
    id: nextId,
    so_number: nextNumber,
    customer_id: input.customer_id,
    customer_name: customerName,
    status: "draft",
    total: round(totalAmount, 2),
    order_date: input.order_date || now,
    created_at: now,
    lines,
  };

  saveLocalSalesOrders([newOrder, ...all]);
  return mapSalesOrder(newOrder);
}

/**
 * PATCH /api/v1/sales-orders/:id/confirm — transitions draft SO to confirmed.
 */
export async function confirmSalesOrder(id: number): Promise<SalesOrder> {
  try {
    const res = await apiFetch<SalesOrderApi>(`/api/v1/sales-orders/${id}/confirm`, {
      method: "PATCH",
      auth: true,
    });
    if (res?.id) return mapSalesOrder(res);
  } catch {
    // Fall back to local update
  }

  const all = getLocalSalesOrders();
  const index = all.findIndex((o) => o.id === id || String(o.id) === String(id));
  if (index === -1) {
    throw new Error(`Sales Order #${id} not found.`);
  }

  all[index].status = "confirmed";
  saveLocalSalesOrders(all);
  return mapSalesOrder(all[index]);
}

/**
 * Updates an SO status to 'invoiced' when an invoice is generated.
 */
export function markSalesOrderInvoiced(soId: number): void {
  const all = getLocalSalesOrders();
  const index = all.findIndex((o) => o.id === soId || String(o.id) === String(soId));
  if (index !== -1) {
    all[index].status = "invoiced";
    saveLocalSalesOrders(all);
  }
}

/**
 * GET /api/v1/contacts — active customers for the SO form customer picker.
 */
export async function fetchCustomers(): Promise<Contact[]> {
  const res = await apiFetch<ContactListResponse>("/api/v1/contacts?is_active=true&limit=100", { auth: true });
  return (res.data ?? []).filter((c) => c.type === "customer" || c.type === "both");
}

/**
 * GET /api/v1/products — active products for SO line item dropdowns.
 */
export async function fetchProducts(): Promise<Product[]> {
  const res = await apiFetch<ProductListResponse>("/api/v1/products?is_active=true&limit=100", { auth: true });
  return res.data ?? [];
}

/**
 * GET /api/v1/accounts — income accounts for SO line sales account dropdown.
 */
export async function fetchIncomeAccounts(): Promise<Account[]> {
  const res = await apiFetch<{ data: Account[] }>("/api/v1/accounts?is_active=true&limit=100", { auth: true });
  return (res.data ?? []).filter((a) => a.type === "income");
}

function round(val: number, decimals = 2): number {
  return Number(Math.round(Number(val + "e" + decimals)) + "e-" + decimals);
}
