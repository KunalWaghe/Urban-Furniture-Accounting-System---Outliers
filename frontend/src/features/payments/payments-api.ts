/**
 * Payment and Vendor Bill settlement API client (Phase 2, P0-BE-07).
 */

import { apiFetch } from "@/lib/api";

export interface BillPayInput {
  amount: number;
  payment_method: "bank" | "cash";
  date?: string;
  note?: string;
}

export interface PaymentRecord {
  id: number;
  payment_number: string;
  payment_type: "outbound" | "inbound";
  contact_id: number;
  contact_name?: string | null;
  bill_id?: number | null;
  bill_number?: string | null;
  invoice_id?: number | null;
  journal_id: number;
  journal_code?: string | null;
  journal_name?: string | null;
  amount: number;
  payment_method: "bank" | "cash";
  date: string;
  note?: string | null;
  journal_entry_id?: number | null;
  journal_entry_number?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentListResponse {
  data: PaymentRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface VendorBillApi {
  id: number;
  bill_number: string;
  po_id: number;
  po_number?: string | null;
  vendor_id: number;
  vendor_name?: string | null;
  bill_date: string;
  total: number;
  amount_paid: number;
  status: "open" | "partially_paid" | "paid" | "cancelled";
  journal_entry_id?: number | null;
}

// Records an outbound settlement payment directly against a vendor bill
export async function payVendorBill(
  billId: number | string,
  input: BillPayInput
): Promise<PaymentRecord> {
  return apiFetch<PaymentRecord>(`/api/v1/vendor-bills/${billId}/pay`, {
    method: "POST",
    auth: true,
    body: input,
  });
}

// Fetches all payment transactions logged against a specific vendor bill
export async function fetchBillPayments(
  billId: number | string
): Promise<PaymentRecord[]> {
  return apiFetch<PaymentRecord[]>(`/api/v1/vendor-bills/${billId}/payments`, {
    auth: true,
  });
}

// Retrieves paginated list of financial payments across the system
export async function fetchPayments(params?: {
  payment_type?: string;
  bill_id?: number;
  search?: string;
}): Promise<PaymentListResponse> {
  const query = new URLSearchParams();
  if (params?.payment_type) query.set("payment_type", params.payment_type);
  if (params?.bill_id) query.set("bill_id", String(params.bill_id));
  if (params?.search) query.set("search", params.search);

  return apiFetch<PaymentListResponse>(`/api/v1/payments?${query.toString()}`, {
    auth: true,
  });
}



// Retrieves detailed vendor bill record by its ID
export async function fetchVendorBill(
  billId: number | string
): Promise<VendorBillApi> {
  return apiFetch<VendorBillApi>(`/api/v1/vendor-bills/${billId}`, {
    auth: true,
  });
}
