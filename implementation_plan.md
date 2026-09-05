# Backend Remaining Work — Implementation Plan

> **Context:** Steps 1–2 and 5A–5B.2 are done. You have working Auth, Master Data CRUD, Purchase Orders (create/confirm/list), Vendor Bills (create-from-PO with auto Journal Entry), and a seed script. This plan covers everything else, ordered so each step builds on the last with zero blockers.

---

## Phase 1 — Journal Engine Foundation (Do This First)

> Everything downstream depends on a reliable, reusable journal posting helper. Right now the logic is inlined inside `vendor_bill_service.create_bill_from_po()`. Extract it.

### [NEW] `app/services/journal_engine.py`

**What to build:**
```python
def post_journal_entry(
    db: Session,
    journal_code: str,         # "PUR", "SLS", "BNK", "CSH"
    reference: str,            # e.g. "BILL-0001", "INV-0001", "PAY-0001"
    date: datetime,
    lines: list[dict],         # [{account_id, partner_id, debit, credit, description, analytic_account_id}]
) -> JournalEntry:
```

**Core invariant (the one rule that makes double-entry work):**
```python
total_debit = round(sum(l["debit"] for l in lines), 2)
total_credit = round(sum(l["credit"] for l in lines), 2)
if total_debit != total_credit:
    raise ValidationException(f"Unbalanced entry: debits={total_debit}, credits={total_credit}")
```

**Edge cases to handle:**
- ❌ Empty `lines` list → reject
- ❌ Any line with both `debit > 0` and `credit > 0` → reject (a single line should be one or the other)
- ❌ Any line with `debit == 0` and `credit == 0` → reject (no-op line)
- ❌ Negative amounts → reject
- ❌ Journal code not found → `NotFoundException`
- ❌ Account ID not found → `NotFoundException`
- ✅ Round all amounts to 2 decimal places before comparison

**After building:** Refactor `vendor_bill_service.create_bill_from_po()` to call `post_journal_entry()` instead of its inlined logic. Run existing PO→Bill flow to verify nothing breaks.

### [NEW] `app/routers/journal_entries.py` + `app/services/journal_entry_service.py`

**Endpoints:**
- `GET /api/v1/journal-entries` — list with pagination, filter by journal_code, date range, search by reference/entry_number
- `GET /api/v1/journal-entries/{id}` — detail with items
- `POST /api/v1/journal-entries` — manual JE creation (uses `post_journal_entry()` internally)

**Schemas needed** (extend existing `journal_entry.py`):
```python
class JournalItemCreate(BaseModel):
    account_id: int
    partner_id: Optional[int] = None
    debit: float = Field(ge=0)
    credit: float = Field(ge=0)
    description: Optional[str] = None

class JournalEntryCreate(BaseModel):
    journal_id: int
    date: Optional[datetime] = None
    reference: Optional[str] = None
    items: List[JournalItemCreate] = Field(min_length=2)  # at least 2 lines
```

> [!IMPORTANT]
> This is the foundation. Once `post_journal_entry()` works and is tested, every other phase just calls it with different account mappings.

---

## Phase 2 — Payment Model + Outbound Payment (Bill Pay)

> This completes the purchase vertical slice: PO → Bill → **Pay**.

### [NEW] `app/models/payment.py`

```python
class Payment(Base):
    __tablename__ = "payments"

    id            # PK
    payment_number  # "PAY-0001" auto-generated
    payment_type    # "outbound" (vendor pay) or "inbound" (customer receive)
    contact_id      # FK → contacts
    bill_id         # FK → vendor_bills (nullable)
    invoice_id      # FK → customer_invoices (nullable, Phase 4)
    journal_id      # FK → journals (bank or cash)
    amount          # float
    payment_method  # "cash" | "bank"
    date            # datetime
    note            # optional text
    journal_entry_id  # FK → journal_entries (the auto-posted JE)
    status          # "posted" | "draft"
    created_at, updated_at
```

### [NEW] `app/services/payment_service.py`

**`create_outbound_payment(db, bill_id, amount, payment_method, date, note)`**

**Logic:**
1. Fetch VendorBill, validate status is `"open"` or `"partially_paid"`
2. Validate `amount > 0` and `amount <= (bill.total - bill.amount_paid)`
3. Determine journal: `payment_method == "bank"` → journal code `"BNK"`, else `"CSH"`
4. Determine accounts:
   - Debit: AP account (code `"2010"` — Accounts Payable)
   - Credit: Bank (code `"1020"`) or Cash (code `"1010"`)
5. Call `post_journal_entry(journal_code, reference=payment_number, lines=[...])`
6. Update bill: `bill.amount_paid += amount`
7. Update bill status:
   - `amount_paid >= bill.total` → `"paid"`
   - `amount_paid > 0` but `< bill.total` → `"partially_paid"`
8. Save Payment record

**Edge cases:**
- ❌ Paying a bill that's already fully paid → reject with `ConflictException`
- ❌ Overpayment (`amount > amount remaining`) → reject with `ValidationException`
- ❌ Paying a bill with status `"cancelled"` → reject
- ❌ Zero or negative amount → reject
- ⚠️ Floating point: use `round(bill.total - bill.amount_paid, 2)` for remaining comparison
- ✅ Partial payments: multiple payments against one bill should work (summing up)

### [MODIFY] `app/routers/purchase_orders.py` or [NEW] `app/routers/payments.py`

**Endpoint:**
- `POST /api/v1/vendor-bills/{bill_id}/pay` — accepts `{amount, payment_method, date?, note?}`

**Or a unified payments router:**
- `POST /api/v1/payments` — accepts `{payment_type, bill_id?, invoice_id?, amount, payment_method, date?, note?}`

> [!TIP]
> I'd recommend a **unified `/api/v1/payments` router** — both outbound and inbound payments use the same model, just different account mappings. Cleaner for frontend too.

---

## Phase 3 — Sales Order + Customer Invoice [COMPLETED]

> Mirror of the purchase flow. Completed with models, schemas, services, routers, seed integration, and tests.

### [NEW] `app/models/sales_order.py`

Same shape as `purchase_order.py`:
- `SalesOrder` — `so_number`, `customer_id` (FK→contacts), `order_date`, `status` (draft/confirmed/invoiced/cancelled), `total`
- `SalesOrderLine` — `so_id`, `product_id`, `account_id` (defaults to Sales Income 4010), `analytic_account_id`, `quantity`, `unit_price`, `subtotal`

### [NEW] `app/models/customer_invoice.py`

Same shape as `vendor_bill.py`:
- `CustomerInvoice` — `invoice_number`, `so_id` (nullable FK→sales_orders), `customer_id`, `invoice_date`, `due_date`, `total`, `amount_paid`, `status` (open/partially_paid/paid), `journal_entry_id`
- `CustomerInvoiceLine` — `invoice_id`, `product_id`, `account_id`, `analytic_account_id`, `quantity`, `unit_price`, `subtotal`

### [NEW] Services & Routers

| File | What it does |
|---|---|
| `services/sales_order_service.py` | `create_sales_order()`, `confirm_sales_order()`, `list/get` — direct mirror of PO service |
| `services/customer_invoice_service.py` | `create_invoice_from_so()` — like `create_bill_from_po()` but posts: **Dr Debtors (1030) / Cr Sales Income (4010)** |
| `routers/sales_orders.py` | `POST /sales-orders`, `GET /sales-orders`, `GET /sales-orders/{id}`, `PATCH /sales-orders/{id}/confirm`, `POST /sales-orders/{id}/create-invoice` |
| `routers/customer_invoices.py` | `GET /customer-invoices`, `GET /customer-invoices/{id}` |
| Schemas: `schemas/sales_order.py`, `schemas/customer_invoice.py` | Mirror of PO/Bill schemas with appropriate field names |

**Key difference from purchase flow:**
- Account mapping is **reversed**: Dr Debtors (Asset) / Cr Sales Income (Income)
- `customer_id` instead of `vendor_id`
- SO line default account → Sales Income (4010) instead of Purchase Expense (5010)

**Edge cases:**
- ❌ Creating invoice from unconfirmed SO → reject
- ❌ Creating duplicate invoice for same SO → reject (ConflictException)
- ❌ Customer contact doesn't exist → NotFoundException
- ✅ SO without lines → reject at schema level (`min_length=1`)

---

## Phase 4 — Inbound Payment (Invoice Pay) [COMPLETED]

> Extended payment service, schemas, and routers to handle customer invoice collections with automated double-entry postings (Dr 1020 Bank / Cr 1030 Debtors). Completed with full test coverage and seed script integration.

### [MODIFY] `app/services/payment_service.py`

- Added `create_inbound_payment(db, invoice_id, amount, payment_method, date, note)`
- Updated `create_payment(db, req)` to route inbound payments with `invoice_id` validation
- Updated `list_payments()` to support `invoice_id` filtering and relationship eager loading
- Added `get_payments_for_invoice(db, invoice_id)`

### [MODIFY] `app/schemas/payment.py`

- Added `InvoicePayRequest` schema with amount and payment_method validations
- Updated `PaymentCreate` schema with `invoice_id`
- Added `invoice_number` to `PaymentResponse`

### [MODIFY] `app/routers/customer_invoices.py` & `app/routers/payments.py`

- Added `POST /api/v1/customer-invoices/{invoice_id}/pay`
- Added `GET /api/v1/customer-invoices/{invoice_id}/payments`
- Added `invoice_id` query parameter to `GET /api/v1/payments`

### [MODIFY] `seed.py` & `backend/tests/test_payments.py`

- Added `seed_phase4_payment_data()` for inbound customer collections and outbound settlements
- Added comprehensive unit and integration tests covering full payment, partial payments, lifecycle transitions, validations (overpayment, double payment, zero/negative amounts), and unified endpoint querying.

---

## Phase 5 — Reports (Balance Sheet + P&L) [COMPLETED]

> Built financial reporting services, Pydantic schemas, API endpoints, deterministic seed verification, and automated tests. Both reports query the `journal_items` ledger table directly with double-entry balance validation.

### [NEW] `app/services/report_service.py`

- Implemented `get_account_balance(db, account_id, year)` evaluating natural debit/credit sign conventions (Asset/Expense: Debit - Credit; Liability/Income/Capital: Credit - Debit).
- Implemented `get_profit_loss(db, year)` compiling Income and Expense categories and deriving Net Income.
- Implemented `get_balance_sheet(db, year)` aggregating Assets, Liabilities, and Capital, injecting Net Income as "Retained Earnings", and auditing `is_balanced` (Assets == Liabilities + Capital).

### [NEW] `app/schemas/report.py`

- Defined `ReportLine`, `ReportSection`, `ProfitLossReport`, and `BalanceSheetReport` schemas with field descriptions and validation constraints.

### [NEW] `app/routers/reports.py` & `app/main.py`

- Mounted `GET /api/v1/reports/profit-loss?year=`
- Mounted `GET /api/v1/reports/balance-sheet?year=`
- Registered `report_router` in `app/routers/__init__.py` and included with prefix `/api/v1/reports`.

### [MODIFY] `seed.py` & `backend/tests/test_reports.py`

- Updated `seed.py` with `verify_phase5_reports(db)` asserting automated ledger equilibrium during seed run.
- Added comprehensive unit and integration test suite (`tests/test_reports.py`) covering report schemas, balance sheet equilibrium, fiscal year filtering, zero-balance account inclusion, and dynamic transaction reflections.

---

## Phase 6 — Budget & Analytic Accounts [COMPLETED]

> Built cost/revenue centre tracking (Analytic Accounts) and financial target management (Budgets) with real-time performance tracking computed live from the ledger, revision lineage tracking, and constraint enforcement.

### [NEW] `app/models/analytic_account.py` & `app/models/budget.py`

- `AnalyticAccount`: Unique `code`, `name`, `type` ('income' | 'expense'), `description`, `is_active`.
- `Budget`: `name`, `analytic_account_id` (FK), `period_start`, `period_end`, `committed_amount`, `status` ('draft', 'confirmed', 'revised', 'cancelled'), `responsible_person_id` (FK), and self-referencing `revised_from_id` for immutable revision history.
- Added foreign key relationships linking `VendorBillLine`, `CustomerInvoiceLine`, and `JournalItem` to `AnalyticAccount`.

### [NEW] `app/services/analytic_account_service.py` & `app/services/budget_service.py`

- Full CRUD on Analytic Accounts with duplicate code collision safeguards.
- Implemented `get_achieved_amount()` querying `VendorBillLine` and `CustomerInvoiceLine` subtotals against parent transaction dates.
- Real-time derived performance metrics: `achieved_amount`, `achieved_pct`, `amount_to_achieve`.
- `check_budget_exceeded()` warning evaluator for procurement and sales allocations.
- State machine transitions (`draft` -> `confirmed`, `draft` -> `cancelled`, `confirmed` -> `revised`) with branch-from-confirmed invariants.
- Overlapping active budget period validation for identical analytic accounts.

### [NEW] `app/schemas/analytic_account.py` & `app/schemas/budget.py`

- Pydantic models for creation, updates, and serialized responses with live performance metrics and period chronology validation (`period_end > period_start`).

### [NEW] `app/routers/analytic_accounts.py` & `app/routers/budgets.py`

- REST endpoints mounted under `/api/v1/analytic-accounts` and `/api/v1/budgets` with pagination, filtering, search, and lifecycle action endpoints (`/confirm`, `/revise`, `/cancel`).

### [MODIFY] `seed.py` & `backend/tests/test_budgets.py`

- Integrated `seed_phase6_analytic_and_budget_data(db)` seeding cost centers, draft/confirmed budgets, and transaction line tags.
- Comprehensive unit and integration test suite (`tests/test_budgets.py`) validating CRUD, status machines, revision lineage, cancellation guards, overlap rejections, and live ledger-driven variance calculations.

---

## Phase 7 — Seed Script Update + Hardening [COMPLETED]

> Hardened backend transactional boundaries with Role-Based Access Control (RBAC), database transaction rollback safety across all mutation services, chronological date validation invariants, and full golden-path double-entry balance verification.

### [MODIFY] `seed.py`

- Executed automated schema synchronization and column migrations (`due_date` on `vendor_bills` and `customer_invoices`) on seed startup.
- Implemented `verify_phase7_golden_path_cycle(db)` verifying the complete end-to-end procurement and sales cycles, trial balance ledger equality (`Debits == Credits`), and Balance Sheet equilibrium (`Assets == Liabilities + Capital`).

### [MODIFY] Routers & Models — Hardening

- Added `APIRouter(dependencies=[Depends(require_roles(["admin", "invoicing_user"]))])` across all transaction routers: `purchase_orders.py`, `sales_orders.py`, `vendor_bills.py`, `customer_invoices.py`, `payments.py`, and `journal_entries.py`.
- Enforced admin-only barrier (`dependencies=[Depends(require_roles(["admin"]))])`) on `users.py`.
- Added `due_date` column and schema definitions to `VendorBill` and `VendorBillResponse`.
- Implemented chronological date guards `validate_bill_dates` (`due_date >= bill_date`) and `validate_invoice_dates` (`due_date >= invoice_date`).
- Enforced `period_end > period_start` both in `BudgetCreate` model validators and `create_budget` service logic.
- Wrapped all mutation transactions in `try / except: db.rollback(); raise` blocks across `purchase_order_service.py`, `sales_order_service.py`, `vendor_bill_service.py`, `customer_invoice_service.py`, `payment_service.py`, `budget_service.py`, `journal_entry_service.py`, `analytic_account_service.py`, `contact_service.py`, `product_service.py`, and `auth_service.py`.

### [NEW] `tests/test_hardening_and_golden_path.py` & `tests/conftest.py`

- Added automated test suite asserting RBAC 401/403 rejection, date chronological invariants, service rollback safety, and full golden-path trial balance equilibrium.
- Configured scoped global test fixtures in `conftest.py` maintaining 100% test pass rate across all 13 suites (54 tests).

---

## Execution Order Summary

```
Phase 1: Journal Engine        ← FIRST (30 min)
    ↓
Phase 2: Payment + Bill Pay    ← completes purchase slice (45 min)
    ↓
Phase 3: Sales Order + Invoice ← mirror of purchase (45 min)
    ↓
Phase 4: Inbound Payment       ← completes sales slice (20 min)
    ↓
Phase 5: Reports (P&L + BS)    ← the demo "wow" (45 min)
    ↓
Phase 6: Budget (P1)           ← only if time (60 min)
    ↓
Phase 7: Seed + Hardening      ← final polish (30 min)
```

> [!IMPORTANT]
> **Total estimated time: ~4.5 hours** for Phases 1–5 + 7 (the P0 scope). Phase 6 (Budget) adds ~1 hour and is P1.

> [!TIP]
> **The golden rule:** After each phase, run the seed script and hit the endpoints manually via `/docs`. Don't stack 3 phases of untested code — you'll lose more time debugging.

---

## Files to Create/Modify — Full Checklist

| Action | File |
|---|---|
| **NEW** | `app/services/journal_engine.py` |
| **NEW** | `app/services/journal_entry_service.py` |
| **NEW** | `app/routers/journal_entries.py` |
| **MODIFY** | `app/services/vendor_bill_service.py` (refactor to use journal_engine) |
| **NEW** | `app/models/payment.py` |
| **NEW** | `app/schemas/payment.py` |
| **NEW** | `app/services/payment_service.py` |
| **NEW** | `app/routers/payments.py` |
| **NEW** | `app/models/sales_order.py` |
| **NEW** | `app/schemas/sales_order.py` |
| **NEW** | `app/services/sales_order_service.py` |
| **NEW** | `app/routers/sales_orders.py` |
| **NEW** | `app/models/customer_invoice.py` |
| **NEW** | `app/schemas/customer_invoice.py` |
| **NEW** | `app/services/customer_invoice_service.py` |
| **NEW** | `app/routers/customer_invoices.py` |
| **NEW** | `app/services/report_service.py` |
| **NEW** | `app/schemas/report.py` |
| **NEW** | `app/routers/reports.py` |
| **NEW** | `app/models/analytic_account.py` (P1) |
| **NEW** | `app/models/budget.py` (P1) |
| **NEW** | `app/services/budget_service.py` (P1) |
| **NEW** | `app/routers/budgets.py` (P1) |
| **MODIFY** | `app/models/__init__.py` (register new models) |
| **MODIFY** | `app/routers/__init__.py` (register new routers) |
| **MODIFY** | `app/main.py` (include new routers) |
| **MODIFY** | `seed.py` (add sales + payment + report verification) |

