import { apiFetch } from "@/lib/api";
import type {
  Account,
  Contact,
  ContactListResponse,
  Product,
  ProductListResponse,
} from "@/lib/types";

export interface ContactInput {
  name: string;
  type: Contact["type"];
  email?: string;
  mobile?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ProductInput {
  name: string;
  product_type: string;
  category?: string;
  price: number;
  cost?: number | null;
  tax_percent: number;
  description?: string;
}

export interface ContactListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function fetchContactsPage(
  params: ContactListParams = {}
): Promise<ContactListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.type && params.type !== "all") query.set("type", params.type);
  if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const qs = query.toString();
  return apiFetch<ContactListResponse>(
    `/api/v1/contacts${qs ? `?${qs}` : ""}`,
    { auth: true }
  );
}

export async function fetchContacts(): Promise<Contact[]> {
  const response = await fetchContactsPage({ limit: 100, sort_by: "name", sort_order: "asc" });
  return response.data ?? [];
}

export async function createContact(input: ContactInput): Promise<Contact> {
  return apiFetch<Contact>("/api/v1/contacts", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function updateContact(id: number, input: Partial<ContactInput>): Promise<Contact> {
  return apiFetch<Contact>(`/api/v1/contacts/${id}`, {
    method: "PUT",
    auth: true,
    body: input,
  });
}

export async function deleteContact(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/contacts/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  product_type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function fetchProductsPage(
  params: ProductListParams = {}
): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.category && params.category !== "all") query.set("category", params.category);
  if (params.product_type && params.product_type !== "all") query.set("product_type", params.product_type);
  if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const qs = query.toString();
  return apiFetch<ProductListResponse>(
    `/api/v1/products${qs ? `?${qs}` : ""}`,
    { auth: true }
  );
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetchProductsPage({ limit: 100, sort_by: "name", sort_order: "asc" });
  return response.data ?? [];
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return apiFetch<Product>("/api/v1/products", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}`, {
    method: "PUT",
    auth: true,
    body: input,
  });
}

export async function deleteProduct(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/products/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export interface AccountListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function fetchAccountsPage(
  params: AccountListParams = {}
): Promise<AccountListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.type && params.type !== "all") query.set("type", params.type);
  if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const qs = query.toString();
  return apiFetch<AccountListResponse>(
    `/api/v1/accounts${qs ? `?${qs}` : ""}`,
    { auth: true }
  );
}

export async function fetchAccounts(): Promise<Account[]> {
  const response = await fetchAccountsPage({
    is_active: true,
    limit: 100,
    sort_by: "code",
    sort_order: "asc",
  });
  return response.data ?? [];
}

