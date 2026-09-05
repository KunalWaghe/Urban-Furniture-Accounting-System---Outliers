# Live Task Board — Sourabh + Kunal
## Urban Furniture Accounting System

This is the team's execution source of truth. Every task is atomic (15–60 mins) with clear ownership, acceptance criteria, and dependencies.

**Last updated:** 5 September 2026 — Task Board Locked  
**Current phase/gate:** 10:00 AM — Foundation & First Vertical Slice  
**Stable URL:** Not available  
**Stable commit/tag:** Not available  

---

## Board Rules

1. One task per person in **NOW**. Do not start a third stream.
2. A task should take 15–60 minutes; split anything estimated above 90 minutes.
3. P0 blockers and integration always outrank P1 and Bonus.
4. Frontend works from the locked API contract; backend implements the same contract.
5. A task is **DONE** only with evidence: commit, test result, endpoint response, or verified UI.
6. If blocked for 10 minutes, switch to the agreed mock/adapter or the next unblocked task.
7. Contract, schema, auth, migration, and deployment changes require a sync and doc update.
8. Update this board at each task completion, hourly sync, and integration gate.

---

## Status Legend

- `READY` — unblocked and acceptance condition is clear.
- `NOW` — actively being worked on (max 1 per person).
- `REVIEW` — implementation complete; awaiting teammate review/integration.
- `BLOCKED` — cannot progress; blocker and fallback must be recorded.
- `DONE` — integrated and supported by evidence.
- `CUT` — deliberately removed from event scope with a reason.

---

## NOW — maximum two rows (one per owner)

| ID | Pri | Owner | Task | Est. | Depends on | Contract | Acceptance Condition | Started |
|---|---|---|---|---:|---|---|---|---|
| P0-FE-01 | P0 | Sourabh | Next.js setup + Tailwind + shadcn shell | 30m | None | — | App runs, Navbar/Sidebar renders, theme active | — |
| P0-BE-03 | P0 | Kunal | Contact & Product models + CRUD endpoints | 45m | P0-BE-02 | `GET/POST /api/v1/contacts`, `GET/POST /api/v1/products` | GET/POST contacts & products with validation | 11:35 AM |

---

## NEXT — queued in priority order

| Order | ID | Pri | Owner | Task | Est. | Depends on | Acceptance Condition |
|---:|---|---|---|---|---:|---|---|
| 1 | P0-FE-02 | P0 | Sourabh | Login/Register UI + Auth Context + API client | 45m | P0-FE-01 | Form submits credentials, saves token, handles 401/422 |
| 2 | P0-INT-01 | P0 | Both | Integrate Auth handshake | 15m | P0-BE-02, P0-FE-02 | User logs in from FE, navigates to dashboard |
| 3 | P0-BE-04 | P0 | Kunal | Chart of Accounts & Journals seed + endpoints | 30m | P0-BE-01 | 5 account types & 4 journals seeded and fetchable |

---

## BACKLOG — P0 Golden Path (Target: 7:00 PM Gate)

| ID | Pri | Owner | Task | Est. | Depends on | Contract | Acceptance Condition |
|---|---|---|---|---:|---|---|---|
| P0-FE-04 | P0 | Sourabh | Chart of Accounts hierarchical view | 30m | P0-FE-01 | `GET /api/v1/accounts` | Displays Asset, Liability, Capital, Income, Expense |
| P0-BE-05 | P0 | Kunal | Purchase Order model & create/confirm endpoints | 45m | P0-BE-03 | `POST /api/v1/purchase-orders` | PO created in draft, confirmed changes status |
| P0-FE-05 | P0 | Sourabh | Purchase Order creation form & list table | 45m | P0-FE-03 | `POST /api/v1/purchase-orders` | Line items addable, subtotal calculated live |
| P0-BE-06 | P0 | Kunal | Vendor Bill creation + auto Journal Entry logic | 60m | P0-BE-05, P0-BE-04 | `POST /api/v1/purchase-orders/:id/create-bill` | Bill created; balanced Journal Entry (Debit Expense / Credit AP) |
| P0-FE-06 | P0 | Sourabh | PO Detail: status tracking + "Convert to Bill" action | 45m | P0-FE-05 | PO endpoints | Status badges update, bill created on click |
| P0-BE-07 | P0 | Kunal | Payment endpoint + auto Journal Entry (Outbound) | 45m | P0-BE-06 | `POST /api/v1/payments` | Bill status updated to paid; Debit AP / Credit Bank or Cash |
| P0-FE-07 | P0 | Sourabh | Bill Payment modal/form + status update | 30m | P0-FE-06 | `POST /api/v1/payments` | Records payment, disables repeat payment |
| P0-INT-02 | P0 | Both | Verify Purchase Vertical Slice end-to-end | 30m | P0-BE-07, P0-FE-07 | PO → Bill → Payment | PO creates, bill opens, payment clears, ledger balanced |
| P0-BE-08 | P0 | Kunal | Sales Order model & create/confirm endpoints | 45m | P0-BE-03 | `POST /api/v1/sales-orders` | SO created in draft, confirmed changes status |
| P0-FE-08 | P0 | Sourabh | Sales Order creation form & list table | 45m | P0-FE-03 | `POST /api/v1/sales-orders` | Product selection, quantity, tax auto-computed |
| P0-BE-09 | P0 | Kunal | Customer Invoice creation + auto Journal Entry logic | 60m | P0-BE-08, P0-BE-04 | `POST /api/v1/sales-orders/:id/create-invoice` | Invoice created; balanced Journal Entry (Debit AR / Credit Sales + Tax) |
| P0-FE-09 | P0 | Sourabh | SO Detail: status tracking + "Generate Invoice" action | 45m | P0-FE-08 | SO endpoints | Invoice generated, viewable with line breakdowns |
| P0-BE-10 | P0 | Kunal | Payment endpoint + auto Journal Entry (Inbound) | 45m | P0-BE-09 | `POST /api/v1/payments` | Invoice marked paid; Debit Cash/Bank / Credit AR |
| P0-FE-10 | P0 | Sourabh | Customer Invoice Payment modal/action | 30m | P0-FE-09 | `POST /api/v1/payments` | Payment registered, balance sheet updated |
| P0-INT-03 | P0 | Both | Verify Sales Vertical Slice end-to-end | 30m | P0-BE-10, P0-FE-10 | SO → Invoice → Payment | SO creates, invoice generates, payment clears, ledger balanced |
| P0-BE-11 | P0 | Kunal | Journal Entries list endpoint + balance checks | 30m | P0-BE-06, P0-BE-09 | `GET /api/v1/journal-entries` | Returns all entries with items; asserts debit == credit |
| P0-FE-11 | P0 | Sourabh | Journal Entries list & inspection table | 30m | P0-FE-01 | `GET /api/v1/journal-entries` | Clean double-entry debit/credit ledger table |
| P0-BE-12 | P0 | Kunal | Balance Sheet & Profit & Loss report queries | 60m | P0-BE-11 | `GET /api/v1/reports/*` | Real-time aggregate by account type; Net Profit computed |
| P0-FE-12 | P0 | Sourabh | Balance Sheet & P&L report presentation pages | 45m | P0-FE-01 | `GET /api/v1/reports/*` | Clean financial statement layouts with totals |
| P0-BE-13 | P0 | Kunal | Deterministic demo seed script (`seed.py`) | 45m | All BE models | — | Seeds Azure Furniture, Nimesh Pathak, chairs, ready for demo |
| P0-INT-04 | P0 | Both | Full Golden-Path Dry Run & 7:00 PM Commit Tag | 45m | P0-BE-12, P0-FE-12 | Complete E2E | 3-minute golden-path demo passes without errors |

---

## BACKLOG — P1 (7:00–10:00 PM)

| ID | Pri | Owner | Task | Est. | Depends on | Acceptance Condition |
|---|---|---|---|---:|---|---|
| P1-BE-01 | P1 | Kunal | Analytic Account & Budget models + endpoints | 60m | P0-BE-12 | Create budget, compute planned vs actual from entries |
| P1-FE-01 | P1 | Sourabh | Budget setup form & Budget Report page | 60m | P0-FE-12 | Visual planned vs actual progress/utilization |
| P1-INT-01 | P1 | Both | Verify Budget Flow end-to-end | 30m | P1-BE-01, P1-FE-01 | Budget reflects actual expenses accurately |
| P1-BE-02 | P1 | Kunal | Contact Portal endpoints (role-filtered by contact_id) | 45m | P0-BE-02 | Contact role can only query their own invoices/bills |
| P1-FE-02 | P1 | Sourabh | Contact Portal restricted view & payment trigger | 45m | P0-FE-02 | Contact logs in, sees isolated invoices, can click pay |
| P1-INT-02 | P1 | Both | Verify Contact Portal end-to-end | 30m | P1-BE-02, P1-FE-02 | Customer pays invoice from portal, status reflects in admin |

---

## BACKLOG — Optional Bonus (Post-Midnight)

| ID | Pri | Owner | Task | Est. | Depends on | Acceptance Condition |
|---|---|---|---|---:|---|---|
| BONUS-01 | Bonus | Both | Date period filters on reports | 45m | P0-BE-12 | Date picker filters report calculations |
| BONUS-02 | Bonus | Sourabh | Dashboard summary KPI cards (Receivables, Payables, Net Profit) | 45m | P0-FE-12 | At-a-glance financial health metrics on home screen |
| BONUS-03 | Bonus | Kunal | In-memory query caching / PDF invoice export | 45m | P0-BE-12 | Download PDF copy of confirmed invoice/bill |

---

## IN REVIEW / INTEGRATION

| ID | Owner | Reviewer | Branch/Commit | Verification Needed | Deadline |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

---

## BLOCKED

| ID | Owner | Blocked Since | Exact Blocker | Asked From | Fallback / Parallel Task | Decision Deadline |
|---|---|---|---|---|---|---|
| — | — | — | None | — | — | — |

---

## DONE — evidence required

| Finished | ID | Owner | Result | Evidence | Integrated / Deployed? |
|---|---|---|---|---|---:|
| 5 Sep, 10:00 AM | A-01 | Both | Evaluated 3 problem statements; selected Urban Furniture (85% feasibility) | `docs/PROBLEM_SELECTION.md` | Decision artifact |
| 5 Sep, 10:05 AM | A-02 | Both | Completed full Analysis-Hour deliverable & API Contract | `brain/.../analysis_hour_deliverable.md` | Architecture locked |
| 5 Sep, 10:20 AM | A-03 | Both | Locked atomic task board with P0/P1/Bonus splits | `docs/TASK_BOARD.md` | Task board locked |
| 5 Sep, 11:25 AM | P0-BE-01 | Kunal | FastAPI scaffold + PostgreSQL setup | `GET /health` returns 200 `connected` | Integrated & Verified |
| 5 Sep, 11:35 AM | P0-BE-02 | Kunal | User model + JWT Auth endpoints (register/login/me) | `tests/test_auth.py` PASSED + Live HTTP verified | Integrated & Verified |

---

## Hourly Two-Minute Sync

Each person answers only these questions:
1. What did I finish, and what proves it?
2. What is my one current task and its completion time?
3. What changed in the contract/schema/UI assumptions?
4. Am I blocked or likely to block my teammate in the next hour?

Then update **NOW**, **NEXT**, and **BLOCKED**.
