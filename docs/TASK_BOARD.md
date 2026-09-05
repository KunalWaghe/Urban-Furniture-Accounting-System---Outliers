# Urban Furniture Accounting System — Master Task List
> **Ground source of truth.** Frontend: Sourabh · Backend: Kunal · Integration: Both
> Last synced: 6 Sep 2026, 12:20 AM IST — frontend completion + backend contract audit
> Current checklist: **38/52 complete (73%)**; **14 remain**.

---

## Step 1 — Scaffold & Auth ✅ COMPLETE

- [x] 1.1 · BE · FastAPI scaffold, PostgreSQL connection, `/health` route (P0-BE-01)
- [x] 1.2 · FE · Next.js 16 + Tailwind 4 + shadcn shell, QueryProvider, AuthProvider (P0-FE-01)
- [x] 1.3 · BE · User model, JWT register/login/me, RBAC dependency (P0-BE-02R)
- [x] 1.4 · FE · Login & Signup pages wired to live API, role-gated routing (P0-FE-02R)
- [x] 1.5 · INT · Auth handshake verified end-to-end, role gates enforced (P0-INT-01)
  - Additional implemented auth surfaces: `/forgot-password`, `/reset-password`, and Admin `/admin/users`, backed by auth/user API routes and services.

---

## Step 2 — Master Data APIs ✅ COMPLETE

- [x] 2.1 · BE · Contact & Product models + CRUD endpoints (P0-BE-03)
- [x] 2.2 · BE · Chart of Accounts & Journals seed + list endpoints (P0-BE-04)

---

## Step 3 — Dashboard & Navigation Header Shell ✅ COMPLETE

- [x] 3.1 · FE · Dashboard layout shell with top header navigation (P0-FE-03)
  - Sales, Purchase, Account, Reports navigation categories & mega dropdowns
  - Role-based visibility (admin sees user management, invoicing_user sees accounting operations)
  - Global search with ⌘K shortcut, dark theme toggle, responsive mobile navigation drawer

---

## Step 4 — Master Data Pages ✅ COMPLETE

> Build generic reusable List/Form components here; every later page reuses them.

- [x] 4.1 · FE · Contacts list page + create/edit form + deactivation (P0-FE-04a)
  - `GET /api/v1/contacts` → table with search/filter
  - New Contact form → `POST /api/v1/contacts`
  - Click row → edit form → `PUT /api/v1/contacts/:id`
  - Deactivate contact → `DELETE /api/v1/contacts/:id`
- [x] 4.2 · FE · Products list page + create/edit form + Kanban view + deactivation (P0-FE-04b)
  - Table & Kanban toggle with category filter
  - New Product form → `POST /api/v1/products`
  - Click row/card → edit form → `PUT /api/v1/products/:id`
  - Deactivate product → `DELETE /api/v1/products/:id`
- [x] 4.3 · FE · Chart of Accounts hierarchical list view (P0-FE-05-CoA)
  - `GET /api/v1/accounts` → grouped by type (Asset, Liability, Income, Expense, Capital)
  - Read-only ledger structure
- [x] 4.4 · FE · Journals list view
  - `/journals` uses the live journals API with search, type filtering, default-account display, and active/inactive status.


---

## Step 5 — Purchase Order Flow (PO → Bill → Payment) 🔲

### 5A — Purchase Order (partially done)

- [x] 5A.1 · BE · Purchase Order model & create/confirm endpoints (P0-BE-05)
- [x] 5A.2 · FE · PO list page wired to `GET /api/v1/purchase-orders` (P0-FE-15)
- [x] 5A.3 · FE · PO create form (draft) + confirm action + detail page (P0-FE-05)
  - Draft PO edit is available at `/purchase-orders/:id/edit` and uses `PATCH /api/v1/purchase-orders/:id`.

### 5B — Journal Engine + Vendor Bill

- [x] 5B.1 · BE · Build `post_journal_entry()` helper — unit test debit==credit invariant
  - Evidence: `backend/app/services/journal_engine.py`, covered by `backend/tests/test_journal_entries.py`.
- [x] 5B.2 · BE · Vendor Bill creation endpoint + auto Journal Entry (P0-BE-06)
  - `POST /api/v1/purchase-orders/:id/create-bill`
  - Journal: Dr Purchase Expense / Cr Creditors (AP)
  - Evidence: `backend/app/routers/purchase_orders.py`, `backend/app/services/vendor_bill_service.py`, and `backend/tests/test_vendor_bills.py`.
- [x] 5B.3 · FE · Vendor Bill UI — list, detail, status badges (P0-FE-06)
  - Show bill linked from PO detail page
  - UI status mapping covers open/confirmed, partially paid, and paid states.

### 5C — Outbound Payment

- [x] 5C.1 · BE · Payment endpoint (outbound) + auto Journal Entry (P0-BE-07)
  - `POST /api/v1/payments` (type: outbound)
  - Journal: Dr AP / Cr Bank or Cash
  - Bill status → Paid
  - Evidence: `backend/app/routers/payments.py`, `backend/app/routers/vendor_bills.py`, `backend/app/services/payment_service.py`, and `backend/tests/test_payments.py`.
- [x] 5C.2 · FE · Bill Payment modal/form + status update (P0-FE-08)
  - Payment method selector (Cash / Bank)
  - Disables repeat payment after paid

### 5D — Purchase Slice Integration

- [ ] 5D.1 · INT · Verify Purchase vertical slice end-to-end (P0-INT-02)
  - PO create → confirm → create bill → pay → ledger balanced.
  - Note: bill creation currently opens the bill directly; no separate bill-confirm endpoint exists.

---

## Step 6 — Sales Order Flow (SO → Invoice → Payment) 🔲

### 6A — Sales Order

- [x] 6A.1 · BE · Sales Order model & create/confirm endpoints (P0-BE-08)
  - `POST /api/v1/sales-orders`, `POST /api/v1/sales-orders/:id/confirm`
  - Evidence: `backend/app/routers/sales_orders.py`, `backend/app/services/sales_order_service.py`, and `backend/tests/test_sales_orders_and_invoices.py`.
- [x] 6A.2 · FE · SO list page wired to `GET /api/v1/sales-orders` (P0-FE-09a)
- [x] 6A.3 · FE · SO create form + confirm action + detail page (P0-FE-09b)

### 6B — Customer Invoice

- [x] 6B.1 · BE · Customer Invoice creation + auto Journal Entry (P0-BE-09)
  - `POST /api/v1/sales-orders/:id/create-invoice`
  - Journal: Dr Debtors (AR) / Cr Sales Income + Tax
  - Evidence: `backend/app/routers/sales_orders.py`, `backend/app/services/customer_invoice_service.py`, and `backend/tests/test_sales_orders_and_invoices.py`.
- [x] 6B.2 · FE · SO Detail — "Generate Invoice" action + Invoice detail view (P0-FE-10)

### 6C — Inbound Payment

- [x] 6C.1 · BE · Payment endpoint (inbound) + auto Journal Entry (P0-BE-10)
  - `POST /api/v1/payments` (type: inbound)
  - Journal: Dr Cash/Bank / Cr AR
  - Invoice status → Paid
  - Evidence: `backend/app/routers/payments.py`, `backend/app/routers/customer_invoices.py`, `backend/app/services/payment_service.py`, and `backend/tests/test_payments.py`.
- [x] 6C.2 · FE · Customer Invoice Payment modal/action (P0-FE-11)

### 6D — Sales Slice Integration

- [ ] 6D.1 · INT · Verify Sales vertical slice end-to-end (P0-INT-03)
  - SO create → confirm → create invoice → pay → ledger balanced.
  - Note: invoice creation currently opens the invoice directly; no separate invoice-confirm endpoint exists.

---

## Step 7 — Accounting & Reports 🔲

### 7A — Journal Entries

- [x] 7A.1 · BE · Journal Entries create/list endpoint + balance checks (P0-BE-11)
  - `POST /GET /api/v1/journal-entries`
  - Enforce debit == credit on save
  - Evidence: `backend/app/routers/journal_entries.py`, `backend/app/services/journal_entry_service.py`, and `backend/tests/test_journal_entries.py`.
- [x] 7A.2 · FE · Journal Entries list + manual entry form with balance warning (P0-FE-12)
  - `/journal-entries` lists entries and validates live debit/credit balance before posting.

### 7B — Financial Reports

- [x] 7B.1 · BE · Balance Sheet report query (P0-BE-12a)
  - `GET /api/v1/reports/balance-sheet`
  - `GET /api/v1/reports/profit-loss` is also implemented and covered by `backend/tests/test_reports.py`.
- [x] 7B.2 · FE · Balance Sheet page — Assets, Liabilities, Capital with equation check (P0-FE-13a)
  - `/reports/balance-sheet` with date filter, totals, equation status, and print action
- [x] 7B.3 · FE · P&L page — Income, Expenses, Net Income (P0-FE-13b)
  - `/reports/profit-loss` with year filter, totals, result status, and print action
- [x] 7C.1 · FE · Payments history screen
  - `/payments` uses `GET /api/v1/payments` with inbound/outbound filters, search, linked documents, journal references, and payment totals.

---

## Step 8 — Demo Data & Golden Path 🔲

- [x] 8.1 · BE · Deterministic demo seed script with realistic data (P0-BE-13)
  - Azure Furniture, Nimesh Pathak, chairs, full PO→Bill→Pay + SO→Invoice→Pay cycle
  - Evidence: `backend/seed.py` seeds users, master data, procurement, sales, payments, and verifies P&L/Balance Sheet output.
- [ ] 8.2 · INT · Full Golden-Path Dry Run — 3-min demo without errors (P0-INT-04)
  - Tag stable commit, update `docs/REVIEWER_BRIEF.md`

---

## Audit Notes

- Frontend `tsc --noEmit` and `next build --webpack` pass; the build contains 30 authenticated/public routes, including `/dashboard`, `/analytic-accounts`, `/budgets`, `/reports/budget`, `/payments`, and `/portal`.
- Backend route inventory now includes Analytic Accounts, Budgets, Budget Report, and Self-Service routers in addition to the P0 accounting APIs; self-service still needs contact-role/contact-id hardening and dedicated tests.
- Backend tests collect successfully, but all 54 tests fail during database setup because PostgreSQL on `localhost:5432` is unavailable; runtime API behavior remains unverified in this environment.
- Purchase and sales integration gates remain open until the complete live golden paths are run against the configured database.
- Budget and portal frontend integration is now aligned: budget dates/responsible person fields, `PATCH /cancel`, report response normalization, and the ownership-checked `/self-service/my-invoices` list/payment routes are wired.
- Sales Order invoice generation no longer calls the nonexistent generic status route; the live create-invoice endpoint remains the source of truth for the status transition.
- Dashboard date filtering and both CSV export controls are wired. Remaining frontend work is browser QA/accessibility polish; the PO draft edit flow and auth/legal/support links are now implemented.

## Step 9 — P1: Budget & Contact Portal 🔲

> Only start after Step 8 passes.

- [x] 9.1 · BE · Analytic Account & Budget models + endpoints (P1-BE-01)
  - Committed, achieved, achieved %, amount-to-achieve computation
  - Evidence: `backend/app/routers/analytic_accounts.py`, `backend/app/routers/budgets.py`, `backend/app/routers/reports.py`, corresponding models/services/schemas, and `backend/tests/test_budgets.py`.
- [x] 9.2 · FE · Analytic/Budget master views + Budget Report page with donut chart (P1-FE-01)
  - `/analytic-accounts`, `/budgets`, and `/reports/budget` are wired to the live contracts, including date/person field normalization, confirm/revise/cancel mutations, loading/error/empty states, and donut utilization.
- [ ] 9.3 · INT · Verify Budget Flow end-to-end (P1-INT-01)
- [ ] 9.4 · BE · Contact Portal endpoints — restrict to own invoices/bills (P1-BE-02)
  - Routes exist: `backend/app/routers/self_service.py` exposes `/self-service/my-invoices`, `/my-bills`, and ownership-checked payment routes; however, the router currently resolves contacts by email and does not enforce the documented `contact_id`/contact-role contract. Add dedicated portal isolation tests before marking complete.
- [x] 9.5 · FE · Contact Portal restricted view ("My Invoices") + pay action (P1-FE-02)
  - `/portal` uses `/api/v1/self-service/my-invoices` and `/my-invoices/:id/pay`, with paid-state handling, payment method selection, loading/error states, and query invalidation after payment.
- [ ] 9.6 · INT · Verify Contact Portal end-to-end (P1-INT-02)

---

## Step 10 — Bonus (Post-Midnight, only if P0 is stable) 🔲

- [x] 10.1 · FE · Dashboard KPI cards — Receivables, Payables, Net Profit (BONUS-02)
  - Dashboard now loads Cash, Bank, Receivables, Payables, and Net Profit from the Balance Sheet/P&L APIs.
- [ ] 10.2 · BE · PDF invoice/bill export (BONUS-03)
- [ ] 10.3 · INT · Date period filters on reports (BONUS-01)

---

## Step 11 — Stabilize, Polish & Submit 🔲

- [ ] 11.1 · FE · Responsive checks (phone + laptop), keyboard nav, contrast (Sourabh)
- [ ] 11.2 · BE · Input validation, CORS, error redaction, transaction boundaries (Kunal)
- [ ] 11.3 · INT · Clean browser golden path test + backup screen recording (Both)
- [ ] 11.4 · DOCS · Reviewer brief, API contract, README — no placeholders (Both)
- [ ] 11.5 · DEMO · 3 rehearsals: timed demo, failure recovery, architecture Q&A (Both)
- [ ] 11.6 · SUBMIT · Verify form fields, repo visibility, URLs, submit early (Both)
