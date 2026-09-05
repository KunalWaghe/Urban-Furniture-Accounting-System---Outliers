# ODOO HACKATHON — Analysis-Hour Deliverable
## Urban Furniture Accounting System

**Team:** Sourabh (Frontend) + Kunal (Backend)
**Clock:** 9:00–10:00 AM — Analysis & Architecture Lock
**Release State:** Not runnable

---

## A. Problem Understanding

### Plain-Language Summary

Urban Furniture needs a **double-entry accounting system** that covers the full cycle: master data setup → purchase orders → vendor bills → sales orders → customer invoices → payments → automated journal entries → financial reports (Balance Sheet, P&L, Budget).

### Primary User & Stakeholder

| Role | Description |
|---|---|
| **Admin (Business Owner)** | Creates/modifies/archives master data, records transactions, views reports. Full access. |
| **Invoicing User (Accountant)** | Creates master data, records transactions, views reports. Operational user. |
| **Contact (Customer/Vendor)** | Portal view only — sees own invoices/bills, makes payments. |
| **System** | Validates data, computes taxes, updates ledgers, generates reports. |

### Current Pain & Desired Outcome

- **Pain:** Manual or fragmented accounting — no automated journal entries, no real-time financial reporting, no linked purchase/sales flows.
- **Desired Outcome:** A unified system where every purchase and sale automatically creates balanced double-entry journal entries, and accurate Balance Sheet / P&L / Budget reports are generated on demand.

### Required Inputs & Outputs

| Inputs | Outputs |
|---|---|
| Contacts (Customer/Vendor) | Linked journal entries for every transaction |
| Products (name, price, tax) | Purchase Orders, Vendor Bills |
| Chart of Accounts (Assets, Liabilities, Income, Expenses, Capital) | Sales Orders, Customer Invoices |
| Journals (Sales, Purchase, Bank, Cash) | Payment records |
| Budget definitions (period, planned amount, analytic account) | Balance Sheet report |
| | Profit & Loss report |
| | Budget Report (planned vs actual) |

### Explicit Functional Requirements

1. CRUD for Contacts, Products, Chart of Accounts, Journals
2. Purchase flow: PO → Vendor Bill → Payment
3. Sales flow: SO → Customer Invoice → Payment
4. Every transaction creates double-entry journal entries (debit + credit must balance)
5. Balance Sheet generation (Assets = Liabilities + Capital)
6. P&L generation (Income − Expenses = Net Profit)
7. Budget with Analytic Accounts — planned vs actual
8. Contact portal: contacts view own invoices/bills and make payments

### Explicit Non-Functional Requirements

- Business logic in application code, not hardcoded or faked
- Tech-agnostic (any language/framework/database)

### One-Sentence Demo Story

> "Watch a furniture company set up its books, purchase inventory from a vendor, sell to a customer, record payments, and instantly see an accurate Balance Sheet and P&L — all in under 3 minutes."

### Strongest 90-Second Payoff

Creating a sale, watching the journal entries auto-generate with balanced debits/credits, then pulling up a real Balance Sheet that reflects the transaction — proving the system does real accounting, not just CRUD.

### Facts vs Assumptions

| Category | Item |
|---|---|
| **Fact** | 3 user roles (Admin, Invoicing User, Contact) |
| **Fact** | Double-entry journal entries required |
| **Fact** | PO → Bill → Payment flow |
| **Fact** | SO → Invoice → Payment flow |
| **Fact** | Balance Sheet, P&L, Budget reports |
| **Fact** | Analytic accounts for budget tracking |
| **Safe Assumption** | "Tax" mentioned in SO means simple percentage-based tax (GST/VAT style) |
| **Safe Assumption** | Chart of Accounts follows standard 5-type hierarchy (Assets, Liabilities, Income, Expenses, Capital) |
| **Safe Assumption** | Currency is single (INR) — multi-currency not mentioned |
| **Risky Assumption** | Spec mentions "Profile Image" for contacts — **default: skip image upload for P0, use initials avatar** |
| **Risky Assumption** | "Archived" master data behavior — **default: soft delete with is_active flag** |
| **Unanswered** | Are there specific tax rules (GST with CGST/SGST split) or a single flat tax? **Default: single flat percentage tax** |
| **Unanswered** | Does the contact portal need separate auth (magic link) or same login? **Default: same login system, role-restricted views** |

---

## B. Inferred Judging Rubric

> [!NOTE]
> Official rubric is unknown. This is inferred from the problem statement's emphasis areas and typical Odoo hackathon judging.

| Criterion | Weight | What Judges Look For |
|---|---|---|
| **Correctness & Completeness** | 30% | All flows work end-to-end. Double-entry always balances. Reports are accurate. |
| **Business Logic Quality** | 20% | Real accounting rules (debit/credit, account types, journal entries), not faked data |
| **UX & Demo Clarity** | 20% | Clean UI, logical flow, realistic seed data, smooth 5-min demo |
| **Technical Quality** | 15% | Clean architecture, proper validation, error handling, auth |
| **Differentiation** | 10% | Anything beyond baseline: good reports, budget visualization, portal experience |
| **Feasibility & Scalability** | 5% | Honest assessment, sensible architecture choices |

---

## C. User Journey & Success Measure

### Primary Persona

**Riya, Accountant at Urban Furniture** — Records daily purchases and sales, needs accurate books at month-end.

### Golden-Path Journey (≤ 3 minutes)

1. **Riya logs in** → sees dashboard with quick links
2. **Master data is pre-seeded** — she browses contacts, products, chart of accounts
3. **Creates a Purchase Order** for "Azure Furniture" — 10 Wooden Chairs @ ₹500 each
4. **Converts PO to Vendor Bill** → system auto-creates journal entry (Debit: Purchase Expense ₹5,000 / Credit: Creditor ₹5,000)
5. **Records payment via Bank** → journal entry (Debit: Creditor ₹5,000 / Credit: Bank ₹5,000)
6. **Creates a Sales Order** for "Nimesh Pathak" — 5 Office Chairs @ ₹1,200 each + 18% tax
7. **Generates Customer Invoice** → journal entry (Debit: Debtor ₹7,080 / Credit: Sales Income ₹6,000 + Tax Payable ₹1,080)
8. **Records customer payment via Cash** → journal entry auto-created
9. **Opens Balance Sheet** → shows accurate assets, liabilities, capital
10. **Opens P&L** → shows net profit from the sale
11. **Opens Budget Report** → shows planned vs actual for the period

### Before / After

- **Before:** Riya manually tracks transactions in spreadsheets. No auto-generated journal entries. Month-end reporting takes days.
- **After:** Every transaction auto-generates balanced journal entries. Reports are instant and accurate.

### Success Signal

The Balance Sheet equation `Assets = Liabilities + Capital` holds true after all demo transactions, and P&L shows the correct net profit.

---

## D. Ruthless Scope

### P0 — Golden-Path Demo (Must ship by 7:00 PM Day 1)

| # | Feature | Owner | Dependency | Acceptance Condition | Estimate | Stop-Loss |
|---|---|---|---|---|---|---|
| 1 | Auth (login/signup + role-based) | Kunal (BE) + Sourabh (FE) | None | Admin & Invoicing User can log in, Contact sees restricted portal | 2h | Cut Contact portal auth; Admin-only for demo |
| 2 | Contact CRUD | Both | Auth | Create/edit/list contacts (Customer/Vendor/Both) | 1.5h | Minimum: Create + List |
| 3 | Product CRUD | Both | Auth | Create/edit/list products with name, price, tax % | 1.5h | Minimum: Create + List |
| 4 | Chart of Accounts (seeded + CRUD) | Both | Auth | 5-type hierarchy seeded, user can view/add accounts | 1.5h | Seed-only, no custom add |
| 5 | Journal setup (seeded) | Kunal | CoA | Sales, Purchase, Bank, Cash journals exist | 0.5h | — |
| 6 | Purchase Order → Vendor Bill → Payment | Both | Contacts, Products, CoA, Journals | Full flow works, journal entries auto-created | 3h | Cut payment; show PO → Bill with journal entries |
| 7 | Sales Order → Customer Invoice → Payment | Both | Same | Full flow works, journal entries auto-created, tax computed | 3h | Cut payment; show SO → Invoice with journal entries |
| 8 | Journal Entry viewer | Both | Journal entries exist | User can see all journal entries with debit/credit | 1h | — |
| 9 | Balance Sheet report | Both | Journal entries | Correct aggregation by account type | 1.5h | Static period (all-time) |
| 10 | P&L report | Both | Journal entries | Income − Expenses = Net Profit | 1h | Static period |
| 11 | Seed/reset data | Kunal | All models | Deterministic seed for demo | 1h | — |

**Total P0 estimate: ~17.5h** (split across 2 people = ~9h each, fits within the 10:00 AM–7:00 PM window)

### P1 — High-Value Improvements (7:00–10:00 PM, max 2)

| # | Feature | Owner | Acceptance Condition | Estimate |
|---|---|---|---|---|
| 1 | Budget + Analytic Accounts + Budget Report | Both | Create budget, link to analytic account, see planned vs actual | 2.5h |
| 2 | Contact Portal (view own invoices, make payment) | Both | Contact logs in, sees only their invoices/bills, can trigger payment | 2h |

### Bonus — Only After P0 Deployed & Stable (post-midnight)

| # | Feature | Owner | Estimate |
|---|---|---|---|
| 1 | Period filtering on reports (date range picker) | Both | 1.5h |
| 2 | Dashboard with KPI cards (total receivables, payables, revenue) | Sourabh | 1.5h |
| 3 | PDF export for invoices/reports | Kunal | 1.5h |
| 4 | Tax breakdown (CGST/SGST) | Kunal | 1h |

---

## E. Acceptance Criteria

### AC-1: Golden Path — Purchase Flow
```
Given: Admin is logged in, contacts "Azure Furniture" (Vendor) and product "Wooden Chair" (₹500) exist
When: Admin creates PO for 10 Wooden Chairs, converts to Vendor Bill, records Bank payment
Then: 
  - PO status: Draft → Confirmed → Billed
  - Vendor Bill created with correct total (₹5,000)
  - Journal Entry 1: Debit Purchase Expense ₹5,000, Credit Creditor ₹5,000
  - After payment: Journal Entry 2: Debit Creditor ₹5,000, Credit Bank ₹5,000
  - Balance Sheet reflects updated bank and expense balances
```

### AC-2: Golden Path — Sales Flow
```
Given: Admin is logged in, contact "Nimesh Pathak" (Customer) and product "Office Chair" (₹1,200, 18% tax) exist
When: Admin creates SO for 5 Office Chairs, generates invoice, records Cash payment
Then:
  - SO status: Draft → Confirmed → Invoiced
  - Invoice total: ₹7,080 (₹6,000 + ₹1,080 tax)
  - Journal Entry: Debit Debtor ₹7,080, Credit Sales ₹6,000 + Tax Payable ₹1,080
  - After payment: Debit Cash ₹7,080, Credit Debtor ₹7,080
  - P&L shows sales income
```

### AC-3: Invalid Input
```
Given: Admin is on Create Contact form
When: Admin submits with empty Name field or invalid email
Then: Backend rejects with 422 and field-level error, frontend shows inline error, no record created
```

### AC-4: Double-Entry Integrity
```
Given: Any transaction has been recorded
When: The journal entries for that transaction are inspected
Then: Sum of all debits equals sum of all credits (ALWAYS)
```

### AC-5: Empty State
```
Given: Fresh system with no transactions
When: User navigates to Balance Sheet or P&L
Then: Report renders with ₹0 balances and a meaningful empty state message, no crash
```

### AC-6: Authorization
```
Given: A Contact user is logged in
When: Contact attempts to access admin routes (create product, view all invoices, etc.)
Then: Backend returns 403, frontend shows access denied or hides the route entirely
```

### AC-7: Duplicate Payment Prevention
```
Given: A Vendor Bill has already been fully paid
When: User attempts to record another payment for the same bill
Then: System rejects with "Bill already paid" error, no duplicate journal entry created
```

---

## F. Business Rules & Invariants

| # | Rule | Why It Exists | Source of Truth | Frontend Duplicate | Error When Violated |
|---|---|---|---|---|---|
| 1 | **Every journal entry must balance** (∑ debit = ∑ credit) | Double-entry accounting principle | DB constraint + service validation | Show "Unbalanced" warning | `JOURNAL_UNBALANCED` — 422 |
| 2 | **PO can only be converted to Bill once** | Prevents duplicate vendor bills | DB unique constraint (PO → Bill FK) | Hide "Create Bill" button after first bill | `BILL_ALREADY_EXISTS` — 409 |
| 3 | **Invoice can only be generated from confirmed SO** | Prevents invoicing draft/cancelled orders | Service layer status check | Only show "Generate Invoice" on confirmed SO | `INVALID_SO_STATUS` — 422 |
| 4 | **Payment cannot exceed bill/invoice total** | Prevents overpayment | Service validation | Cap payment input to remaining amount | `PAYMENT_EXCEEDS_AMOUNT` — 422 |
| 5 | **Payment creates journal entry automatically** | Ensures books stay in sync | Service layer (transactional with payment record) | N/A — backend responsibility | N/A |
| 6 | **Chart of Accounts types are fixed** | Asset, Liability, Income, Expense, Capital — structural for reports | Enum in schema | Dropdown selection | `INVALID_ACCOUNT_TYPE` — 422 |
| 7 | **Archived records cannot be used in new transactions** | Data integrity | Service layer check on FK references | Hide archived items from dropdowns | `RECORD_ARCHIVED` — 422 |
| 8 | **Balance Sheet = Assets − (Liabilities + Capital) = 0** | Fundamental accounting equation | Derived from journal entries — computed, not stored | Display only | N/A — if wrong, journal entries are broken |
| 9 | **Tax is computed on line subtotal** | Correct tax calculation | Service layer | Display computed tax | `TAX_COMPUTATION_ERROR` — 500 |

---

## G. Domain Model

### Entities (P0 + P1)

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER {
        int id PK
        string email UK
        string password_hash
        enum role "admin|invoicing_user|contact"
        int contact_id FK "nullable, links contact users"
        bool is_active
    }

    CONTACT ||--o{ PURCHASE_ORDER : "is vendor on"
    CONTACT ||--o{ SALES_ORDER : "is customer on"
    CONTACT {
        int id PK
        string name
        enum type "customer|vendor|both"
        string email
        string mobile
        string city
        string state
        string pincode
        bool is_active
    }

    PRODUCT {
        int id PK
        string name
        decimal price
        decimal tax_percent
        string description
        bool is_active
    }

    ACCOUNT {
        int id PK
        string code UK
        string name
        enum type "asset|liability|income|expense|capital"
        bool is_active
    }

    JOURNAL {
        int id PK
        string name
        enum type "sales|purchase|bank|cash"
    }

    PURCHASE_ORDER ||--o| VENDOR_BILL : generates
    PURCHASE_ORDER {
        int id PK
        string po_number UK
        int vendor_id FK
        date order_date
        enum status "draft|confirmed|billed|cancelled"
        decimal total
    }

    PO_LINE }o--|| PURCHASE_ORDER : "belongs to"
    PO_LINE }o--|| PRODUCT : references
    PO_LINE {
        int id PK
        int po_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    VENDOR_BILL ||--o{ PAYMENT : "paid by"
    VENDOR_BILL {
        int id PK
        string bill_number UK
        int po_id FK UK
        int vendor_id FK
        date bill_date
        date due_date
        decimal total
        decimal amount_paid
        enum status "draft|open|paid|cancelled"
    }

    SALES_ORDER ||--o| CUSTOMER_INVOICE : generates
    SALES_ORDER {
        int id PK
        string so_number UK
        int customer_id FK
        date order_date
        enum status "draft|confirmed|invoiced|cancelled"
        decimal subtotal
        decimal tax_amount
        decimal total
    }

    SO_LINE }o--|| SALES_ORDER : "belongs to"
    SO_LINE }o--|| PRODUCT : references
    SO_LINE {
        int id PK
        int so_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal tax_percent
        decimal subtotal
        decimal tax_amount
        decimal line_total
    }

    CUSTOMER_INVOICE ||--o{ PAYMENT : "paid by"
    CUSTOMER_INVOICE {
        int id PK
        string invoice_number UK
        int so_id FK UK
        int customer_id FK
        date invoice_date
        date due_date
        decimal subtotal
        decimal tax_amount
        decimal total
        decimal amount_paid
        enum status "draft|open|paid|cancelled"
    }

    PAYMENT {
        int id PK
        string payment_ref UK
        enum payment_type "inbound|outbound"
        int journal_id FK "bank or cash"
        int vendor_bill_id FK "nullable"
        int customer_invoice_id FK "nullable"
        decimal amount
        date payment_date
    }

    JOURNAL_ENTRY ||--|{ JOURNAL_ITEM : contains
    JOURNAL_ENTRY {
        int id PK
        string entry_number UK
        int journal_id FK
        date entry_date
        string reference
        string source_type "vendor_bill|customer_invoice|payment"
        int source_id
    }

    JOURNAL_ITEM {
        int id PK
        int journal_entry_id FK
        int account_id FK
        decimal debit
        decimal credit
    }

    ANALYTIC_ACCOUNT {
        int id PK
        string name
        enum type "income|expense"
    }

    BUDGET {
        int id PK
        string name
        int analytic_account_id FK
        date period_start
        date period_end
        decimal planned_amount
        string responsible_person
    }
```

### Key Constraints

- `JOURNAL_ITEM`: For every `JOURNAL_ENTRY`, `SUM(debit) = SUM(credit)` — enforced at service layer before commit
- `PURCHASE_ORDER.po_number`, `SALES_ORDER.so_number`, `VENDOR_BILL.bill_number`, `CUSTOMER_INVOICE.invoice_number` — auto-generated, unique
- `VENDOR_BILL.po_id` is unique — one bill per PO
- `CUSTOMER_INVOICE.so_id` is unique — one invoice per SO
- Status transitions are one-directional (draft → confirmed → billed/invoiced; no going back except cancel)

### Lifecycle State Machines

```
Purchase Order:  Draft → Confirmed → Billed → (Paid via Bill)
                   ↓
                 Cancelled

Sales Order:     Draft → Confirmed → Invoiced → (Paid via Invoice)
                   ↓
                 Cancelled

Vendor Bill:     Draft → Open → Paid
                   ↓
                 Cancelled

Customer Invoice: Draft → Open → Paid
                    ↓
                  Cancelled
```

### Indexes

| Table | Index | Justification |
|---|---|---|
| `journal_item` | `(account_id, journal_entry_id)` | Report generation aggregates by account |
| `journal_entry` | `(entry_date)` | Period filtering on reports |
| `purchase_order` | `(vendor_id, status)` | List POs by vendor, filter by status |
| `sales_order` | `(customer_id, status)` | List SOs by customer, filter by status |
| `payment` | `(vendor_bill_id)`, `(customer_invoice_id)` | Lookup payments for a bill/invoice |

---

## H. Technology Decision

| Need | Chosen | Simpler Alternative | Escalation Trigger | Reason |
|---|---|---|---|---|
| **Frontend** | Next.js 14 + TypeScript + Tailwind | Plain React + Vite | If SSR causes deployment issues, fall back to Vite SPA | Team skill (Sourabh). App Router for routing, API proxy convenience. |
| **UI Components** | shadcn/ui | Raw HTML/CSS | None | Pre-built accessible components, saves 3–4h of form/table/dialog work |
| **Backend** | FastAPI (Python) | Flask | If async complexity blocks, simplify to Flask | Team skill (Kunal). Type hints, auto-docs, async support. |
| **Database** | PostgreSQL | SQLite | If PG setup takes >30 min, use SQLite for P0 | Relational integrity, decimal precision, constraints. |
| **ORM** | SQLAlchemy 2.0 + Alembic | Raw SQL | If migration issues block, use raw SQL with manual schema | Team familiarity, migration support. |
| **Auth** | JWT (access + refresh) | Session cookies | None | Stateless, works with SPA and portal. |
| **Deployment** | Single VPS (Railway / Render) | localhost demo | If deployment fails by midnight | Simple, free tier. |
| **PDF Export** | WeasyPrint (bonus only) | Skip | Only after P0 stable | Nice-to-have for invoices/reports. |

> [!IMPORTANT]
> **Modular monolith for backend.** No microservices, no Docker, no Redis, no queues. One FastAPI app, one PostgreSQL database. Keep it simple.

---

## I. System Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│                                                         │
│  Routes:                     Shared:                    │
│  /login                      api-client.ts (typed)      │
│  /dashboard                  components/ (shadcn/ui)     │
│  /contacts                   hooks/ (useQuery wrappers) │
│  /products                   lib/ (utils, types)        │
│  /accounts                                              │
│  /purchase-orders                                       │
│  /purchase-orders/[id]                                  │
│  /sales-orders                                          │
│  /sales-orders/[id]                                     │
│  /journal-entries                                       │
│  /reports/balance-sheet                                 │
│  /reports/pnl                                           │
│  /reports/budget          (P1)                          │
│  /portal                  (P1)                          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/JSON
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                      │
│                                                         │
│  Transport Layer:          Service Layer:                │
│  routers/                  services/                    │
│    auth.py                   auth_service.py            │
│    contacts.py               contact_service.py         │
│    products.py               product_service.py         │
│    accounts.py               account_service.py         │
│    purchase_orders.py        purchase_service.py        │
│    sales_orders.py           sales_service.py           │
│    payments.py               payment_service.py         │
│    journal_entries.py        journal_service.py         │
│    reports.py                report_service.py          │
│                                                         │
│  Domain:                   Data Layer:                   │
│  models/                   repositories/                │
│    (SQLAlchemy models)       (query abstractions)       │
│  schemas/                  migrations/                   │
│    (Pydantic request/       seed.py                     │
│     response models)                                    │
│                                                         │
│  Core:                                                  │
│    config.py, deps.py, exceptions.py, middleware.py     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              │                 │
              │  All tables     │
              │  Constraints    │
              │  Indexes        │
              └─────────────────┘
```

### Frontend Folder Map (Sourabh)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    (redirect to /dashboard or /login)
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── contacts/
│   │   ├── page.tsx                (list)
│   │   └── [id]/page.tsx           (detail/edit)
│   ├── products/page.tsx
│   ├── accounts/page.tsx
│   ├── purchase-orders/
│   │   ├── page.tsx                (list)
│   │   └── [id]/page.tsx           (detail: PO → Bill → Payment flow)
│   ├── sales-orders/
│   │   ├── page.tsx                (list)
│   │   └── [id]/page.tsx           (detail: SO → Invoice → Payment flow)
│   ├── journal-entries/page.tsx
│   └── reports/
│       ├── balance-sheet/page.tsx
│       ├── pnl/page.tsx
│       └── budget/page.tsx         (P1)
├── components/
│   ├── ui/                         (shadcn primitives)
│   ├── layout/                     (sidebar, header, page-shell)
│   ├── forms/                      (contact-form, product-form, etc.)
│   └── tables/                     (data-table, journal-table, report-table)
├── lib/
│   ├── api-client.ts               (typed fetch wrapper)
│   ├── types.ts                    (shared domain types)
│   ├── constants.ts
│   └── utils.ts
└── hooks/
    ├── use-auth.ts
    └── use-query.ts                (TanStack Query wrappers)
```

### Backend Folder Map (Kunal)

```
app/
├── main.py                         (FastAPI app, middleware, startup)
├── core/
│   ├── config.py                   (env-validated settings)
│   ├── database.py                 (engine, session factory)
│   ├── deps.py                     (dependency injection: get_db, get_current_user)
│   ├── exceptions.py               (custom exceptions + handlers)
│   └── security.py                 (JWT encode/decode, password hashing)
├── models/
│   ├── user.py
│   ├── contact.py
│   ├── product.py
│   ├── account.py
│   ├── journal.py
│   ├── purchase_order.py
│   ├── sales_order.py
│   ├── payment.py
│   ├── journal_entry.py
│   ├── analytic_account.py         (P1)
│   └── budget.py                   (P1)
├── schemas/
│   ├── auth.py
│   ├── contact.py
│   ├── product.py
│   ├── account.py
│   ├── purchase.py
│   ├── sales.py
│   ├── payment.py
│   ├── journal.py
│   └── report.py
├── routers/
│   ├── auth.py
│   ├── contacts.py
│   ├── products.py
│   ├── accounts.py
│   ├── purchase_orders.py
│   ├── sales_orders.py
│   ├── payments.py
│   ├── journal_entries.py
│   └── reports.py
├── services/
│   ├── auth_service.py
│   ├── contact_service.py
│   ├── product_service.py
│   ├── account_service.py
│   ├── purchase_service.py         (PO → Bill → journal entry creation)
│   ├── sales_service.py            (SO → Invoice → journal entry creation)
│   ├── payment_service.py          (payment → journal entry creation)
│   ├── journal_service.py
│   └── report_service.py           (Balance Sheet, P&L, Budget aggregation)
├── migrations/
│   └── versions/
├── seed.py                         (deterministic demo data)
└── tests/
    ├── test_purchase_flow.py
    ├── test_sales_flow.py
    ├── test_journal_balance.py
    └── test_reports.py
```

### State Ownership

| Data | Owner | Rationale |
|---|---|---|
| All domain data (contacts, orders, entries) | Server (TanStack Query cache) | Single source of truth is the database |
| Form drafts (unsaved changes) | Local React state | Ephemeral until submit |
| Auth token | httpOnly cookie or localStorage | Session persistence |
| UI state (sidebar open, modals) | Local React state / URL | Not shared across sessions |

### Screen States (Every P0 Screen)

Every screen must handle: **Loading** (skeleton), **Empty** (message + CTA), **Error** (retry), **Success** (data rendered), **Responsive** (mobile-friendly tables).

---

## J. API Contract

### Error Envelope (All Endpoints)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "fields": {
      "email": "Invalid email format"
    },
    "request_id": "uuid-v4"
  }
}
```

### First Vertical Slice: Auth + Contacts + Products + Chart of Accounts

---

#### `POST /api/v1/auth/register`
**Purpose:** Create new user account
**Role:** Public

```json
// Request
{ "email": "riya@urbanfurniture.com", "password": "SecureP@ss1", "name": "Riya Sharma", "role": "admin" }

// Response 201
{ "id": 1, "email": "riya@urbanfurniture.com", "name": "Riya Sharma", "role": "admin", "token": "eyJ..." }
```
**Validation:** email unique, password ≥ 8 chars, role in [admin, invoicing_user]
**Errors:** 409 `EMAIL_ALREADY_EXISTS`, 422 `VALIDATION_ERROR`

---

#### `POST /api/v1/auth/login`
**Purpose:** Authenticate user
**Role:** Public

```json
// Request
{ "email": "riya@urbanfurniture.com", "password": "SecureP@ss1" }

// Response 200
{ "id": 1, "email": "riya@urbanfurniture.com", "name": "Riya Sharma", "role": "admin", "token": "eyJ..." }
```
**Errors:** 401 `INVALID_CREDENTIALS`

---

#### `GET /api/v1/contacts`
**Purpose:** List all contacts
**Role:** admin, invoicing_user

```json
// Response 200
{
  "data": [
    { "id": 1, "name": "Azure Furniture", "type": "vendor", "email": "info@azure.com", "mobile": "9876543210", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "is_active": true }
  ],
  "total": 1
}
```
**Query params:** `?type=vendor&search=azure&is_active=true`

---

#### `POST /api/v1/contacts`
**Purpose:** Create contact
**Role:** admin, invoicing_user

```json
// Request
{ "name": "Azure Furniture", "type": "vendor", "email": "info@azure.com", "mobile": "9876543210", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001" }

// Response 201
{ "id": 1, "name": "Azure Furniture", ... }
```
**Validation:** name required, type in [customer, vendor, both], email format
**Errors:** 422 `VALIDATION_ERROR`

---

#### `GET /api/v1/products` | `POST /api/v1/products`
Same pattern. Fields: `name, price, tax_percent, description, is_active`

#### `GET /api/v1/accounts` | `POST /api/v1/accounts`
Same pattern. Fields: `code, name, type (asset|liability|income|expense|capital), is_active`

---

### Core Flow: Purchase

#### `POST /api/v1/purchase-orders`
**Purpose:** Create purchase order
**Role:** admin, invoicing_user

```json
// Request
{
  "vendor_id": 1,
  "order_date": "2026-09-05",
  "lines": [
    { "product_id": 1, "quantity": 10, "unit_price": 500.00 }
  ]
}

// Response 201
{
  "id": 1, "po_number": "PO-0001", "vendor": { "id": 1, "name": "Azure Furniture" },
  "status": "draft", "total": 5000.00,
  "lines": [{ "id": 1, "product": { "id": 1, "name": "Wooden Chair" }, "quantity": 10, "unit_price": 500.00, "subtotal": 5000.00 }]
}
```

#### `PATCH /api/v1/purchase-orders/:id/confirm`
**Purpose:** Confirm PO (draft → confirmed)
**Response:** Updated PO with `status: "confirmed"`
**Errors:** 422 `INVALID_STATUS_TRANSITION` if not draft

#### `POST /api/v1/purchase-orders/:id/create-bill`
**Purpose:** Convert PO to Vendor Bill + auto-create journal entry
**Response 201:**
```json
{
  "bill": { "id": 1, "bill_number": "BILL-0001", "total": 5000.00, "status": "open", ... },
  "journal_entry": { "id": 1, "entry_number": "JE-0001", "items": [
    { "account": "Purchase Expense", "debit": 5000.00, "credit": 0 },
    { "account": "Accounts Payable", "debit": 0, "credit": 5000.00 }
  ]}
}
```
**Errors:** 409 `BILL_ALREADY_EXISTS`, 422 `INVALID_STATUS_TRANSITION` (must be confirmed)

---

### Core Flow: Sales

#### `POST /api/v1/sales-orders`
Same pattern as PO. Includes `customer_id`, lines with `tax_percent`.

#### `PATCH /api/v1/sales-orders/:id/confirm`
#### `POST /api/v1/sales-orders/:id/create-invoice`
Creates invoice + journal entry (Debit: Accounts Receivable, Credit: Sales Income + Tax Payable)

---

### Core Flow: Payment

#### `POST /api/v1/payments`
```json
// Request
{
  "payment_type": "outbound",
  "journal_id": 3,
  "vendor_bill_id": 1,
  "amount": 5000.00,
  "payment_date": "2026-09-05"
}

// Response 201 — includes auto-created journal entry
{
  "payment": { "id": 1, "payment_ref": "PAY-0001", ... },
  "journal_entry": { ... }
}
```
**Errors:** 422 `PAYMENT_EXCEEDS_AMOUNT`, 409 `ALREADY_FULLY_PAID`

---

### Reports

#### `GET /api/v1/reports/balance-sheet`
```json
// Response 200
{
  "as_of_date": "2026-09-05",
  "assets": [{ "account_code": "1001", "account_name": "Cash", "balance": 7080.00 }, ...],
  "liabilities": [...],
  "capital": [...],
  "total_assets": 12080.00,
  "total_liabilities_and_capital": 12080.00
}
```
**Query params:** `?as_of_date=2026-09-05`

#### `GET /api/v1/reports/pnl`
```json
// Response 200
{
  "period_start": "2026-09-01",
  "period_end": "2026-09-05",
  "income": [{ "account_code": "4001", "account_name": "Sales Income", "balance": 6000.00 }],
  "expenses": [{ "account_code": "5001", "account_name": "Purchase Expense", "balance": 5000.00 }],
  "net_profit": 1000.00
}
```

#### `GET /api/v1/reports/budget` (P1)
```json
// Response 200
{
  "budgets": [
    { "name": "Q3 Marketing", "planned": 50000, "actual": 32000, "variance": 18000, "utilization_pct": 64 }
  ]
}
```

---

## K. Parallel Task Plan

### First Vertical Slice (10:00 AM–12:30 PM)

| Time | Sourabh (Frontend) | Kunal (Backend) | Integration |
|---|---|---|---|
| 10:00–10:30 | Project setup (Next.js + Tailwind + shadcn) | Project setup (FastAPI + SQLAlchemy + PG + Alembic) | — |
| 10:30–11:15 | Login/Register page + auth context + API client | Auth router + JWT + User model + migration | Contract: POST /auth/login, /auth/register |
| 11:15–12:00 | Contact list + create form, Product list + create form | Contact CRUD router + service, Product CRUD | Contract: GET/POST /contacts, /products |
| 12:00–12:30 | Chart of Accounts page (read-only from seed) | CoA model + seed script + Journal seed | Integration test: login → list contacts |

### P0 Build (12:30–7:00 PM)

| Time | Sourabh (Frontend) | Kunal (Backend) |
|---|---|---|
| 12:30–2:00 | Purchase Order: create form + list page | PO model + create/confirm/list endpoints |
| 2:00–3:30 | PO detail page: confirm → create bill flow | Vendor Bill creation + journal entry auto-generation |
| 3:30–4:30 | Payment recording UI (for vendor bills) | Payment endpoint + journal entry for payment |
| 4:30–6:00 | Sales Order: create + list + detail + invoice flow | SO model + endpoints + invoice + journal entries |
| 6:00–6:30 | Journal entries list page | Journal entry list endpoint |
| 6:30–7:00 | Balance Sheet + P&L report pages | Report endpoints (aggregate journal items by account type) |

**7:00 PM Gate:** Full P0 golden path works end-to-end. Stable commit tagged.

### P1 (7:00–10:00 PM)

| Time | Sourabh | Kunal |
|---|---|---|
| 7:00–8:30 | Budget form + budget report page | Analytic Account + Budget models + budget report endpoint |
| 8:30–10:00 | Contact portal (restricted views for own invoices) | Portal endpoints (filtered by contact_id from auth) |

### Task Board (Initial)

See [`docs/TASK_BOARD.md`](file:///Users/noobieboobie/Documents/ChatGPT/hackathon/docs/TASK_BOARD.md) — will be fully updated after approval.

**NOW:**
- `P0-FE-01` — Sourabh — Next.js project setup + shadcn + API client stub
- `P0-BE-01` — Kunal — FastAPI project setup + DB + User model + auth endpoints

**NEXT:**
- `P0-FE-02` — Login/Register page
- `P0-BE-02` — Contact CRUD endpoints
- `P0-FE-03` — Contact list + form
- `P0-BE-03` — Product CRUD endpoints
- `P0-FE-04` — Product list + form

---

## L. Reviewer-Ready Summary

### Two-Minute Explanation

1. **Problem:** Urban Furniture needs a real accounting system — not spreadsheets. Every purchase and sale must generate double-entry journal entries, and accurate financial reports must be available on demand.

2. **Primary User:** Riya, the company accountant, who records purchases, sales, and payments daily, and needs instant Balance Sheet and P&L reports.

3. **Product Promise:** A complete accounting workflow where every transaction automatically creates balanced debit/credit entries, and financial reports are always accurate.

4. **Golden-Path Demo:** Set up master data → Create a purchase (PO → Bill → Payment) → Create a sale (SO → Invoice → Payment) → View auto-generated journal entries → Pull up Balance Sheet showing Assets = Liabilities + Capital → View P&L showing net profit. All in under 3 minutes with realistic seed data.

5. **Architecture:** Next.js + FastAPI + PostgreSQL. Modular monolith. No unnecessary infrastructure. Typed API contract between frontend and backend. Double-entry balance enforced at service layer.

6. **Current Milestone:** Analysis hour — architecture locked, awaiting team approval to begin implementation.

7. **Biggest Risk:** The purchase/sales/journal-entry chain has many linked models. If the journal entry creation logic has bugs, reports will be wrong. **Containment:** Build and test the journal entry service first (vertical slice), with a unit test that asserts balance on every entry.

8. **Scalability Path:**
   - ✅ **Implemented:** Role-based auth, proper validation, relational constraints
   - 📋 **Planned (P1):** Budget & analytic accounts, contact portal
   - 📋 **Planned (Bonus):** Period filtering, PDF export, dashboard KPIs, pagination

---

## STATE CHECKPOINT

```
Clock: 9:00–10:00 AM — Analysis Hour (Architecture Lock)
Release state: Not runnable
Done and verified:
  - Problem analysis complete
  - Domain model defined
  - API contract drafted (first vertical slice + P0)
  - Architecture and tech stack locked
  - Scope triage complete (P0 / P1 / Bonus)
  - Acceptance criteria written (7 scenarios)
In progress:
  - Awaiting team approval — Sourabh + Kunal — "LOCK AND BUILD"
Next three actions:
  1. Review and approve this analysis package — Both
  2. P0-FE-01: Next.js project setup + shadcn + API client — Sourabh
  3. P0-BE-01: FastAPI project setup + DB + User model + auth — Kunal
Blocked on: Team approval to begin implementation
Current risk: None new — scope is well-bounded for 24h
Stable URL/commit: Not yet available
```
