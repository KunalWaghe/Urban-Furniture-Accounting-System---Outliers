# Live Task Board — Sourabh + Kunal
## Urban Furniture Accounting System

This is the team's execution source of truth. Every task is atomic (15–60 mins) with clear ownership, acceptance criteria, and dependencies.

**How to use:** every task is a tickbox. When a task is done, tick it (`- [x]`) and move it to the **DONE** list at the top. Completed tasks always show on top. Within every section, tasks are grouped **Backend → Frontend → Integration**.

**Last updated:** 5 September 2026, 2:05 PM — Excalidraw requirements reconciled; email-based auth baseline reopened for `loginId` correction
**Current phase/gate:** 10:00 AM — Foundation & First Vertical Slice  
**Stable URL:** http://localhost:3000 (dev)  
**Stable commit/tag:** `a03511e` on `feat/auth`  

---

## Board Rules

1. One task per person in **NOW**. Do not start a third stream.
2. A task should take 15–60 minutes; split anything estimated above 90 minutes.
3. P0 blockers and integration always outrank P1 and Bonus.
4. Frontend works from the locked API contract; backend implements the same contract.
5. A task is **DONE** only with evidence: commit, test result, endpoint response, or verified UI.
6. If blocked for 10 minutes, switch to the agreed mock/adapter or the next unblocked task.
7. Contract, schema, auth, migration, and deployment changes require a sync and doc update.
8. Update this board at each task completion, hourly sync, and integration gate — tick the box and move the task to **DONE** (top of board, newest first within its group).

---

## Status Legend

- `- [x]` — **DONE**: integrated and supported by evidence; lives in the DONE list at the top.
- `- [ ]` — open; the section it sits in gives its status:
  - `NOW` — actively being worked on (max 1 per person).
  - `NEXT` / `BACKLOG` — queued in priority order.
  - `IN REVIEW` — implementation complete; awaiting teammate review/integration.
  - `BLOCKED` — cannot progress; blocker and fallback must be recorded.
  - `CUT` — deliberately removed from event scope with a reason.

---

## DONE — completed (newest first within each group)

### Integration

- [x] **P0-INT-01** — Integrate Auth handshake and role gates · Both · 5 Sep, 4:00 PM — Evidence: Full live handshake script `test_live_handshake.py` verified; public signup strictly creates `invoicing_user` (Accountant) with privilege escalation protection (422); Admin `/admin/users` route protected with `RequireRole` (403 Access Denied UI for non-admin, badge & sidebar role filtering); logout clears session completely and redirects to `/login`; Next.js production build and FastAPI tests green · Integrated & Verified

### Backend

- [x] **P0-BE-05** — Purchase Order model & create/confirm endpoints · Kunal · 5 Sep, 4:05 PM — Evidence: `tests/test_purchase_order.py` PASSED (2/2 lifecycle & validation tests passed, sequential PO-0001 generation, line items, status draft -> confirmed) · Integrated & Verified
- [x] **P0-BE-02R** — Auth identity and role contract correction · Kunal · 5 Sep, 3:40 PM — Evidence: `tests/test_auth.py` PASSED (5/5 auth tests: login_id 6–12 chars, unique email/login_id, password policy, Invalid Login Id or Password error msg, role rules) · Integrated & Verified

- [x] **P0-BE-02R** — Auth identity and role contract correction · Kunal · 5 Sep, 3:45 PM — Evidence: `tests/test_auth.py` PASSED (3/3 auth tests, 9/9 backend suite); public registration strictly creates `invoicing_user`; privilege escalation to admin rejected with 422; Admin user creation protected via `POST /api/v1/users` (403 for non-admins, 201 for admin); login uses `login_id` with 401 "Invalid Login Id or Password" · Integrated & Verified
- [x] **P0-BE-04** — Chart of Accounts & Journals seed + endpoints · Kunal · 5 Sep, 1:25 PM — Evidence: `tests/test_accounts_and_journals.py` PASSED (5 account types & 4 journals seeded and fetchable) · Integrated & Verified
- [x] **P0-BE-03** — Contact & Product models + CRUD endpoints · Kunal · 5 Sep, 12:45 PM — Evidence: `tests/test_contacts.py` & `test_products.py` PASSED · Integrated & Verified
- [x] **P0-BE-02 (baseline)** — User model + JWT Auth endpoints (email-based register/login/me) · Kunal · 5 Sep, 11:35 AM — Evidence: `tests/test_auth.py` PASSED + live HTTP verified · Baseline only; superseded by Excalidraw auth contract correction below
- [x] **P0-BE-01** — FastAPI scaffold + PostgreSQL setup · Kunal · 5 Sep, 11:25 AM — Evidence: `GET /health` returns 200 `connected` · Integrated & Verified

### Frontend

- [x] **P0-FE-02R** — Correct auth UI and wire API · Sourabh · 5 Sep, 3:50 PM — Evidence: `loginId` implemented with 6–12 char regex validation; role selection removed from public signup; exact 401/409 error mappings (`Invalid Login Id or Password`, `LOGIN_ID_ALREADY_EXISTS`, `EMAIL_ALREADY_EXISTS`); `npm run lint` & `npm run build` clean (0 errors, 0 warnings) · Integrated & Verified
- [x] **P0-FE-01** — Next.js 16 + Tailwind 4 + shadcn shell + QueryProvider + AuthProvider · Sourabh · 5 Sep, 1:35 PM — Evidence: `@tanstack/react-query@5.80.7` installed; `QueryProvider` + `AuthProvider` mounted via `AppProviders` in root layout (ThemeProvider › QueryProvider › AuthProvider); `npm run build` clean — TypeScript OK, 4 routes static-prerendered, 0 errors · Integrated & Verified
- [x] **P0-FE-02 (baseline UI)** — `/login` + `/signup` built with email field and UI-only wiring · Sourabh · 5 Sep, 12:45 PM — Evidence: browser-verified validation, strength meter, match badge, demo notices, dark mode; `npm run build` + lint clean · Baseline only; must be corrected to Excalidraw `loginId` contract
- [x] **A-05** — Auth pages design spec approved (UI-only, route groups) · Sourabh · 5 Sep, 12:00 PM — Evidence: `docs/superpowers/specs/2026-09-05-auth-pages-design.md` · Design locked

### Team

- [x] **A-04** — Locked Frontend & Backend Architecture ADRs, Logic & Screen Inventory · Both · 5 Sep, 10:45 AM — Evidence: `docs/frontend/ARCHITECTURE_DECISIONS.md`, `docs/frontend/LOGIC.md` · Architecture locked
- [x] **A-03** — Locked atomic task board with P0/P1/Bonus splits · Both · 5 Sep, 10:20 AM — Evidence: `docs/TASK_BOARD.md` · Task board locked
- [x] **A-02** — Completed full Analysis-Hour deliverable & API Contract · Both · 5 Sep, 10:05 AM — Evidence: `brain/.../analysis_hour_deliverable.md` · Architecture locked
- [x] **A-01** — Evaluated 3 problem statements; selected Urban Furniture (85% feasibility) · Both · 5 Sep, 10:00 AM — Evidence: `docs/PROBLEM_SELECTION.md` · Decision artifact

---

## NOW — maximum two rows (one per owner)

### Backend

- [ ] **P0-BE-05** — Purchase Order model & create/confirm endpoints · Kunal · 45m · Depends: P0-BE-03 · Started 1:25 PM — Contract: `POST/GET /api/v1/purchase-orders`, `PATCH /confirm` · Done when: PO created in draft, confirmed changes status

### Frontend

- [ ] **P0-FE-05** — Purchase Order UI & create/confirm flow · Sourabh · 45m · Depends: P0-BE-05 · Start purchase workflow wiring with vendor selection & backend PO models

---

## NEXT — queued in priority order

### Backend

- [ ] **P0-BE-06** — Vendor Bill creation + auto Journal Entry logic · Kunal · 60m · Depends: P0-BE-05, P0-BE-04 — Contract: `POST /api/v1/purchase-orders/:id/create-bill` · Done when: bill created; balanced Journal Entry (Debit Expense / Credit AP)

### Frontend

- [ ] **P0-FE-06** — Vendor Bill UI & payment status · Sourabh · 45m · Depends: P0-BE-06

---

## BACKLOG — P0 Golden Path (Target: 7:00 PM Gate)

### Backend

- [ ] **P0-BE-03R** — Contact/Product Excalidraw fields + category support · Kunal · 45m · Depends: P0-BE-03 · Add contact profile image/phone parity and product type (`goods|service|combo`), category, sales price, cost price, and optional image; support inline category creation · Done when: corrected schemas/tests expose the fields without breaking baseline CRUD
- [ ] **P0-BE-04** — Chart of Accounts, Journals & Analytic Account seed/list endpoints · Kunal · 45m · Depends: P0-BE-01 · Contract: `GET /api/v1/accounts`, `GET /api/v1/journals`, `GET /api/v1/analytic-accounts` · Done when: fixed account types, 4 journals, and Income/Expense analytics are seeded and fetchable
- [ ] **P0-BE-05** — Purchase Order model & create/confirm endpoints · Kunal · 45m · Depends: P0-BE-03R, P0-BE-04 — Contract: `POST /api/v1/purchase-orders` · Done when: PO created in draft, confirmed changes status, and lines retain account/expense-analytic references
- [ ] **P0-BE-06** — Vendor Bill creation + auto Journal Entry logic · Kunal · 60m · Depends: P0-BE-05, P0-BE-04 — Contract: `POST /api/v1/purchase-orders/:id/create-bill` · Done when: bill created; balanced Journal Entry (Debit Expense / Credit AP)
- [ ] **P0-BE-07** — Payment endpoint + auto Journal Entry (Outbound) · Kunal · 45m · Depends: P0-BE-06 — Contract: `POST /api/v1/payments` · Done when: bill status updated to paid; Debit AP / Credit Bank or Cash
- [ ] **P0-BE-08** — Sales Order model & create/confirm endpoints · Kunal · 45m · Depends: P0-BE-03R, P0-BE-04 — Contract: `POST /api/v1/sales-orders` · Done when: SO created in draft, confirmed changes status, and lines retain account/income-analytic references
- [ ] **P0-BE-09** — Customer Invoice creation + auto Journal Entry logic · Kunal · 60m · Depends: P0-BE-08, P0-BE-04 — Contract: `POST /api/v1/sales-orders/:id/create-invoice` · Done when: invoice created; balanced Journal Entry (Debit AR / Credit Sales + Tax)
- [ ] **P0-BE-10** — Payment endpoint + auto Journal Entry (Inbound) · Kunal · 45m · Depends: P0-BE-09 — Contract: `POST /api/v1/payments` · Done when: invoice marked paid; Debit Cash/Bank / Credit AR
- [ ] **P0-BE-11** — Journal Entries create/list endpoint + balance checks · Kunal · 45m · Depends: P0-BE-06, P0-BE-09 — Contract: `POST/GET /api/v1/journal-entries` · Done when: manual entries accept Journal, Date, Partner, Account, Debit, Credit and every saved entry asserts debit == credit
- [ ] **P0-BE-12** — Balance Sheet & Profit & Loss report queries · Kunal · 60m · Depends: P0-BE-11 — Contract: `GET /api/v1/reports/*` · Done when: real-time aggregate by account type; Net Profit computed
- [ ] **P0-BE-13** — Deterministic demo seed script (`seed.py`) · Kunal · 45m · Depends: all BE models — Done when: seeds Azure Furniture, Nimesh Pathak, chairs, ready for demo

### Frontend

- [ ] **P0-FE-03** — Dashboard shell + module navigation · Sourabh · 30m · Depends: P0-INT-01 · Done when: authenticated user sees Sales, Purchase, Accounting, Reports, and Master Data navigation with route visibility by role
- [ ] **P0-FE-04** — Master-data list/form views for Contacts and Products · Sourabh · 60m · Depends: P0-BE-03R, P0-INT-01 · Done when: list is the default, New opens a blank form, saved rows open in edit form, and Contact/Product can toggle list ↔ kanban; archived records are visibly inactive
- [ ] **P0-FE-05** — Chart of Accounts hierarchical view · Sourabh · 30m · Depends: P0-BE-04 · Contract: `GET /api/v1/accounts` · Done when: displays Asset, Liability, Bank, Cash, Capital, Income, Expense, Other Expense and default accounts
- [ ] **P0-FE-06** — Purchase Order creation form & list table · Sourabh · 45m · Depends: P0-FE-03, P0-FE-04 — Contract: `POST /api/v1/purchase-orders` · Done when: line items include Product, Purchase Account, Budget Analytic, quantity, unit price; subtotal calculates live
- [ ] **P0-FE-07** — PO Detail: status tracking + "Convert to Bill" action · Sourabh · 45m · Depends: P0-FE-06 — Contract: PO endpoints · Done when: status badges update, bill created on click
- [ ] **P0-FE-08** — Bill Payment modal/form + status update · Sourabh · 30m · Depends: P0-FE-07 — Contract: `POST /api/v1/payments` · Done when: records payment, disables repeat payment
- [ ] **P0-FE-09** — Sales Order creation form & list table · Sourabh · 45m · Depends: P0-FE-03, P0-FE-04 — Contract: `POST /api/v1/sales-orders` · Done when: product selection, Sales Account and Budget Analytic are selectable, quantity and tax auto-compute
- [ ] **P0-FE-10** — SO Detail: status tracking + "Generate Invoice" action · Sourabh · 45m · Depends: P0-FE-09 — Contract: SO endpoints · Done when: invoice generated, viewable with line breakdowns
- [ ] **P0-FE-11** — Customer Invoice Payment modal/action · Sourabh · 30m · Depends: P0-FE-10 — Contract: `POST /api/v1/payments` · Done when: payment registered via Cash/Bank, balance updates, repeat payment is disabled
- [ ] **P0-FE-12** — Journal Entries list/form + balance warning · Sourabh · 45m · Depends: P0-BE-04 — Contract: `GET /api/v1/journal-entries` · Done when: new entry supports Journal, Accounting Date, Account, Partner, Debit, Credit and blocks mismatched totals
- [ ] **P0-FE-13** — Balance Sheet & P&L report presentation pages · Sourabh · 45m · Depends: P0-BE-12 — Contract: `GET /api/v1/reports/*` · Done when: Balance Sheet shows Assets, Liabilities, Capital with equation check; P&L shows Income, Expenses, Net Income
- [ ] **P0-FE-14** — Forgot-password screen and auth navigation · Sourabh · 30m · Depends: P0-FE-02R · Done when: Login link opens `/forgot-password`, email/login ID can be submitted, and reset availability is clearly reported without pretending delivery occurred

### Integration

- [ ] **P0-INT-02** — Verify Purchase Vertical Slice end-to-end · Both · 30m · Depends: P0-BE-07, P0-FE-07 — Contract: PO → Bill → Payment · Done when: PO creates, bill opens, payment clears, ledger balanced
- [ ] **P0-INT-03** — Verify Sales Vertical Slice end-to-end · Both · 30m · Depends: P0-BE-10, P0-FE-10 — Contract: SO → Invoice → Payment · Done when: SO creates, invoice generates, payment clears, ledger balanced
- [ ] **P0-INT-04** — Full Golden-Path Dry Run & 7:00 PM Commit Tag · Both · 45m · Depends: P0-BE-12, P0-FE-12 — Contract: complete E2E · Done when: 3-minute golden-path demo passes without errors

---

## BACKLOG — P1 (7:00–10:00 PM)

### Backend

- [ ] **P1-BE-01** — Analytic Account & Budget models + endpoints · Kunal · 75m · Depends: P0-BE-12 — Done when: create/list analytic accounts and budgets, map Income analytics to invoice lines and Expense analytics to PO/Bill lines, compute planned vs actual, and support Confirm → Revise → Cancelled with original/revised links
- [ ] **P1-BE-02** — Contact Portal and Admin-created User endpoints · Kunal · 60m · Depends: P0-BE-02R — Done when: Admin can create a User/Contact login linked to `contact_id`, and portal queries/payments are restricted to that contact's own invoices/bills

### Frontend

- [ ] **P1-FE-01** — Analytic/Budget master views & Budget Report page · Sourabh · 75m · Depends: P1-BE-01 — Done when: list/form/kanban views expose budget period, responsible contact, analytic type, committed, achieved, achieved %, amount to achieve, and clicking achieved opens matching invoices/bills
- [ ] **P1-FE-02** — Contact Portal restricted view & payment trigger · Sourabh · 45m · Depends: P1-BE-02 — Done when: User/Contact logs in, sees only their own paid/unpaid invoices/bills, and can pay via Cash/Bank without admin navigation

### Integration

- [ ] **P1-INT-01** — Verify Budget Flow end-to-end · Both · 30m · Depends: P1-BE-01, P1-FE-01 — Done when: budget reflects actual expenses accurately
- [ ] **P1-INT-02** — Verify Contact Portal end-to-end · Both · 30m · Depends: P1-BE-02, P1-FE-02 — Done when: customer pays invoice from portal, status reflects in admin

---

## BACKLOG — Optional Bonus (Post-Midnight)

### Backend

- [ ] **BONUS-03** — In-memory query caching / PDF invoice export · Kunal · 45m · Depends: P0-BE-12 — Done when: download PDF copy of confirmed invoice/bill

### Frontend

- [ ] **BONUS-02** — Dashboard summary KPI cards (Receivables, Payables, Net Profit) · Sourabh · 45m · Depends: P0-FE-12 — Done when: at-a-glance financial health metrics on home screen

### Integration

- [ ] **BONUS-01** — Date period filters on reports · Both · 45m · Depends: P0-BE-12 — Done when: date picker filters report calculations

---

## IN REVIEW / INTEGRATION

_None right now._

Entry format: `- [ ] **ID** — task · Owner · Reviewer · branch/commit — needs: <verification> · deadline: <time>`

---

## BLOCKED

_None right now._

Entry format: `- [ ] **ID** — task · Owner · blocked since <time> — blocker: <exact blocker> · asked from: <person> · fallback: <parallel task> · decision deadline: <time>`

---

## Hourly Two-Minute Sync

Each person answers only these questions:
1. What did I finish, and what proves it?
2. What is my one current task and its completion time?
3. What changed in the contract/schema/UI assumptions?
4. Am I blocked or likely to block my teammate in the next hour?

Then tick finished tasks, move them to **DONE** (top), and update **NOW**, **NEXT**, and **BLOCKED**.
