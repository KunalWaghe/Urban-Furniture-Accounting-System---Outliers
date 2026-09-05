import { apiFetch } from "@/lib/api";

export interface PortalInvoice {
  id: number;
  invoice_number: string;
  customer_name?: string | null;
  invoice_date: string;
  due_date?: string | null;
  total: number;
  amount_paid: number;
  amount_due: number;
  status: string;
}

interface PortalResponse { data?: Array<Record<string, unknown>>; }

function normalize(raw: Record<string, unknown>): PortalInvoice {
  const total = Number(raw.total ?? raw.total_amount ?? 0);
  const amountPaid = Number(raw.amount_paid ?? 0);
  return { id: Number(raw.id), invoice_number: String(raw.invoice_number ?? raw.number ?? `Invoice #${raw.id}`), customer_name: raw.customer_name == null ? null : String(raw.customer_name), invoice_date: String(raw.invoice_date ?? ""), due_date: raw.due_date == null ? null : String(raw.due_date), total, amount_paid: amountPaid, amount_due: Number(raw.amount_due ?? Math.max(0, total - amountPaid)), status: String(raw.status ?? "open") };
}

export async function fetchPortalInvoices(): Promise<PortalInvoice[]> {
  const response = await apiFetch<PortalResponse | Array<Record<string, unknown>>>("/api/v1/self-service/my-invoices", { auth: true });
  return (Array.isArray(response) ? response : response.data ?? []).map(normalize);
}

export async function payPortalInvoice(invoiceId: number, input: { amount: number; payment_method: "bank" | "cash"; date: string; note?: string }) {
  return apiFetch(`/api/v1/self-service/my-invoices/${invoiceId}/pay`, {
    method: "POST",
    auth: true,
    body: { amount: input.amount, payment_method: input.payment_method, date: input.date, note: input.note },
  });
}
