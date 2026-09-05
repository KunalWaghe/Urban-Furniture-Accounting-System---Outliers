/**
 * Master Data API
 *
 * Thin wrapper around backend REST endpoints for contacts, products, and
 * chart-of-accounts (ledger accounts). Each function builds a request URL,
 * calls `apiFetch`, and returns typed data.
 *
 * Used by:
 * - Master-data pages (contacts, products, chart of accounts)
 * - Other features that need dropdown lists (e.g. fetchContacts, fetchProducts)
 *
 * This file does NOT use React Query — pages/hooks call these functions inside
 * their own `queryFn` or `mutationFn`.
 */

import { apiFetch } from "@/lib/api";
import type {
  Account,
  AccountListResponse,
  Contact,
  ContactListResponse,
  Product,
  ProductListResponse,
} from "@/lib/types";

/** Shape of the form body when creating or updating a contact. */
export interface ContactInput {
  name: string;
  type: Contact["type"];
  email?: string;
  mobile?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/** Shape of the form body when creating or updating a product. */
export interface ProductInput {
  name: string;
  product_type: string;
  category?: string | null;
  price: number;
  cost?: number | null;
  tax_percent: number;
  description?: string;
  image_url?: string | null;
  is_active?: boolean;
}

/** Optional filters and pagination for the contacts list endpoint. */
export interface ContactListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/**
 * Fetch a paginated, filterable page of contacts from the backend.
 *
 * @param params - Search, type filter, sort, and pagination options
 * @returns Paginated response with `data`, `total`, and `pages`
 *
 * @example
 * fetchContactsPage({ page: 1, limit: 10, search: "Acme" })
 */
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

/**
 * Fetch all contacts (up to 100) sorted by name.
 * Convenience helper for dropdowns and simple lists — not paginated.
 */
export async function fetchContacts(): Promise<Contact[]> {
  const response = await fetchContactsPage({ limit: 100, sort_by: "name", sort_order: "asc" });
  return response.data ?? [];
}

/**
 * Create a new contact.
 *
 * @param input - Contact fields from the create/edit form
 * @returns The newly created contact record from the server
 */
export async function createContact(input: ContactInput): Promise<Contact> {
  return apiFetch<Contact>("/api/v1/contacts", {
    method: "POST",
    auth: true,
    body: input,
  });
}

/**
 * Update an existing contact by ID.
 *
 * @param id - Database ID of the contact to update
 * @param input - Only the fields that changed (partial update)
 */
export async function updateContact(id: number, input: Partial<ContactInput>): Promise<Contact> {
  return apiFetch<Contact>(`/api/v1/contacts/${id}`, {
    method: "PUT",
    auth: true,
    body: input,
  });
}

/**
 * Soft-delete (deactivate) a contact by ID.
 * The backend marks the record inactive rather than removing it.
 */
export async function deleteContact(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/contacts/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Optional filters and pagination for the products list endpoint. */
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

/**
 * Fetch a paginated, filterable page of products from the backend.
 *
 * @param params - Search, category/type filters, sort, and pagination
 * @returns Paginated response with `data`, `total`, and `pages`
 */
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

/**
 * Fetch all products (up to 100) sorted by name.
 * Convenience helper for dropdowns — not paginated.
 */
export async function fetchProducts(): Promise<Product[]> {
  const response = await fetchProductsPage({ limit: 100, sort_by: "name", sort_order: "asc" });
  return response.data ?? [];
}

/**
 * Create a new product.
 *
 * @param input - Product fields from the create/edit form
 */
export async function createProduct(input: ProductInput): Promise<Product> {
  return apiFetch<Product>("/api/v1/products", {
    method: "POST",
    auth: true,
    body: input,
  });
}

/**
 * Update an existing product by ID.
 *
 * @param id - Database ID of the product to update
 * @param input - Only the fields that changed (partial update)
 */
export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}`, {
    method: "PUT",
    auth: true,
    body: input,
  });
}

/**
 * Soft-delete (deactivate) a product by ID.
 */
export async function deleteProduct(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/products/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Restore a deactivated product by setting is_active=true. */
export async function reactivateProduct(id: number): Promise<Product> {
  return updateProduct(id, { is_active: true });
}

/** Shape of the form body when creating or updating a ledger account. */
export interface AccountInput {
  code: string;
  name: string;
  type: Account["type"];
  description?: string;
  is_active?: boolean;
}

/** Optional filters and pagination for the accounts (chart of accounts) list endpoint. */
export interface AccountListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/**
 * Fetch a paginated, filterable page of ledger accounts.
 *
 * @param params - Search, account type filter, sort, and pagination
 */
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

/**
 * Fetch active accounts (up to 100) sorted by account code.
 * Used by dropdowns and the Chart of Accounts page.
 */
export async function fetchAccounts(params: { is_active?: boolean } = {}): Promise<Account[]> {
  const response = await fetchAccountsPage({
    limit: 100,
    sort_by: "code",
    sort_order: "asc",
    ...(params.is_active !== undefined ? { is_active: params.is_active } : {}),
  });
  return response.data ?? [];
}

/** Create a new ledger account. */
export async function createAccount(input: AccountInput): Promise<Account> {
  return apiFetch<Account>("/api/v1/accounts", {
    method: "POST",
    auth: true,
    body: input,
  });
}

/** Update an existing ledger account by ID. */
export async function updateAccount(id: number, input: Partial<AccountInput>): Promise<Account> {
  return apiFetch<Account>(`/api/v1/accounts/${id}`, {
    method: "PUT",
    auth: true,
    body: input,
  });
}

/** Soft-delete (deactivate) a ledger account by ID. */
export async function deleteAccount(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/accounts/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Restore a deactivated ledger account. */
export async function reactivateAccount(id: number): Promise<Account> {
  return updateAccount(id, { is_active: true });
}
