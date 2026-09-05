# Purchase Orders Module — Design Spec

**Date:** 5 September 2026
**Status:** Approved in brainstorming (user: "go with option A")
**Approach:** Full-stack thin slice — small backend additions + three live-wired frontend screens

---

## 1. Context

Current state:

- `/purchase-orders` is wired to the live list API (P0-FE-17) with server-side pagination/sorting/search. Row detail opens as a **modal**. Amounts render in `$`.
- Backend already provides: `POST /api/v1/purchase-orders` (creates **draft**, auto `PO-000N` numbering, validates qty > 0, unit price ≥ 0, ≥ 1 line, defaults line account to code `5010` "Purchase Expense"), `GET /api/v1/purchase-orders` (status/vendor/search/page/limit/sort), `GET /api/v1/purchase-orders/{id}`, `PATCH /api/v1/purchase-orders/{id}/confirm` (draft → confirmed, rejects other statuses).
- PO line model already carries `account_id` and `analytic_account_id` (bare integer, no table behind it).
- Seed has different vendors/products than the brief and **zero** purchase orders.

This spec delivers the full Purchase Orders workflow from the product brief: list → new form → draft detail → confirm → confirmed detail, in INR (₹), with budget-analytics warnings, in a light-first enterprise finance theme.

## 2. Goals / Non-goals

**Goals**

- Purchase Orders list screen per brief (search, status filter All/Draft/Confirmed/Cancelled, 4 summary cards, New Purchase Order button, row → detail route).
- New Purchase Order form with line items, live totals, validation, budget warning.
- Detail screen with Draft / Confirmed / Cancelled states and working Confirm, Edit, Cancel actions.
- Real data end-to-end: everything above backed by the FastAPI backend.

**Non-goals (explicitly out of scope)**

- Vendor Bill, Payment, Journal Entry screens. The **Create Bill** button is visible but disabled, marked as the next workflow step.
- Sales Orders module changes (`/sales-orders` keeps its current shared component and demo adapter).
- Taxes, discounts, or charges on PO lines (Subtotal = Total).
- Multi-currency (INR only).

## 3. Backend changes

All follow existing patterns (router → service → schema; error envelope via `AppException`).

### 3.1 Cancel endpoint

- `PATCH /api/v1/purchase-orders/{id}/cancel` → `POResponse`.
- Only `draft` → `cancelled`; any other status raises `ValidationException` (mirrors confirm).
- File: `backend/app/routers/purchase_orders.py`, `backend/app/services/purchase_order_service.py`.

### 3.2 Edit endpoint (draft only)

- `PUT /api/v1/purchase-orders/{id}` with body `POCreate` (vendor_id, order_date, lines).
- Allowed only while status is `draft`; otherwise `ValidationException`.
- Replaces all lines (delete-orphan cascade already on the relationship), re-validates products/accounts, recomputes total.
- Files: same router/service; no schema change (`POCreate` reused).

### 3.3 Confirmation timestamp

- Add `confirmed_at: Mapped[Optional[datetime]]` to `PurchaseOrder` model; set it in `confirm_purchase_order`; expose in `POResponse`.
- Existing DBs migrated via the established `ALTER TABLE … ADD COLUMN IF NOT EXISTS` pattern in `main.py` lifespan.
- Files: `backend/app/models/purchase_order.py`, `backend/app/schemas/purchase_order.py`, `backend/app/services/purchase_order_service.py`, `backend/app/main.py`.

### 3.4 Analytic accounts (Budget Analytics)

- New model `AnalyticAccount`: `id`, `name` (unique), `budget_amount: Float`, `is_active: Bool`.
- New endpoint `GET /api/v1/analytic-accounts` (auth required) returning:

```json
{
  "data": [
    { "id": 1, "name": "Furniture Project", "budget_amount": 50000, "committed_amount": 5000, "remaining_amount": 45000 }
  ]
}
```

- `committed_amount` = sum of `PurchaseOrderLine.subtotal` for that analytic on **confirmed** POs. `remaining_amount = budget_amount - committed_amount`.
- New files: `backend/app/models/analytic_account.py`, `backend/app/schemas/analytic_account.py`, `backend/app/routers/analytic_accounts.py`, `backend/app/services/analytic_account_service.py`; register router in `main.py`; add model to `backend/app/models/__init__.py`.

### 3.5 Seed update (`backend/seed.py`, idempotent)

- Vendors (type `vendor`): **Azure Furniture**, **Modern Office Supplies**, **Woodcraft Vendors**. Existing seeded vendors remain active (dropdown is searchable; harmless).
- Products (name / sale price / cost): Wooden Chair ₹800 / ₹500 · Office Chair ₹1,800 / ₹1,200 · Conference Table ₹12,000 / ₹8,000 · Storage Cabinet ₹9,500 / ₹6,500. `product_type: goods`, `tax_percent: 18.0` (consistent with existing seeds; unused by PO flow).
- Analytic accounts: Furniture Project ₹50,000 · Office Renovation ₹100,000 · General Operations ₹25,000.
- Sample POs, seeded in this order so `generate_po_number` lands exactly (guard by existing `po_number`):
  - **PO-0001** · Azure Furniture · 05 Sep 2026 · **confirmed** (`confirmed_at` set) · line: Wooden Chair ×10 @ ₹500, account 5010, analytic Furniture Project · total ₹5,000
  - **PO-0002** · Modern Office Supplies · 04 Sep 2026 · **draft** · lines: Office Chair ×5 @ ₹1,200 = ₹6,000; Storage Cabinet ×1 @ ₹6,500 = ₹6,500 · total ₹12,500
  - **PO-0003** · Woodcraft Vendors · 01 Sep 2026 · **confirmed** (`confirmed_at` set) · line: Office Chair ×7 @ ₹1,200 · total ₹8,400

### 3.6 Auth consistency

- Add `current_user: User = Depends(get_current_user)` to all purchase-order endpoints (every other router already requires auth; the frontend already sends `auth: true`).

## 4. Frontend changes

### 4.1 Structure

New feature folder `frontend/src/features/purchase-orders/`:

- `purchase-orders-api.ts` — typed client:
  - `fetchPurchaseOrdersPage(params)` (moved from `orders-api.ts`)
  - `fetchPurchaseOrder(id)`
  - `createPurchaseOrder(payload)` → POST
  - `updatePurchaseOrder(id, payload)` → PUT
  - `confirmPurchaseOrder(id)` → PATCH …/confirm
  - `cancelPurchaseOrder(id)` → PATCH …/cancel
  - `fetchVendors()` → `GET /contacts?type=vendor&is_active=true&limit=100`
  - `fetchProducts()` → `GET /products?is_active=true&limit=100`
  - `fetchExpenseAccounts()` → `GET /accounts?is_active=true` (filter to expense types client-side; default = code `5010`)
  - `fetchAnalyticAccounts()` → `GET /analytic-accounts`
  - `fetchNextPoNumberPreview()` → latest PO (`sort_by=id&sort_order=desc&limit=1`) → increments numeric suffix
- `purchase-orders-list-page.tsx`, `purchase-order-form-page.tsx` (new + edit modes), `purchase-order-detail-page.tsx`.
- Routes: `app/(app)/purchase-orders/page.tsx` (switch to new list), `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`.
- Cleanup: `OrdersListPage` becomes sales-only; purchase branch and old PO fetchers removed from `features/orders/`.

### 4.2 State & data flow

- **Server state:** React Query. Keys: `["purchase-orders", params]`, `["purchase-order", id]`, `["vendors"]`, `["products"]`, `["expense-accounts"]`, `["analytic-accounts"]`. All create/update/confirm/cancel mutations invalidate the PO keys.
- **Local state:** form fields + line items via `useState`; line total = `quantity × unit_price` recomputed on every keystroke.
- **PO number preview** is advisory only ("PO-0004 — auto-assigned on save"); the server assigns the real number.

### 4.3 List screen (`/purchase-orders`)

- Title "Purchase Orders" + subtitle; primary **New Purchase Order** button → `/purchase-orders/new`.
- Search input (300 ms debounce) and status filter: All, Draft, Confirmed, Cancelled — both server-side.
- 4 summary cards: **Total Orders, Draft Orders, Confirmed Orders, Total Purchase Value** — computed from one unfiltered `limit=100` fetch (demo-scale assumption, documented).
- Table: PO Number · Vendor Name · PO Date · Status badge · Total Amount · Actions (View). Keeps existing server-side sort (reference/date/total) and Previous/Next pagination.
- Row click navigates to `/purchase-orders/[id]` (replaces the modal).
- States: loading spinner / empty / error / success.

### 4.4 New / Edit form (`/purchase-orders/new`, `/purchase-orders/[id]/edit`)

- Read-only PO number preview (new mode); fixed **Draft** status badge.
- Vendor: searchable dropdown (type-ahead over fetched vendors). PO Date: `date` input defaulting to today.
- Line-items table: Sr. No. · Product (dropdown shows name + cost; selecting auto-fills Unit Price from cost) · Purchase Account (dropdown of expense accounts, default "Purchase Expense") · Budget Analytics (dropdown of analytic accounts) · Quantity · Unit Price · Total (live) · Remove.
- **Add Line** button; Subtotal and Total Amount (equal — no tax); "Currency: INR ₹" label.
- **Budget warning:** group line subtotals by analytic; where a group exceeds that analytic's `remaining_amount`, show an amber "Exceeds Approved Budget" warning below the table naming the analytic(s) and remaining amount. Warning only — never blocks saving.
- Footer: **Cancel** (discards the form and navigates back — pure navigation, no status change) · **Save as Draft** (POST → detail) · **Confirm** (POST then PATCH confirm → confirmed detail). Edit mode: **Save Changes** (PUT) instead of the two create actions.
- Edit route is draft-only: confirmed/cancelled IDs redirect to the detail screen.

### 4.5 Detail screen (`/purchase-orders/[id]`)

- Header: PO number + status badge; meta grid: Vendor, PO Date, Status, and (confirmed only) **Confirmation timestamp** ("05 Sep 2026, 4:15 PM").
- Lines table: Sr · Product · Purchase Account · Budget Analytics (name resolved from analytics query, fallback "—") · Qty · Unit Price · Total; totals footer.
- Actions by status:
  - **Draft:** Confirm (primary, via existing `confirm-dialog`) · Edit · Cancel (destructive-outline, via confirm dialog) · Back.
  - **Confirmed:** Create Bill (disabled, caption "Next step: Vendor Bill") · Back.
  - **Cancelled:** Back only.
- States: loading / error / not-found ("Purchase order not found" + back link) / success.

### 4.6 Validation (client mirrors backend)

Vendor required · PO date required · ≥ 1 line · product required per line · quantity > 0 · unit price ≥ 0. Errors shown inline on submit attempt; submit disabled while a mutation is in flight. Only drafts show Confirm/Edit/Cancel — backend double-enforces.

### 4.7 Formatting helpers

- `formatINR(value)`: `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })`, trailing `.00` stripped → `₹5,000`, `₹12,500`.
- `formatDate` → `05 Sep 2026`; `formatDateTime` → `05 Sep 2026, 4:15 PM`.

## 5. Theme & navigation

- Light-first finance theme: soft gray page background, white cards, subtle borders, rounded corners, blue primary actions, compact readable tables — existing design language, tightened where needed. Dark mode keeps working.
- Sidebar restyled **dark navy** (light text, blue active item) in both modes.
- Nav order per brief: **Dashboard, Sales, Purchase Orders, Master Data, Journals, Reports**. "Sales" points to the existing `/sales-orders` route. Master Data / Journals / Reports are `#` placeholders (same convention as today's Bills/Payments, which are removed as dead links). Role filtering preserved; admin-only User Management and contact-only Portal Invoices remain.

## 6. Error handling

- API error envelope (`error.message`) surfaced inline: form banner, detail error state, list error state.
- 422 field errors mapped to form fields where keys match; otherwise a banner.
- Confirm/Cancel use the existing `confirm-dialog.tsx`; mutation failures show an inline error and keep the screen state.

## 7. Testing & verification

- **Backend:** extend `backend/tests/test_purchase_orders.py` — cancel happy path + non-draft rejection; edit replaces lines and recomputes total + confirmed rejection; confirm sets `confirmed_at`; analytics endpoint returns committed/remaining consistent with confirmed POs. `pytest` green.
- **Frontend:** `npm run lint`, `npx tsc --noEmit`, `next build --webpack` clean.
- **Browser golden path:** login → list shows the 3 seeded POs + correct cards → search/filter/sort/paginate → New → validation errors fire → product pick auto-fills price, totals live-update → force budget warning (large qty on Furniture Project) → Save as Draft → draft detail → Confirm → confirmed detail with timestamp + disabled Create Bill → edit a draft → cancel a draft → Cancelled badge → list reflects all statuses.
- **Docs:** tick new tasks in `docs/TASK_BOARD.md`; update statuses in `docs/frontend/LOGIC.md`.

## 8. Risks & notes

- PO number preview can race (two tabs creating simultaneously) — cosmetic only; server assigns the real number.
- Summary cards assume ≤ 100 POs (demo scale); noted in code.
- `docs/TASK_BOARD.md` had unresolved merge-conflict markers in the working tree; resolved by merging both "Last updated" notes under the later (5:07 PM) timestamp.
