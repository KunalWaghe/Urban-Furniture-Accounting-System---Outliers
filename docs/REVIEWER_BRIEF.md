# Reviewer Brief — Live Status
## Urban Furniture Accounting System

> Update at every phase gate. Keep this file factual and short enough to explain in five minutes.

**Last updated:** 5 September 2026, 2:05 PM
**Current gate:** Excalidraw requirements reconciled; Auth correction before integration
**Stable deployment:** Local Dev Environment (FastAPI + PostgreSQL / Next.js)
**Stable commit/tag:** `a03511e` on `feat/auth` (baseline; email-based auth is not final)

## Current clarification

The authoritative UI addendum is `excalidraw-board.png`. Login now uses a unique 6–12 character `login_id`; email remains separately unique. Public Sign Up creates only an Accountant (`invoicing_user`), while Admin creates Admin/Accountant/User accounts and links User accounts to a Contact. The current email-based auth implementation is recorded as a completed baseline and is reopened as `P0-BE-02R` + `P0-FE-02R` in [`docs/TASK_BOARD.md`](docs/TASK_BOARD.md).

---
**Last updated:** 5 September 2026 — 10:20 AM  
**Current gate:** Foundation & Architecture Lock (Phase 1 Complete)  
**Stable deployment:** Local Dev Environment (FastAPI + PostgreSQL / Next.js)  
**Stable commit/tag:** `foundation-lock-v1.0`

## Problem → User → Promise

**Problem:** Mid-sized businesses like Urban Furniture struggle with fragmented tools for sales, purchasing, and billing, resulting in manual double-entry ledger errors, delayed payments, and unverified financial statements.  
**Primary user:** Admin (Business Owner) & Invoicing User (Accountant). Secondary: Contact users (Customers/Vendors).  
**Our promise:** A seamless accounting engine where standard business actions (PO → Vendor Bill, SO → Customer Invoice, Payments) automatically generate balanced double-entry journal entries with zero reconciliation lag and real-time Balance Sheet & P&L generation.  
**Why this matters:** Eradicates manual bookkeeping discrepancies, enforces mathematical accounting invariants, and provides instantaneous visibility into company cash flow and profitability.

---
**Problem:** Fragmentation and manual tracking in furniture accounting — lack of automated double-entry journal creation, unverified ledger balance, and delayed financial reporting.  
**Primary User:** Accountant (Invoicing User) & Business Owner (Admin) at Urban Furniture.  
**Our promise:** A seamless accounting system where every PO/SO transaction automatically creates balanced double-entry journal entries, providing real-time, accurate Balance Sheet, P&L, and Budget reports.  
**Why this matters:** Ensures zero-error bookkeeping, satisfies $\text{Assets} = \text{Liabilities} + \text{Capital}$ automatically, and gives immediate visibility into business profitability.

## Golden Demo Path

1. **Auth & Setup:** Login as Admin; inspect master data (Vendors: Azure Furniture, Customers: Nimesh Pathak, Products: Wooden Chair).
2. **Procurement Cycle:** Create Purchase Order (10 Wooden Chairs) → Confirm PO → One-click "Create Vendor Bill" (auto-creates balanced Purchase Journal Entry: Debit Expense, Credit AP).
3. **Outbound Settlement:** Register Bill Payment via Bank Journal → Bill marked Paid (auto-creates Payment Journal Entry: Debit AP, Credit Bank).
4. **Sales Cycle:** Create Sales Order (5 Chairs with 18% GST) → Confirm SO → One-click "Generate Invoice" (auto-creates Sales Journal Entry: Debit AR, Credit Sales & Tax).
5. **Inbound Settlement:** Record Customer Payment via Bank Journal → Invoice marked Paid (auto-creates Journal Entry: Debit Bank, Credit AR).
6. **Audit & Reporting:** Inspect General Ledger (`/journal-entries`) showing perfectly balanced Debits and Credits, followed by live Balance Sheet (`Assets = Liabilities + Equity`) and P&L statements.

---

## Architecture at a Glance
1. **Purchase Flow**: Create PO for vendor ("Azure Furniture") $\rightarrow$ Convert to Vendor Bill $\rightarrow$ Auto-generate Journal Entry ($\text{Debit: Expense}$ / $\text{Credit: Accounts Payable}$) $\rightarrow$ Record Payment ($\text{Debit: AP}$ / $\text{Credit: Bank}$).
2. **Sales Flow**: Create SO for customer ("Nimesh Pathak") with tax $\rightarrow$ Generate Customer Invoice $\rightarrow$ Auto-generate Journal Entry ($\text{Debit: Accounts Receivable}$ / $\text{Credit: Sales Income}$ + $\text{Tax Payable}$) $\rightarrow$ Record Customer Payment ($\text{Debit: Cash}$ / $\text{Credit: AR}$).
3. **Financial Statements**: Open Balance Sheet & Profit & Loss reports to demonstrate real-time ledger updates, double-entry verification ($\sum \text{debit} = \sum \text{credit}$), and net profit calculation.

## Architecture at a glance

```text
Browser / Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
        │
        │ typed HTTP contract (REST JSON, standard error envelope)
        ▼
FastAPI (Python 3.11) -> Service Layer (Accounting Orchestration) -> SQLAlchemy 2.0 -> PostgreSQL
        │
        └── Decimal precision, transactional journal generation (∑ Debits == ∑ Credits)
Browser / Next.js 14 UI (shadcn/ui + Tailwind)
        |
        | typed HTTP contract / JSON envelope
        v
Python FastAPI -> service layer -> SQLAlchemy 2.0 ORM -> PostgreSQL DB
        |
        +-> Automated double-entry transactional engine
```

**Key frontend decision:** Next.js 14 App Router with client components for interactive line-item calculations, shadcn/ui for accessible enterprise ergonomics, TanStack Query for server cache, and a typed API client.  
**Key backend decision:** Modular monolith using FastAPI and PostgreSQL with atomic database transactions ensuring no transaction exists without a balanced journal entry.  
**Most important business invariant:** Every journal entry must balance: $\sum \text{Debits} = \sum \text{Credits}$; POs/SOs can be billed/invoiced only once.

---
**Key frontend decision:** Next.js 14 App Router with TanStack Query and shadcn/ui for rapid, accessible, typed UI development.  
**Key backend decision:** FastAPI modular monolith with PostgreSQL, explicit Pydantic request/response schemas, and transactional journal entry creation.  
**Most important business invariant:** Double-entry ledger integrity: $\sum \text{debit} = \sum \text{credit}$ for every transaction; $\text{Assets} = \text{Liabilities} + \text{Capital}$ on the Balance Sheet.

## Progress

### Implemented and Verified
- [x] Phase 0 Problem Selection: Urban Furniture Accounting System evaluated and selected (Feasibility: 85%).
- [x] Full System Specification & Domain Model locked (`SPECIFICATION.md`, `docs/ANALYSIS_DELIVERABLE.md`).
- [x] Shared API Contract locked with 31 endpoints and standard error envelope (`docs/API_CONTRACT.md`).
- [x] Frontend Architecture & Logic finalized (`docs/frontend/ARCHITECTURE_DECISIONS.md`, `docs/frontend/LOGIC.md`).
- [x] Backend Architecture Decisions finalized (`docs/backend/ARCHITECTURE_DECISIONS.md`).
- [x] Atomic Task Board locked with 15–60 min tasks (`docs/TASK_BOARD.md`).

### In Progress
- [ ] `P0-BE-02R`: Replace email identity with Login ID, enforce password/role policy, and add Admin user creation (Kunal).
- [ ] `P0-FE-02R`: Replace email fields with Login ID and wire corrected auth API/session behavior (Sourabh).

### Planned, Not Yet Implemented
- P0 Vertical Slices: Auth handshake, Contacts & Products CRUD, Purchase Order → Bill → Payment, Sales Order → Invoice → Payment, General Ledger, Balance Sheet & P&L.
- P1: Budget vs Actual Report, Contact Self-Service Portal.

### Explicitly De-Scoped
- Microservices, Redis/Celery queue (P0 modular monolith is zero-network overhead).
- Real-time WebSockets (polling/TanStack revalidation sufficient for hackathon scale).

---
### Implemented and verified

- **Analysis & Architecture Lock**: Complete deliverable in `docs/ANALYSIS_DELIVERABLE.md` and API contract in `docs/API_CONTRACT.md`.
- **Task Board & Workflow**: Locked multi-stream atomic task board in `docs/TASK_BOARD.md`.
- **Backend Scaffold**: FastAPI app (`backend/app/main.py`), CORS middleware, centralized Pydantic settings (`backend/app/core/config.py`), DB engine setup (`backend/app/core/database.py`), custom exception envelope (`backend/app/core/exceptions.py`), and `/health` endpoint verified.

### In progress

- **P0-BE-02R**: Corrected Login ID auth, public signup role restriction, and Admin user creation.
- **P0-FE-02R**: Corrected Login ID UI and API-backed authentication flow.

### Planned, not yet implemented

- Contact & Product CRUD APIs and UI tables/forms.
- Seeded Chart of Accounts (8 reportable types) and Journal definitions.
- Purchase Order $\rightarrow$ Vendor Bill $\rightarrow$ Payment engine & auto-journal entries.
- Sales Order $\rightarrow$ Customer Invoice $\rightarrow$ Payment engine & auto-journal entries.
- Balance Sheet and Profit & Loss report computation endpoints and presentation pages.
- Budget & Analytic Account tracking (P1 scope).
- Contact Portal restricted access (P1 scope).

### Explicitly de-scoped

- Multi-currency support (single currency INR assumed).
- CGST/SGST tax split (flat percentage tax applied for P0).
- Contact image upload implementation (P0 may use initials avatars; field remains in the requirement).
- Redis / Queue infrastructure (kept inside transactional FastAPI service layer to reduce complexity).

## Evidence

| Evidence | Result | How to Reproduce |
|---|---|---|
| Problem Selection | Score: 8.5/10 (Highest feasibility & impact) | Review `docs/PROBLEM_SELECTION.md` |
| API Contract | 31 endpoints documented with JSON samples | Review `docs/API_CONTRACT.md` |
| Architecture Docs | Complete module boundaries & ADRs | Review `docs/frontend/` and `docs/backend/` |

---
| Golden Path Spec | PASS | Review section C in `docs/ANALYSIS_DELIVERABLE.md` |
| API Contract | PASS | Review `docs/API_CONTRACT.md` |
| Task Board Breakdown | PASS | Inspect `docs/TASK_BOARD.md` |
| Backend Healthcheck | PASS | Run `python -m app.main` or Uvicorn from `backend/`, test `GET http://localhost:8000/health` |
| Error Envelope | PASS | Send malformed request to FastAPI, verify JSON error schema output |

## Current Risk and Containment

**Risk:** Frontend-backend serialization discrepancies or line-item tax calculation mismatches.  
**Containment:** Locked contract in `docs/API_CONTRACT.md` with explicit decimal strings/numbers and central typed `api-client.ts`.  
**Next checkpoint:** 10:25 AM Foundation Gate (both apps running locally, health endpoint verified).
**Risk:** Potential integration delays between frontend form state and backend transactional journal endpoints during P0 vertical slice build.  
**Containment:** Standardized API contract (`docs/API_CONTRACT.md`) locked beforehand; mock data responses ready on frontend to unblock UI dev if backend logic undergoes refinement.  
**Next checkpoint:** 7:00 PM Gate — Full P0 Golden Path E2E Dry Run.

## Reviewer feedback log

| Time | Feedback | Classification | Owner/action |
|---|---|---|---|
| 5 Sep, 10:00 AM | Architecture & Analysis deliverable review approved | Accept now | Kunal & Sourabh — proceed with P0 Foundation implementation |
