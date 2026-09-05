export interface AuthUser {
  id: number;
  login_id?: string | null;
  email: string;
  name: string;
  role: string;
  contact_id?: number | null;
}

export interface AuthResponse extends AuthUser {
  token: string;
}

export interface AdminCreateUserRequest {
  login_id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  contact_id?: number | null;
}

export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface RegisterRequest {
  login_id: string;
  email: string;
  password: string;
  name: string;
  role?: string;
  contact_id?: number | null;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    request_id?: string;
  };
}

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

export interface ContactListResponse {
  data: Contact[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface Product {
  id: number;
  name: string;
  product_type: string;
  category?: string | null;
  price: number;
  cost?: number | null;
  tax_percent: number;
  description?: string | null;
  is_active: boolean;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  type: "asset" | "liability" | "capital" | "income" | "expense" | "other_expense";
  description?: string | null;
  is_active: boolean;
}

export interface AccountListResponse {
  data: Account[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface Journal {
  id: number;
  code: string;
  name: string;
  type: "sale" | "purchase" | "bank" | "cash";
  default_account_id?: number | null;
  default_account_name?: string | null;
  is_active: boolean;
}

export interface JournalListResponse {
  data: Journal[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface SalesOrderItem {
  id?: number;
  product_name: string;
  category?: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  contact_id?: number;
  customer_name: string;
  customer_location: string;
  customer_email?: string;
  customer_phone?: string;
  order_date: string;
  status: "Confirmed" | "Draft";
  total_amount: number;
  items: SalesOrderItem[];
}

export interface PurchaseOrderItem {
  id?: number;
  product_name: string;
  category?: string;
  quantity: number;
  unit_cost: number;
  total: number;
  account_name?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id?: number;
  vendor_name: string;
  vendor_location?: string;
  vendor_email?: string;
  po_date: string;
  status: "Confirmed" | "Partially Billed" | "Draft" | "Cancelled";
  total_amount: number;
  items: PurchaseOrderItem[];
}

export interface VendorBill {
  id: string;
  bill_number: string;
  vendor_name: string;
  due_date: string;
  amount: number;
  payment_status: "Unpaid" | "Scheduled" | "Paid";
}

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

