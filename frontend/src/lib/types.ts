/**
 * Shared TypeScript types for API requests and responses.
 *
 * Role in the app:
 * - Mirrors backend data shapes so the frontend stays type-safe
 * - Imported by API modules, React Query hooks, and UI components
 *
 * These are plain interfaces (no runtime code). When the backend schema
 * changes, update the matching interface here.
 */

export type UserRole = "admin" | "invoicing_user" | "contact";

/** Logged-in user profile returned by `/auth/me` and stored in AuthContext. */
export interface AuthUser {
  id: number;
  login_id?: string | null;
  email: string;
  name: string;
  role: UserRole;
  contact_id?: number | null;
  is_active?: boolean;
}

/** Login/register response — user fields plus a JWT token. */
export interface AuthResponse extends AuthUser {
  token: string;
}

/** Payload for admin-only "create user" API calls. */
export interface AdminCreateUserRequest {
  login_id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  contact_id?: number | null;
}

/** Payload for admin-only "update user" API calls. All fields optional. */
export interface AdminUpdateUserRequest {
  login_id?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  contact_id?: number | null;
  is_active?: boolean;
}

/** Payload sent to the login endpoint. */
export interface LoginRequest {
  login_id: string;
  password: string;
}

/** Payload sent to the self-registration endpoint. */
export interface RegisterRequest {
  login_id: string;
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  contact_id?: number | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/** Standard error shape returned by the backend on failed requests. */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    request_id?: string;
  };
}

/** A customer, vendor, or both — used in master data and order screens. */
export interface Contact {
  id: number;
  name: string;
  type: "customer" | "vendor" | "both";
  email?: string | null;
  mobile?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  is_active: boolean;
}

/** Paginated list wrapper for contacts API responses. */
export interface ContactListResponse {
  data: Contact[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

/** A sellable item with pricing and tax info. */
export interface Product {
  id: number;
  name: string;
  product_type: string;
  category?: string | null;
  price: number;
  cost?: number | null;
  tax_percent: number;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
}

/** Paginated list wrapper for products API responses. */
export interface ProductListResponse {
  data: Product[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

/** A ledger account in the chart of accounts (asset, liability, income, etc.). */
export interface Account {
  id: number;
  code: string;
  name: string;
  type: "asset" | "liability" | "capital" | "income" | "expense" | "other_expense";
  description?: string | null;
  is_active: boolean;
}

/** Paginated list wrapper for chart-of-accounts API responses. */
export interface AccountListResponse {
  data: Account[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

/** An accounting journal (sale, purchase, bank, or cash). */
export interface Journal {
  id: number;
  code: string;
  name: string;
  type: "sale" | "purchase" | "bank" | "cash";
  default_account_id?: number | null;
  default_account_name?: string | null;
  is_active: boolean;
}

/** Paginated list wrapper for journals API responses. */
export interface JournalListResponse {
  data: Journal[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

/** A single balanced double-entry journal record. */
export interface JournalEntryItem {
  account_id: number;
  account_name?: string | null;
  account_code?: string | null;
  partner_id?: number | null;
  debit: number;
  credit: number;
  description?: string | null;
  analytic_account_id?: number | null;
}

/** General-ledger journal entry returned by the API. */
export interface JournalEntry {
  id: number;
  entry_number: string;
  journal_code?: string | null;
  journal_name?: string | null;
  date: string;
  reference?: string | null;
  total_amount?: number | null;
  is_posted: boolean;
  items: JournalEntryItem[];
}

/** Paginated journal-entry list response. */
export interface JournalEntryListResponse {
  data: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** A single line item on a sales order. */
export interface SalesOrderItem {
  id?: number;
  product_name: string;
  category?: string;
  quantity: number;
  unit_price: number;
  tax_percent?: number;
  total: number;
  account_name?: string;
}

/** A customer sales order with header info and line items. */
export interface SalesOrder {
  id: string;
  order_number: string;
  contact_id?: number;
  customer_id?: number;
  customer_name: string;
  customer_location?: string;
  customer_email?: string;
  customer_phone?: string;
  order_date: string;
  created_at?: string;
  status: "Confirmed" | "Draft" | "Partially Billed" | "Cancelled" | "Unknown";
  total_amount: number;
  items: SalesOrderItem[];
}

/** A single line item on a purchase order. */
export interface PurchaseOrderItem {
  id?: number;
  product_name: string;
  category?: string;
  quantity: number;
  unit_cost: number;
  total: number;
  account_name?: string;
}

/** A vendor purchase order with header info and line items. */
export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id?: number;
  vendor_name: string;
  vendor_location?: string;
  vendor_email?: string;
  po_date: string;
  status: "Confirmed" | "Partially Billed" | "Billed" | "Draft" | "Cancelled";
  total_amount: number;
  items: PurchaseOrderItem[];
}


/** A vendor bill summary as displayed on the main dashboard. */
export interface DashboardVendorBill {
  id: string;
  bill_number: string;
  vendor_name: string;
  due_date: string;
  amount: number;
  amount_paid?: number;
  payment_status: "Paid" | "Partially Paid" | "Scheduled" | "Unpaid";
}

/** Budget vs actual metrics for a single cost center. */
export interface BudgetMetric {
  cost_center_code: string;
  cost_center_name: string;
  achieved_count: number;
  achieved_target_percent: number;
  budget_count: number;
  budget_cap: number;
  committed_count: number;
  committed_amount: number;
  committed_percent: number;
  actual_incurred_percent: number;
  pending_committed_percent: number;
  available_capacity_percent: number;
}
