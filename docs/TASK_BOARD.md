# Live Task Board — Sourabh + Kunal
## Urban Furniture Accounting System

This is the team's execution source of truth. Every task is atomic (15–60 mins) with clear ownership, acceptance criteria, and dependencies.

**How to use:** every task is a tickbox. When a task is done, tick it (`- [x]`) and move it to the **DONE** list at the top. Completed tasks always show on top. Within every section, tasks are grouped **Backend → Frontend → Integration**.

**Last updated:** 5 September 2026, 1:20 PM — Grouped by Backend → Frontend → Integration  
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

### Backend

- [x] **P0-BE-04** — Chart of Accounts & Journals seed + endpoints · Kunal · 5 Sep, 1:25 PM — Evidence: `tests/test_accounts_and_journals.py` PASSED (5 account types & 4 journals seeded and fetchable) · Integrated & Verified
- [x] **P0-BE-03** — Contact & Product models + CRUD endpoints · Kunal · 5 Sep, 12:45 PM — Evidence: `tests/test_contacts.py` & `test_products.py` PASSED · Integrated & Verified
- [x] **P0-BE-02** — User model + JWT Auth endpoints (register/login/me) · Kunal · 5 Sep, 11:35 AM — Evidence: `tests/test_auth.py` PASSED + live HTTP verified · Integrated & Verified
- [x] **P0-BE-01** — FastAPI scaffold + PostgreSQL setup · Kunal · 5 Sep, 11:25 AM — Evidence: `GET /health` returns 200 `connected` · Integrated & Verified

### Frontend

- [x] **P0-FE-02 (UI)** — `/login` + `/signup` built per spec — `src/features/auth/` (hooks/UI separated), route groups, no API wiring · Sourabh · 5 Sep, 12:45 PM — Evidence: browser-verified validation, strength meter, match badge, demo notices, dark mode; `npm run build` + lint clean · Integrated on `feat/auth`; AuthContext + API client deferred to P0-INT-01 prep
- [x] **A-05** — Auth pages design spec approved (UI-only, route groups) · Sourabh · 5 Sep, 12:00 PM — Evidence: `docs/superpowers/specs/2026-09-05-auth-pages-design.md` · Design locked
- [x] **P0-FE-01 (partial)** — Next.js 16 + Tailwind 4 + shadcn shell (sidebar/header/footer/theme) · Sourabh · 5 Sep, 11:50 AM — Evidence: `frontend/` dev server on `:3000`, home renders · Shell only — Query/Auth provider still open (tracked in NOW)

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

- [ ] **P0-FE-01 (remainder)** — Mount Query/Auth provider on the Next.js shell · Sourabh · Started 10:45 AM — Done when: Query/Auth provider mounted (app runs, Sidebar/Header render, theme active already done)

---

## NEXT — queued in priority order

### Frontend

- [ ] **P0-FE-02 (remainder)** — Auth Context + API client (~~Login/Signup UI~~ done) · Sourabh · 45m · Depends: P0-FE-01 — Done when: form submits credentials, saves token, handles 401/422 (`/login` + `/signup` render per spec ✓)

### Integration

- [ ] **P0-INT-01** — Integrate Auth handshake · Both · 15m · Depends: P0-BE-02, P0-FE-02 — Done when: user logs in from FE, navigates to dashboard

---

## BACKLOG — P0 Golden Path (Target: 7:00 PM Gate)

### Backend

- [ ] **P0-BE-05** — Purchase Order model & create/confirm endpoints · Kunal · 45m · Depends: P0-BE-03 — Contract: `POST /api/v1/purchase-orders` · Done when: PO created in draft, confirmed changes status
- [ ] **P0-BE-06** — Vendor Bill creation + auto Journal Entry logic · Kunal · 60m · Depends: P0-BE-05, P0-BE-04 — Contract: `POST /api/v1/purchase-orders/:id/create-bill` · Done when: bill created; balanced Journal Entry (Debit Expense / Credit AP)
- [ ] **P0-BE-07** — Payment endpoint + auto Journal Entry (Outbound) · Kunal · 45m · Depends: P0-BE-06 — Contract: `POST /api/v1/payments` · Done when: bill status updated to paid; Debit AP / Credit Bank or Cash
- [ ] **P0-BE-08** — Sales Order model & create/confirm endpoints · Kunal · 45m · Depends: P0-BE-03 — Contract: `POST /api/v1/sales-orders` · Done when: SO created in draft, confirmed changes status
- [ ] **P0-BE-09** — Customer Invoice creation + auto Journal Entry logic · Kunal · 60m · Depends: P0-BE-08, P0-BE-04 — Contract: `POST /api/v1/sales-orders/:id/create-invoice` · Done when: invoice created; balanced Journal Entry (Debit AR / Credit Sales + Tax)
- [ ] **P0-BE-10** — Payment endpoint + auto Journal Entry (Inbound) · Kunal · 45m · Depends: P0-BE-09 — Contract: `POST /api/v1/payments` · Done when: invoice marked paid; Debit Cash/Bank / Credit AR
- [ ] **P0-BE-11** — Journal Entries list endpoint + balance checks · Kunal · 30m · Depends: P0-BE-06, P0-BE-09 — Contract: `GET /api/v1/journal-entries` · Done when: returns all entries with items; asserts debit == credit
- [ ] **P0-BE-12** — Balance Sheet & Profit & Loss report queries · Kunal · 60m · Depends: P0-BE-11 — Contract: `GET /api/v1/reports/*` · Done when: real-time aggregate by account type; Net Profit computed
- [ ] **P0-BE-13** — Deterministic demo seed script (`seed.py`) · Kunal · 45m · Depends: all BE models — Done when: seeds Azure Furniture, Nimesh Pathak, chairs, ready for demo

### Frontend

- [ ] **P0-FE-04** — Chart of Accounts hierarchical view · Sourabh · 30m · Depends: P0-FE-01 — Contract: `GET /api/v1/accounts` · Done when: displays Asset, Liability, Capital, Income, Expense
- [ ] **P0-FE-05** — Purchase Order creation form & list table · Sourabh · 45m · Depends: P0-FE-03 — Contract: `POST /api/v1/purchase-orders` · Done when: line items addable, subtotal calculated live
- [ ] **P0-FE-06** — PO Detail: status tracking + "Convert to Bill" action · Sourabh · 45m · Depends: P0-FE-05 — Contract: PO endpoints · Done when: status badges update, bill created on click
- [ ] **P0-FE-07** — Bill Payment modal/form + status update · Sourabh · 30m · Depends: P0-FE-06 — Contract: `POST /api/v1/payments` · Done when: records payment, disables repeat payment
- [ ] **P0-FE-08** — Sales Order creation form & list table · Sourabh · 45m · Depends: P0-FE-03 — Contract: `POST /api/v1/sales-orders` · Done when: product selection, quantity, tax auto-computed
- [ ] **P0-FE-09** — SO Detail: status tracking + "Generate Invoice" action · Sourabh · 45m · Depends: P0-FE-08 — Contract: SO endpoints · Done when: invoice generated, viewable with line breakdowns
- [ ] **P0-FE-10** — Customer Invoice Payment modal/action · Sourabh · 30m · Depends: P0-FE-09 — Contract: `POST /api/v1/payments` · Done when: payment registered, balance sheet updated
- [ ] **P0-FE-11** — Journal Entries list & inspection table · Sourabh · 30m · Depends: P0-FE-01 — Contract: `GET /api/v1/journal-entries` · Done when: clean double-entry debit/credit ledger table
- [ ] **P0-FE-12** — Balance Sheet & P&L report presentation pages · Sourabh · 45m · Depends: P0-FE-01 — Contract: `GET /api/v1/reports/*` · Done when: clean financial statement layouts with totals

### Integration

- [ ] **P0-INT-02** — Verify Purchase Vertical Slice end-to-end · Both · 30m · Depends: P0-BE-07, P0-FE-07 — Contract: PO → Bill → Payment · Done when: PO creates, bill opens, payment clears, ledger balanced
- [ ] **P0-INT-03** — Verify Sales Vertical Slice end-to-end · Both · 30m · Depends: P0-BE-10, P0-FE-10 — Contract: SO → Invoice → Payment · Done when: SO creates, invoice generates, payment clears, ledger balanced
- [ ] **P0-INT-04** — Full Golden-Path Dry Run & 7:00 PM Commit Tag · Both · 45m · Depends: P0-BE-12, P0-FE-12 — Contract: complete E2E · Done when: 3-minute golden-path demo passes without errors

---

## BACKLOG — P1 (7:00–10:00 PM)

### Backend

- [ ] **P1-BE-01** — Analytic Account & Budget models + endpoints · Kunal · 60m · Depends: P0-BE-12 — Done when: create budget, compute planned vs actual from entries
- [ ] **P1-BE-02** — Contact Portal endpoints (role-filtered by contact_id) · Kunal · 45m · Depends: P0-BE-02 — Done when: contact role can only query their own invoices/bills

### Frontend

- [ ] **P1-FE-01** — Budget setup form & Budget Report page · Sourabh · 60m · Depends: P0-FE-12 — Done when: visual planned vs actual progress/utilization
- [ ] **P1-FE-02** — Contact Portal restricted view & payment trigger · Sourabh · 45m · Depends: P0-FE-02 — Done when: contact logs in, sees isolated invoices, can click pay

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
