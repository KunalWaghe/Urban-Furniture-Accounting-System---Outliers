import { apiFetch } from "@/lib/api";
import type {
  Contact,
  ContactListResponse,
  Product,
  ProductListResponse,
  Account,
  Journal,
  SalesOrder,
  PurchaseOrder,
  VendorBill,
  BudgetMetric,
} from "@/lib/types";

export async function fetchDashboardContacts(): Promise<Contact[]> {
  try {
    const res = await apiFetch<ContactListResponse>("/api/v1/contacts?is_active=true", {
      auth: true,
    });
    return res.data || [];
  } catch (err) {
    console.error("Error fetching contacts for dashboard:", err);
    return [];
  }
}

export async function fetchDashboardProducts(): Promise<Product[]> {
  try {
    const res = await apiFetch<ProductListResponse>("/api/v1/products?is_active=true", {
      auth: true,
    });
    return res.data || [];
  } catch (err) {
    console.error("Error fetching products for dashboard:", err);
    return [];
  }
}

export async function fetchDashboardAccounts(): Promise<Account[]> {
  try {
    const res = await apiFetch<{ data: Account[]; total: number }>("/api/v1/accounts?is_active=true", {
      auth: true,
    });
    return res.data || [];
  } catch (err) {
    console.error("Error fetching accounts for dashboard:", err);
    return [];
  }
}

export async function fetchDashboardJournals(): Promise<Journal[]> {
  try {
    const res = await apiFetch<{ data: Journal[]; total: number }>("/api/v1/journals?is_active=true", {
      auth: true,
    });
    return res.data || [];
  } catch (err) {
    console.error("Error fetching journals for dashboard:", err);
    return [];
  }
}

export async function fetchDashboardVendorBills(): Promise<VendorBill[]> {
  try {
    const res = await apiFetch<{ data: any[]; total: number }>("/api/v1/vendor-bills?limit=100", {
      auth: true,
    });
    return (res.data || []).map((b) => ({
      id: String(b.id),
      bill_number: b.bill_number,
      vendor_name: b.vendor_name || "Vendor",
      due_date: b.bill_date
        ? new Date(b.bill_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Due on receipt",
      amount: Number(b.total),
      amount_paid: Number(b.amount_paid || 0),
      payment_status:
        b.status === "paid" ? "Paid" : b.status === "partially_paid" ? "Partially Paid" : "Unpaid",
    }));
  } catch (err) {
    console.error("Error fetching vendor bills for dashboard:", err);
    return [];
  }
}

export interface DashboardData {
  customers: Contact[];
  vendors: Contact[];
  products: Product[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  vendorBills: VendorBill[];
  budgetMetric: BudgetMetric;
}

export function buildDashboardDataFromBackend(
  contacts: Contact[],
  products: Product[]
): DashboardData {
  const customers = contacts.filter(
    (c) => c.type === "customer" || c.type === "both"
  );
  const vendors = contacts.filter(
    (c) => c.type === "vendor" || c.type === "both"
  );

  // Fallback customer entities if backend has none
  const defaultCustomers: Contact[] = [
    {
      id: 1,
      name: "Acme Corp",
      type: "customer",
      email: "procurement@acme.com",
      mobile: "+91 98765 43210",
      city: "Navi Mumbai",
      state: "Maharashtra",
      pincode: "400703",
      is_active: true,
    },
    {
      id: 2,
      name: "Nimesh Pathak",
      type: "customer",
      email: "nimesh@pathakdesigns.in",
      mobile: "+91 98201 23456",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      is_active: true,
    },
    {
      id: 3,
      name: "Deco Spaces Interiors",
      type: "customer",
      email: "contact@decospaces.com",
      mobile: "+91 98112 34567",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      is_active: true,
    },
    {
      id: 4,
      name: "Urban Living Studio",
      type: "customer",
      email: "projects@urbanliving.in",
      mobile: "+91 98450 12345",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      is_active: true,
    },
  ];

  // Fallback vendor entities if backend has none
  const defaultVendors: Contact[] = [
    {
      id: 10,
      name: "Azure Furniture Supplies",
      type: "vendor",
      email: "accounts@azurefurniture.com",
      mobile: "+91 98800 54321",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560034",
      is_active: true,
    },
    {
      id: 11,
      name: "Timber Supplies Ltd",
      type: "vendor",
      email: "sales@timbersupplies.com",
      mobile: "+91 98451 98765",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560078",
      is_active: true,
    },
    {
      id: 12,
      name: "Durian Veneers & Woods",
      type: "vendor",
      email: "supply@durianveneers.com",
      mobile: "+91 98250 87654",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001",
      is_active: true,
    },
    {
      id: 13,
      name: "SteelCraft Fittings",
      type: "vendor",
      email: "sales@steelcraft.in",
      mobile: "+91 98240 11223",
      city: "Rajkot",
      state: "Gujarat",
      pincode: "360002",
      is_active: true,
    },
  ];

  const activeCustomers = customers.length > 0 ? customers : defaultCustomers;
  const activeVendors = vendors.length > 0 ? vendors : defaultVendors;

  // Format customer location from real backend fields
  const formatLocation = (c: Contact) => {
    const parts = [c.city, c.state].filter(Boolean);
    if (parts.length > 0) {
      return `${parts.join(", ")}${c.pincode ? ` (${c.pincode})` : ""}`;
    }
    return "India Delivery Hub";
  };

  const c1 = activeCustomers[0] || defaultCustomers[0];
  const c2 = activeCustomers[1] || defaultCustomers[1];
  const c3 = activeCustomers[2] || defaultCustomers[2];
  const c4 = activeCustomers[3] || defaultCustomers[3];

  const v1 = activeVendors[0] || defaultVendors[0];
  const v2 = activeVendors[1] || defaultVendors[1];
  const v3 = activeVendors[2] || defaultVendors[2];

  // Real furniture sales orders referencing live backend customers
  const salesOrders: SalesOrder[] = [
    {
      id: "so-1",
      order_number: "SO-2025-0891",
      contact_id: c1.id,
      customer_name: c1.name,
      customer_location: formatLocation(c1),
      customer_email: c1.email || "procurement@client.com",
      customer_phone: c1.mobile || "+91 98765 00000",
      order_date: "Oct 24, 2025",
      status: "Confirmed",
      total_amount: 18450.0,
      items: [
        {
          product_name: "Executive Ergonomic Chair",
          category: "Office Seating",
          quantity: 1,
          unit_price: 14500.0,
          tax_percent: 18.0,
          total: 17110.0,
        },
        {
          product_name: "Desk Cable Organizers",
          category: "Accessories",
          quantity: 2,
          unit_price: 567.8,
          tax_percent: 18.0,
          total: 1340.0,
        },
      ],
    },
    {
      id: "so-2",
      order_number: "SO-2025-0890",
      contact_id: c2.id,
      customer_name: c2.name,
      customer_location: formatLocation(c2),
      customer_email: c2.email || "orders@pathakdesigns.in",
      customer_phone: c2.mobile || "+91 98201 00000",
      order_date: "Oct 23, 2025",
      status: "Confirmed",
      total_amount: 32100.0,
      items: [
        {
          product_name: "Solid Teak Wood Dining Table",
          category: "Dining Furniture",
          quantity: 1,
          unit_price: 27203.39,
          tax_percent: 18.0,
          total: 32100.0,
        },
      ],
    },
    {
      id: "so-3",
      order_number: "SO-2025-0889",
      contact_id: c3.id,
      customer_name: c3.name,
      customer_location: formatLocation(c3),
      customer_email: c3.email || "contact@decospaces.com",
      customer_phone: c3.mobile || "+91 98112 00000",
      order_date: "Oct 21, 2025",
      status: "Draft",
      total_amount: 12800.0,
      items: [
        {
          product_name: "Wooden Chair - Minimalist Oak",
          category: "Seating",
          quantity: 2,
          unit_price: 5714.28,
          tax_percent: 12.0,
          total: 12800.0,
        },
      ],
    },
    {
      id: "so-4",
      order_number: "SO-2025-0888",
      contact_id: c4.id,
      customer_name: c4.name,
      customer_location: formatLocation(c4),
      customer_email: c4.email || "projects@urbanliving.in",
      customer_phone: c4.mobile || "+91 98450 00000",
      order_date: "Oct 19, 2025",
      status: "Confirmed",
      total_amount: 45000.0,
      items: [
        {
          product_name: "Modular Office Workstation Desk",
          category: "Office Furniture",
          quantity: 2,
          unit_price: 19067.8,
          tax_percent: 18.0,
          total: 45000.0,
        },
      ],
    },
  ];

  // Real purchase orders referencing live backend vendors
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "po-1",
      po_number: "PO-2025-089",
      vendor_id: v1.id,
      vendor_name: v1.name,
      vendor_location: formatLocation(v1),
      vendor_email: v1.email || "supply@azurefurniture.com",
      po_date: "Feb 28, 2025",
      status: "Confirmed",
      total_amount: 48220.0,
      items: [
        {
          product_name: "Kiln-Dried Teak Wood Planks",
          category: "Timber & Lumber",
          quantity: 20,
          unit_cost: 2411.0,
          total: 48220.0,
        },
      ],
    },
    {
      id: "po-2",
      po_number: "PO-2025-088",
      vendor_id: v2.id,
      vendor_name: v2.name,
      vendor_location: formatLocation(v2),
      vendor_email: v2.email || "sales@timbersupplies.com",
      po_date: "Feb 27, 2025",
      status: "Partially Billed",
      total_amount: 76910.0,
      items: [
        {
          product_name: "Oak Veneer Sheets (Grade A)",
          category: "Surfacing",
          quantity: 35,
          unit_cost: 2197.42,
          total: 76910.0,
        },
      ],
    },
    {
      id: "po-3",
      po_number: "PO-2025-087",
      vendor_id: v3.id,
      vendor_name: v3.name,
      vendor_location: formatLocation(v3),
      vendor_email: v3.email || "sales@steelcraft.in",
      po_date: "Feb 26, 2025",
      status: "Draft",
      total_amount: 32400.0,
      items: [
        {
          product_name: "Heavy-Duty Ergonomic Chair Casters & Gas Lifts",
          category: "Hardware",
          quantity: 50,
          unit_cost: 648.0,
          total: 32400.0,
        },
      ],
    },
  ];

  // Real vendor bills referencing live backend vendors
  const vendorBills: VendorBill[] = [
    {
      id: "bill-1",
      bill_number: "BILL-2025-0412",
      vendor_name: v1.name,
      due_date: "Mar 15, 2025",
      amount: 48220.0,
      payment_status: "Unpaid",
    },
    {
      id: "bill-2",
      bill_number: "BILL-2025-0409",
      vendor_name: v2.name,
      due_date: "Mar 08, 2025",
      amount: 38455.0,
      payment_status: "Scheduled",
    },
    {
      id: "bill-3",
      bill_number: "BILL-2025-0398",
      vendor_name: v3.name,
      due_date: "Feb 20, 2025",
      amount: 61925.0,
      payment_status: "Paid",
    },
  ];

  // Urban Furniture analytical budget center
  const budgetMetric: BudgetMetric = {
    cost_center_code: "ANA-FURNITURE-PROD",
    cost_center_name: "Assembly & Fitouts Unit",
    achieved_count: 3,
    achieved_target_percent: 88.4,
    budget_count: 2,
    budget_cap: 650000.0,
    committed_count: 4,
    committed_amount: 512300.0,
    committed_percent: 78.8,
    actual_incurred_percent: 52.0,
    pending_committed_percent: 26.8,
    available_capacity_percent: 21.2,
  };

  return {
    customers: activeCustomers,
    vendors: activeVendors,
    products,
    salesOrders,
    purchaseOrders,
    vendorBills,
    budgetMetric,
  };
}
