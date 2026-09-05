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

## Phase 4 — Inbound Payment (Invoice Pay)

> Extend the payment service from Phase 2 to handle customer invoice payments.

### [MODIFY] `app/services/payment_service.py`

**Add `create_inbound_payment(db, invoice_id, amount, payment_method, date, note)`**

**Logic (mirror of outbound, accounts flipped):**
1. Fetch CustomerInvoice, validate status
2. Validate amount
3. Journal: BNK or CSH
4. Lines:
   - **Debit**: Bank (1020) or Cash (1010)
   - **Credit**: AR / Debtors (1030)
5. Call `post_journal_entry()`
6. Update invoice: `amount_paid += amount`, status transition

**Endpoint:**
- `POST /api/v1/customer-invoices/{invoice_id}/pay` or via unified `POST /api/v1/payments`

**Same edge cases as outbound** — overpayment, double-pay, cancelled invoice, etc.

---

## Phase 5 — Reports (Balance Sheet + P&L)

> This is the "wow" moment in the demo. Both reports query `journal_items` table — no new models needed.

### [NEW] `app/services/report_service.py`

**Core helper — `get_account_balance(db, account_id, year?)`:**
```python
def get_account_balance(db: Session, account_id: int, year: Optional[int] = None) -> float:
    """
    For Asset/Expense accounts: sum(debit) - sum(credit)
    For Liability/Income/Capital accounts: sum(credit) - sum(debit)
    """
    query = db.query(
        func.coalesce(func.sum(JournalItem.debit), 0),
        func.coalesce(func.sum(JournalItem.credit), 0),
    ).join(JournalEntry).filter(
        JournalItem.account_id == account_id,
        JournalEntry.is_posted == True,
    )
    if year:
        query = query.filter(extract('year', JournalEntry.date) == year)

    total_debit, total_credit = query.one()
    account = db.get(Account, account_id)

    if account.type in ("asset", "expense"):
        return round(total_debit - total_credit, 2)
    else:  # liability, income, capital
        return round(total_credit - total_debit, 2)
```

**Profit & Loss endpoint — `GET /api/v1/reports/profit-loss?year=2026`:**
```python
{
    "year": 2026,
    "income": {
        "lines": [{"account_code": "4010", "account_name": "Sales Income", "balance": 50000}],
        "total": 50000
    },
    "expenses": {
        "lines": [{"account_code": "5010", "account_name": "Purchase Expense", "balance": 30000}],
        "total": 30000
    },
    "net_income": 20000
}
```
Logic: Query all accounts where `type == "income"`, sum balances → Income total. Same for `type == "expense"` → Expense total. `net_income = income_total - expense_total`.

**Balance Sheet endpoint — `GET /api/v1/reports/balance-sheet?year=2026`:**
```python
{
    "year": 2026,
    "assets": {
        "lines": [...],  # Cash, Bank, Debtors
        "total": 70000
    },
    "liabilities": {
        "lines": [...],  # Creditors
        "total": 20000
    },
    "capital": {
        "lines": [...],  # Owner Capital + Retained Earnings (net_income)
        "total": 50000
    },
    "is_balanced": true  # assets == liabilities + capital
}
```
Logic: Group accounts by type. For `capital`, include **net income from P&L** as "Retained Earnings" line to make the equation balance.

**Edge cases:**
- ⚠️ Year filter: if no year passed, use current year (or all-time — decide and be consistent)
- ⚠️ Accounts with zero balance: still include them so the report looks complete
- ⚠️ `is_balanced` flag: `Total Assets == Total Liabilities + Total Capital` — if this is false, something posted wrong. Include it as a debug signal
- ✅ Only sum `is_posted == True` journal entries (ignore drafts)

### [NEW] `app/routers/reports.py`

- `GET /api/v1/reports/profit-loss?year=`
- `GET /api/v1/reports/balance-sheet?year=`

---

## Phase 6 — Budget & Analytic Accounts (P1 — only if time allows)

> The plan says "only start after Step 8 passes." Build this last.

### [NEW] `app/models/analytic_account.py`

```python
class AnalyticAccount(Base):
    __tablename__ = "analytic_accounts"
    id, name, type  # "income" | "expenses"
```

### [NEW] `app/models/budget.py`

```python
class Budget(Base):
    __tablename__ = "budgets"
    id, name, analytic_account_id, period_start, period_end,
    committed_amount, status,  # draft/confirmed/revised/cancelled
    responsible_person_id,  # FK → contacts
    revised_from_id,  # nullable self-FK (links revision to original)
```

### [NEW] `app/services/budget_service.py`

**Computed fields (not stored, calculated on read):**
```python
def get_achieved_amount(db, analytic_account_id, period_start, period_end, budget_type):
    """
    For type "expenses": sum subtotals from VendorBillLines
        WHERE analytic_account_id matches AND bill_date in period
    For type "income": sum subtotals from CustomerInvoiceLines
        WHERE analytic_account_id matches AND invoice_date in period
    """

achieved_pct = (achieved / committed) * 100
amount_to_achieve = committed - achieved
```

**Budget check (used in PO confirm + Bill confirm):**
```python
def check_budget_exceeded(db, analytic_account_id, new_amount) -> Optional[str]:
    """
    Find the active (confirmed) budget for this analytic account.
    Sum existing committed spend + new_amount.
    If > budget.committed_amount → return warning message.
    """
```

**Revise flow:**
- `POST /api/v1/budgets/{id}/revise` → creates a new Budget row with `revised_from_id = original.id`, original budget stays as history

**Edge cases:**
- ❌ Revising a draft budget → reject (must be confirmed first)
- ❌ Revising an already-revised budget → reject (follow the chain to the latest)
- ⚠️ Budget periods overlapping for same analytic account → warn or reject
- ⚠️ Achieved amount can exceed committed (it's informational, not blocking by itself — the blocking check is on PO/Bill confirm)

---

## Phase 7 — Seed Script Update + Hardening

### [MODIFY] `seed.py`

Add the full golden-path cycle:
1. Seed Sales Order + confirm + create invoice
2. Seed outbound payment (bill pay)
3. Seed inbound payment (invoice pay)
4. Verify: print Balance Sheet totals, confirm `Assets == Liabilities + Capital`

### [MODIFY] Various — Hardening

- Add `Depends(require_roles(["admin", "invoicing_user"]))` to all transaction routers (PO, SO, Bills, Invoices, Payments)
- Add `Depends(require_roles(["admin"]))` to user management
- Wrap service-layer mutations in `try/except` with `db.rollback()` on failure
- Add date validation (due_date >= bill_date, period_end > period_start)

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

