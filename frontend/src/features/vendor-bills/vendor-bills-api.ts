import { formatDate } from "@/lib/format";
import { fetchPurchaseOrderApi } from "@/features/purchase-orders/purchase-orders-api";

export type VendorBillStatus = "Draft" | "Confirmed" | "Paid" | "Cancelled";

export interface VendorBillLine {
  id: number;
  product_id: number;
  product_name: string;
  account_id?: number | null;
  account_name?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface VendorBill {
  id: string;
  bill_number: string;
  po_id?: number | null;
  po_number?: string | null;
  vendor_id: number;
  vendor_name: string;
  bill_date: string;
  due_date: string;
  status: VendorBillStatus;
  total_amount: number;
  amount_due: number;
  payment_method?: "bank" | "cash" | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  created_at: string;
  lines: VendorBillLine[];
}

export interface PaymentInput {
  payment_method: "bank" | "cash";
  payment_date: string;
  amount: number;
  notes?: string;
}

const STORAGE_KEY = "urban_furniture_vendor_bills_v1";

const INITIAL_DEMO_BILLS: VendorBill[] = [
  {
    id: "bill-1001",
    bill_number: "BILL-2026-001",
    po_id: 1,
    po_number: "PO-0001",
    vendor_id: 1,
    vendor_name: "Azure Furniture Ltd",
    bill_date: "2026-09-01",
    due_date: "2026-09-15",
    status: "Confirmed",
    total_amount: 45000,
    amount_due: 45000,
    created_at: new Date().toISOString(),
    lines: [
      {
        id: 1,
        product_id: 101,
        product_name: "Executive Ergonomic Chair",
        account_id: 5010,
        account_name: "5010 - Purchase Expense",
        quantity: 5,
        unit_price: 9000,
        subtotal: 45000,
      },
    ],
  },
  {
    id: "bill-1002",
    bill_number: "BILL-2026-002",
    po_id: 2,
    po_number: "PO-0002",
    vendor_id: 2,
    vendor_name: "Nimesh Pathak Timber Works",
    bill_date: "2026-09-03",
    due_date: "2026-09-18",
    status: "Paid",
    total_amount: 120000,
    amount_due: 0,
    payment_method: "bank",
    payment_date: "2026-09-04",
    payment_notes: "Paid via HDFC Bank NEFT #987123",
    created_at: new Date().toISOString(),
    lines: [
      {
        id: 2,
        product_id: 102,
        product_name: "Teak Wood Conference Table",
        account_id: 5010,
        account_name: "5010 - Purchase Expense",
        quantity: 2,
        unit_price: 60000,
        subtotal: 120000,
      },
    ],
  },
];

function getStoredBills(): VendorBill[] {
  if (typeof window === "undefined") return INITIAL_DEMO_BILLS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_BILLS));
      return INITIAL_DEMO_BILLS;
    }
    return JSON.parse(raw) as VendorBill[];
  } catch {
    return INITIAL_DEMO_BILLS;
  }
}

function saveStoredBills(bills: VendorBill[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  } catch (err) {
    console.error("Failed to persist vendor bills to localStorage", err);
  }
}

export async function fetchVendorBills(): Promise<VendorBill[]> {
  await new Promise((res) => setTimeout(res, 150));
  return getStoredBills();
}

export async function fetchVendorBill(id: string): Promise<VendorBill> {
  await new Promise((res) => setTimeout(res, 100));
  const bills = getStoredBills();
  const found = bills.find((b) => b.id === id || b.bill_number.toLowerCase() === id.toLowerCase());
  if (!found) {
    throw new Error(`Vendor Bill with ID "${id}" not found.`);
  }
  return found;
}

export async function createBillFromPo(poId: number): Promise<VendorBill> {
  // Fetch actual PO details from live API
  const po = await fetchPurchaseOrderApi(poId);
  const bills = getStoredBills();

  // Check if a bill already exists for this PO
  const existing = bills.find((b) => b.po_id === poId);
  if (existing) {
    return existing;
  }

  const billCount = bills.length + 1;
  const billNumber = `BILL-2026-${String(billCount).padStart(3, "0")}`;
  const now = new Date();
  const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const newBill: VendorBill = {
    id: `bill-${Date.now()}`,
    bill_number: billNumber,
    po_id: po.id,
    po_number: po.po_number,
    vendor_id: po.vendor_id,
    vendor_name: po.vendor_name ?? "Vendor",
    bill_date: now.toISOString().split("T")[0],
    due_date: dueDate.toISOString().split("T")[0],
    status: "Draft",
    total_amount: po.total,
    amount_due: po.total,
    created_at: now.toISOString(),
    lines: po.lines.map((l) => ({
      id: l.id,
      product_id: l.product_id,
      product_name: l.product_name ?? "Product",
      account_id: l.account_id ?? 5010,
      account_name: l.account_name ?? "5010 - Purchase Expense",
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.subtotal,
    })),
  };

  const updated = [newBill, ...bills];
  saveStoredBills(updated);
  return newBill;
}

export async function confirmVendorBill(billId: string): Promise<VendorBill> {
  await new Promise((res) => setTimeout(res, 200));
  const bills = getStoredBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) throw new Error("Bill not found");

  if (bill.status !== "Draft") {
    throw new Error(`Cannot confirm bill in status "${bill.status}".`);
  }

  bill.status = "Confirmed";
  saveStoredBills([...bills]);
  return { ...bill };
}

export async function payVendorBill(billId: string, payment: PaymentInput): Promise<VendorBill> {
  await new Promise((res) => setTimeout(res, 250));
  const bills = getStoredBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) throw new Error("Bill not found");

  if (bill.status !== "Confirmed") {
    throw new Error("Only confirmed vendor bills can be settled.");
  }

  bill.status = "Paid";
  bill.amount_due = Math.max(0, bill.amount_due - payment.amount);
  bill.payment_method = payment.payment_method;
  bill.payment_date = payment.payment_date;
  bill.payment_notes = payment.notes ?? `Settled via ${payment.payment_method.toUpperCase()}`;

  saveStoredBills([...bills]);
  return { ...bill };
}
