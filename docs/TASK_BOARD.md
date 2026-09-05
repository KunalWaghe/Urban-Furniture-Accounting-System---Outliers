# Urban Furniture Accounting System — Master Task List
> **Ground source of truth.** Frontend: Sourabh · Backend: Kunal · Integration: Both
> Last synced: 5 Sep 2026, 7:55 PM IST

---

## Step 1 — Scaffold & Auth ✅ COMPLETE

- [x] 1.1 · BE · FastAPI scaffold, PostgreSQL connection, `/health` route (P0-BE-01)
- [x] 1.2 · FE · Next.js 16 + Tailwind 4 + shadcn shell, QueryProvider, AuthProvider (P0-FE-01)
- [x] 1.3 · BE · User model, JWT register/login/me, RBAC dependency (P0-BE-02R)
- [x] 1.4 · FE · Login & Signup pages wired to live API, role-gated routing (P0-FE-02R)
- [x] 1.5 · INT · Auth handshake verified end-to-end, role gates enforced (P0-INT-01)

---

## Step 2 — Master Data APIs ✅ COMPLETE

- [x] 2.1 · BE · Contact & Product models + CRUD endpoints (P0-BE-03)
- [x] 2.2 · BE · Chart of Accounts & Journals seed + list endpoints (P0-BE-04)

---

## Step 3 — Dashboard & Navigation Shell 🔲 NEXT

- [ ] 3.1 · FE · Dashboard layout shell with sidebar navigation (P0-FE-03)
  - Sales, Purchase, Accounting, Reports, Master Data nav items
  - Role-based visibility (admin sees all, invoicing_user sees subset)
  - Active route highlighting, responsive collapse on mobile

---

## Step 4 — Master Data Pages 🔲

> Build generic reusable List/Form components here; every later page reuses them.

- [ ] 4.1 · FE · Contacts list page + create/edit form (P0-FE-04a)
  - `GET /api/v1/contacts` → table with search/filter
  - New Contact form → `POST /api/v1/contacts`
  - Click row → edit form → `PUT /api/v1/contacts/:id`
- [ ] 4.2 · FE · Products list page + create/edit form (P0-FE-04b)
  - Same pattern as Contacts
- [ ] 4.3 · FE · Chart of Accounts hierarchical list view (P0-FE-05-CoA)
  - `GET /api/v1/accounts` → grouped by type (Asset, Liability, Income, Expense…)
  - Read-only for now (seeded data)

---

## Step 5 — Purchase Order Flow (PO → Bill → Payment) 🔲

### 5A — Purchase Order (partially done)

- [x] 5A.1 · BE · Purchase Order model & create/confirm endpoints (P0-BE-05)
- [x] 5A.2 · FE · PO list page wired to `GET /api/v1/purchase-orders` (P0-FE-15)
- [x] 5A.3 · FE · PO create form (draft) + confirm action + detail page (P0-FE-05)

### 5B — Journal Engine + Vendor Bill

- [ ] 5B.1 · BE · Build `post_journal_entry()` helper — unit test debit==credit invariant
- [ ] 5B.2 · BE · Vendor Bill creation endpoint + auto Journal Entry (P0-BE-06)
  - `POST /api/v1/purchase-orders/:id/create-bill`
  - Journal: Dr Purchase Expense / Cr Creditors (AP)
- [ ] 5B.3 · FE · Vendor Bill UI — list, detail, status badges (P0-FE-06)
  - Show bill linked from PO detail page
  - Status: Draft → Confirmed → Paid

### 5C — Outbound Payment

- [ ] 5C.1 · BE · Payment endpoint (outbound) + auto Journal Entry (P0-BE-07)
  - `POST /api/v1/payments` (type: outbound)
  - Journal: Dr AP / Cr Bank or Cash
  - Bill status → Paid
- [ ] 5C.2 · FE · Bill Payment modal/form + status update (P0-FE-08)
  - Payment method selector (Cash / Bank)
  - Disables repeat payment after paid

### 5D — Purchase Slice Integration

- [ ] 5D.1 · INT · Verify Purchase vertical slice end-to-end (P0-INT-02)
  - PO create → confirm → create bill → confirm bill → pay → ledger balanced

---

## Step 6 — Sales Order Flow (SO → Invoice → Payment) 🔲

### 6A — Sales Order

- [ ] 6A.1 · BE · Sales Order model & create/confirm endpoints (P0-BE-08)
  - `POST /api/v1/sales-orders`, `POST /api/v1/sales-orders/:id/confirm`
- [ ] 6A.2 · FE · SO list page wired to `GET /api/v1/sales-orders` (P0-FE-09a)
- [ ] 6A.3 · FE · SO create form + confirm action + detail page (P0-FE-09b)

### 6B — Customer Invoice

- [ ] 6B.1 · BE · Customer Invoice creation + auto Journal Entry (P0-BE-09)
  - `POST /api/v1/sales-orders/:id/create-invoice`
  - Journal: Dr Debtors (AR) / Cr Sales Income + Tax
- [ ] 6B.2 · FE · SO Detail — "Generate Invoice" action + Invoice detail view (P0-FE-10)

### 6C — Inbound Payment

- [ ] 6C.1 · BE · Payment endpoint (inbound) + auto Journal Entry (P0-BE-10)
  - `POST /api/v1/payments` (type: inbound)
  - Journal: Dr Cash/Bank / Cr AR
  - Invoice status → Paid
- [ ] 6C.2 · FE · Customer Invoice Payment modal/action (P0-FE-11)

### 6D — Sales Slice Integration

- [ ] 6D.1 · INT · Verify Sales vertical slice end-to-end (P0-INT-03)
  - SO create → confirm → create invoice → confirm invoice → pay → ledger balanced

---

## Step 7 — Accounting & Reports 🔲

### 7A — Journal Entries

- [ ] 7A.1 · BE · Journal Entries create/list endpoint + balance checks (P0-BE-11)
  - `POST /GET /api/v1/journal-entries`
  - Enforce debit == credit on save
- [ ] 7A.2 · FE · Journal Entries list + manual entry form with balance warning (P0-FE-12)

### 7B — Financial Reports

- [ ] 7B.1 · BE · Balance Sheet & Profit & Loss report queries (P0-BE-12)
  - `GET /api/v1/reports/balance-sheet`, `GET /api/v1/reports/profit-loss`
- [ ] 7B.2 · FE · Balance Sheet page — Assets, Liabilities, Capital with equation check (P0-FE-13a)
- [ ] 7B.3 · FE · P&L page — Income, Expenses, Net Income (P0-FE-13b)

---

## Step 8 — Demo Data & Golden Path 🔲

- [ ] 8.1 · BE · Deterministic demo seed script with realistic data (P0-BE-13)
  - Azure Furniture, Nimesh Pathak, chairs, full PO→Bill→Pay + SO→Invoice→Pay cycle
- [ ] 8.2 · INT · Full Golden-Path Dry Run — 3-min demo without errors (P0-INT-04)
  - Tag stable commit, update `docs/REVIEWER_BRIEF.md`

---

## Step 9 — P1: Budget & Contact Portal 🔲

> Only start after Step 8 passes.

- [ ] 9.1 · BE · Analytic Account & Budget models + endpoints (P1-BE-01)
  - Committed, achieved, achieved %, amount-to-achieve computation
- [ ] 9.2 · FE · Analytic/Budget master views + Budget Report page with donut chart (P1-FE-01)
- [ ] 9.3 · INT · Verify Budget Flow end-to-end (P1-INT-01)
- [ ] 9.4 · BE · Contact Portal endpoints — restrict to own invoices/bills (P1-BE-02)
- [ ] 9.5 · FE · Contact Portal restricted view ("My Invoices") + pay action (P1-FE-02)
- [ ] 9.6 · INT · Verify Contact Portal end-to-end (P1-INT-02)

---

## Step 10 — Bonus (Post-Midnight, only if P0 is stable) 🔲

- [ ] 10.1 · FE · Dashboard KPI cards — Receivables, Payables, Net Profit (BONUS-02)
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
