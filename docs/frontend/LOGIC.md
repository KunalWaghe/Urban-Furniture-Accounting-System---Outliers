# Frontend Logic & Behavioral Specification — Sourabh

This document defines the behavioral logic, state handling, golden paths, validation rules, screen inventory, and API mappings for the Urban Furniture Accounting System frontend.

---

## Golden Path (P0 Demo Walkthrough)

| Step | Route/Surface | User Action | API Call | Success State | Failure Recovery |
|---:|---|---|---|---|---|
| **1** | `/login` | Enter credentials (`admin001` / `Password@123`) | `POST /api/v1/auth/login` with `login_id` | Token stored in `localStorage` & AuthContext; redirect to `/dashboard` | Display `Invalid Login Id or Password`; keep credentials input |
| **2** | `/dashboard` | View accounting health KPIs (Cash, Bank, AP, AR, Net Profit) | `GET /api/v1/reports/balance-sheet`, `GET /api/v1/reports/profit-loss` | Summary cards show live financial metrics | Show fallback skeleton / retry button if data fetch fails |
| **3** | `/contacts` | Verify/Create Vendor "Azure Furniture" | `GET /api/v1/contacts`, `POST /api/v1/contacts` | Vendor appears in list with badge `Vendor` | Inline field error on duplicate name/invalid email |
| **4** | `/products` | Verify/Create Product "Wooden Chair" (₹2,500, Tax 18%) | `GET /api/v1/products`, `POST /api/v1/products` | Product appears in table with price and tax rates | Modal remains open with error details; user can fix inputs |
| **5** | `/purchase-orders` | Click "New PO", select Azure Furniture, add 10x Wooden Chair, click "Create PO" | `POST /api/v1/purchase-orders` | PO created in `draft` state; auto-navigates to `/purchase-orders/:id` | Line-item validation error displayed (e.g. qty > 0) |
| **6** | `/purchase-orders/:id` | Review draft PO and click "Confirm Order" | `PATCH /api/v1/purchase-orders/:id/confirm` | PO status transitions to `confirmed`; "Create Bill" button unlocks | Error banner if order cannot be confirmed |
| **7** | `/purchase-orders/:id` | Click "Create Vendor Bill" | `POST /api/v1/purchase-orders/:id/create-bill` | Vendor Bill generated; status updates to `billed`; Journal Entry created in Purchase Journal | Error toast; disable button once clicked to avoid duplicates |
| **8** | `/purchase-orders/:id` | Click "Register Payment", select Bank Journal, enter amount, confirm | `POST /api/v1/payments` | Bill status transitions to `paid`; Outbound Payment Journal Entry created; modal closes | Prevent overpayment beyond bill total; show inline message |
| **9** | `/sales-orders` | Click "New SO", select Customer "Nimesh Pathak", add 5x Wooden Chair (with 18% GST), click "Create SO" | `POST /api/v1/sales-orders` | SO created in `draft`; auto-navigates to `/sales-orders/:id` | Form highlights empty customer or invalid quantities |
| **10** | `/sales-orders/:id` | Click "Confirm Order" | `PATCH /api/v1/sales-orders/:id/confirm` | SO status transitions to `confirmed`; "Generate Invoice" button unlocks | Status badge updates, error banner on failure |
| **11** | `/sales-orders/:id` | Click "Generate Invoice" | `POST /api/v1/sales-orders/:id/create-invoice` | Customer Invoice generated; status updates to `invoiced`; Journal Entry created (Debit AR, Credit Sales + Tax) | Disable repeat clicks; handle duplicate error gracefully |
| **12** | `/sales-orders/:id` | Click "Record Payment", select Bank Journal, confirm full payment | `POST /api/v1/payments` | Invoice status transitions to `paid`; Inbound Payment Journal Entry created (Debit Bank, Credit AR) | Disable payment submission if amount <= 0 or > invoice total |
| **13** | `/journal-entries` | Inspect General Ledger entries | `GET /api/v1/journal-entries` | All automated entries listed; Debit column equals Credit column; balance confirmed | Show empty state if no entries; refresh button available |
| **14** | `/reports/balance-sheet` | Review live Balance Sheet | `GET /api/v1/reports/balance-sheet` | Assets (Bank + AR) exactly balance Liabilities (AP) + Capital/Retained Earnings | Display real-time computed totals with visual balanced indicator |
| **15** | `/reports/profit-loss` | Review Profit & Loss statement | `GET /api/v1/reports/profit-loss` | Income (Sales) minus Expenses (COGS/Purchases) computes Net Profit | Display grouped revenues, costs, and bottom-line margin |

---

## Screen Inventory

| Priority | Screen | Route | Job to be Done | Required States | Status |
|---|---|---|---|---|---|
| **P0** | Login | `/login` | Authenticate by Login ID via JWT | idle / submitting / error / success | Implemented; browser QA pending |
| **P0** | Forgot Password | `/forgot-password` | Start a password reset request | idle / submitting / error / success/demo | Implemented; browser QA pending |
| **P0** | Create User | `/admin/users` | Admin creates an Admin, Accountant, or User account | idle / submitting / validation / success | Implemented; browser QA pending |
| **P0** | App Shell & Dashboard | `/dashboard` | Provide overview of accounts, quick links to transactions & reports | loading / empty / error / success | Implemented; date filter and CSV exports wired; browser QA pending |
| **P0** | Contact Master | `/contacts` | List-first CRUD for customers/vendors with list ↔ kanban and form views | loading / empty / error / success / archived | Implemented; browser QA pending |
| **P0** | Product Master | `/products` | List-first CRUD for products, type/category/pricing, with list ↔ kanban and form views | loading / empty / error / success / archived | Implemented; browser QA pending |
| **P0** | Chart of Accounts | `/chart-of-accounts` | Display hierarchy of Asset, Liability, Bank, Cash, Capital, Income, Expense, Other Expense | loading / empty / error / success | Implemented; browser QA pending |
| **P0** | Purchase Orders List | `/purchase-orders` | View list of POs, filter by status, quick action to create | loading / empty / error / success | Implemented with live API |
| **P0** | Purchase Order Detail | `/purchase-orders/[id]` | Track PO status, convert to Bill, record vendor payment, inspect journal links | loading / mutating / error / success | Implemented; Edit action and browser QA pending |
| **P0** | Sales Orders List | `/sales-orders` | View list of SOs, filter by status, quick action to create | loading / empty / error / success | Implemented with live-first adapter |
| **P0** | Sales Order Detail | `/sales-orders/[id]` | Track SO status, generate Invoice, record customer payment, inspect journal links | loading / mutating / error / success | Implemented; browser QA pending |
| **P0** | Journal Entries | `/journal-entries` | Audit all double-entry ledger records, verify debit = credit balance | loading / empty / error / success | Implemented; browser QA pending |
| **P0** | Balance Sheet | `/reports/balance-sheet` | Display live snapshot of Assets, Liabilities, and Capital | loading / empty / error / success | Implemented; browser QA pending |
| **P0** | Profit & Loss (P&L) | `/reports/profit-loss` | Display real-time Income, Expenses, and Net Profit | loading / empty / error / success | Implemented; browser QA pending |
| **P1** | Analytics & Budget | `/analytic-accounts`, `/budgets`, `/reports/budget` | Manage analytic accounts/budgets and display committed vs achieved utilization | loading / empty / error / success / revised | Implemented with live API contract; browser QA pending |
| **P1** | Contact Portal | `/portal` | Restricted self-service portal for User accounts to view own invoices/bills and pay | loading / unauth / forbidden / error / success | Implemented with ownership-checked self-service routes; backend isolation tests/browser QA pending |

---

## State Ownership & Data Flow

| State Scope | Owner | Persistence | Rationale |
|---|---|---|---|
| **Auth & Session** | React Context (`useAuth`) | `localStorage` (JWT token & user object) | Survives page reloads; accessible globally by router & API client |
| **Remote Entities** | TanStack Query Cache | Memory (bounded TTL, automatic invalidation) | Backend remains source of truth; no stale local clones |
| **Filters, Search, Tabs** | URL Search Params (`useSearchParams`) | URL (`?status=draft&page=1`) | Browser history works; shareable links; survives refreshes |
| **Form Drafts & Line Items** | React Hook Form + Local State | Ephemeral component state | Clean form state lifecycle; avoids dirty drafts leaking across routes |
| **UI Interaction Flags** | Component State (`useState`) | None | Dialog open/close, dropdown toggles, active tabs |

---

## Form and Validation Logic

| Form / Action | Client Validation (Zod) | Backend Authority | Error Presentation |
|---|---|---|---|
| **Login** | Non-empty `loginId` (6–12 chars), non-empty password | Login ID lookup, password verification, account active check | Inline field error; `Invalid Login Id or Password` banner |
| **Public Signup** | Login ID 6–12 chars; valid email shape; password ≥8 chars with lower + upper + special; confirmation matches; no role field | Case-insensitive Login ID/email uniqueness; always creates `invoicing_user` | Inline field errors; never allow the browser to choose Admin/User |
| **Admin Create User** | Name, Login ID, email, role, password, confirmation; `contact_id` required for `contact` role | Admin-only authorization, uniqueness, role/contact linkage | Inline field errors and 403 for non-Admin |
| **Contact Creation** | Name required (min 2 chars), valid email, valid 10-digit mobile, valid type (`customer`, `vendor`, `both`) | Duplicate email/mobile check, DB persistence | Inline field error under matching inputs |
| **Product Creation** | Name required, sales price >= 0, tax percent between 0% and 100% | Valid account references, uniqueness | Inline field error, disable submit until valid |
| **PO / SO Creation** | Contact selected, at least 1 line item, quantity > 0, unit price > 0 | Inventory availability, current pricing, tax rules | Table row error for invalid lines; banner for missing contact |
| **Convert PO to Bill** | PO must be in `confirmed` status; cannot already have bill | One-bill-per-PO invariant, PO state validation | Button disabled if already billed; error toast on 409 conflict |
| **Generate Invoice** | SO must be in `confirmed` status; cannot already have invoice | One-invoice-per-SO invariant, SO state validation | Button disabled if already invoiced; error toast on 409 conflict |
| **Record Payment** | Payment method (`bank` or `cash`) selected, amount > 0 and <= unpaid balance | Overpayment check, portal ownership check, atomic journal entry creation | Cap input max value to remaining balance; inline validation |

---

## API-to-UI Error Mapping

All API endpoints return standard errors in the agreed envelope:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation",
    "fields": { "field_name": "Specific problem" },
    "request_id": "req_xyz"
  }
}
```

| API Code | HTTP | UI Presentation & Action |
|---|:---:|---|
| `VALIDATION_ERROR` | 422 | Map `fields` object directly to React Hook Form field errors, including `login_id`, scroll to and focus first invalid input. |
| `UNAUTHENTICATED` | 401 | Clear stale token, show toast "Session expired. Please log in again.", redirect to `/login?redirect=...`. |
| `FORBIDDEN` | 403 | Show access denied banner: "You do not have permission for this action." Disable unauthorized actions. |
| `NOT_FOUND` | 404 | Show 404 empty state card with button: "Back to list". |
| `CONFLICT` | 409 | Display conflict dialog (e.g. "Bill already generated for this PO"), trigger TanStack Query refetch to sync UI. |
| `JOURNAL_UNBALANCED` | 422 | Urgent warning banner: "Transaction rejected: Debits must equal Credits." Highlight discrepancies. |
| `PAYMENT_EXCEEDS_AMOUNT` | 422 | Inline error under Payment Amount: "Payment exceeds remaining balance." Reset to maximum allowed. |
| `RATE_LIMITED` | 429 | Display cooldown toast: "Too many requests. Please wait a few seconds before trying again." |
| `INTERNAL_ERROR` | 500 | Display error card with "Retry" button and display `request_id` for reporting. Keep user form inputs intact. |

---

## Interaction Invariants

- [x] **No Duplicate Mutations:** Submit and action buttons disable immediately with a spinner once clicked until the network request resolves.
- [x] **Destructive Actions Guarded:** Any delete, cancel, or draft voiding requires an explicit confirmation modal.
- [x] **No Ghost Bills / Invoices:** "Convert to Bill" and "Generate Invoice" buttons dynamically disappear or change to "View Bill" / "View Invoice" once created.
- [x] **Live Arithmetic Parity:** Modifying line-item quantity or price immediately updates Subtotal, GST/Tax, and Grand Total on screen.
- [x] **Ledger Debit/Credit Balance Check:** Journal entry view flags any imbalance in red with `∑ Debit - ∑ Credit = Difference`.
- [x] **Non-Blocking Background Fetching:** Table pagination or status filtering shows a slim progress indicator without unmounting previous table rows.
- [x] **Empty States Guide Next Action:** Blank tables display an actionable CTA (e.g. "No contacts yet — Add Contact").
- [x] **Role-safe Navigation:** Hide internal accounting routes and actions for `contact`/User accounts; still enforce 403 handling server-side.
- [ ] **Excalidraw View Convention:** Master pages open in list view by default; Contacts, Products, Analytics, and Budgets offer a list ↔ kanban toggle; New and saved-row actions open the corresponding form state.

---

## Performance & Scaling Behavior

- **Tabular Data:** Server-side pagination (`limit=25`, `offset=0`) on contacts, products, orders, and journal entries.
- **Search Inputs:** Debounced at 300ms using `useDebounce` to prevent query hammering on backend endpoints.
- **Query Caching:**
  - Master data (Contacts, Products, Accounts): `staleTime = 5 minutes`
  - Transaction lists (POs, SOs, Journal Entries): `staleTime = 30 seconds`, invalidated immediately upon creation or status patch
  - Financial reports: `staleTime = 0` (always fetch latest balances when viewed)
- **Role-sensitive data:** Portal queries are keyed by authenticated `contact_id`; never reuse an internal list cache for a portal response.
- **Code Splitting:** Dynamic imports for modal dialogs and heavy charting libraries in reports.
