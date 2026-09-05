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

export async function fetchContacts(): Promise<Contact[]> {
  const response = await apiFetch<ContactListResponse>(
    "/api/v1/contacts?limit=100&sort_by=name&sort_order=asc",
    { auth: true }
  );
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

export async function fetchProducts(): Promise<Product[]> {
  const response = await apiFetch<ProductListResponse>(
    "/api/v1/products?limit=100&sort_by=name&sort_order=asc",
    { auth: true }
  );
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

export async function fetchAccounts(): Promise<Account[]> {
  const response = await apiFetch<{ data: Account[] }>(
    "/api/v1/accounts?is_active=true&limit=100&sort_by=code&sort_order=asc",
    { auth: true }
  );
  return response.data ?? [];
}

