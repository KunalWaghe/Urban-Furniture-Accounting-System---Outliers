# Reviewer Brief — Live Status
## Urban Furniture Accounting System

> Update at every phase gate. Keep this file factual and short enough to explain in five minutes.

**Last updated:** 5 September 2026, 10:45 AM  
**Current gate:** Phase 1 — Foundation & First Vertical Slice  
**Stable deployment:** Staging setup in progress  
**Stable commit/tag:** `phase-0-architecture-locked`

---

## Problem → User → Promise

**Problem:** Mid-sized businesses like Urban Furniture struggle with fragmented tools for sales, purchasing, and billing, resulting in manual double-entry ledger errors, delayed payments, and unverified financial statements.  
**Primary user:** Admin (Business Owner) & Invoicing User (Accountant). Secondary: Contact users (Customers/Vendors).  
**Our promise:** A seamless accounting engine where standard business actions (PO → Vendor Bill, SO → Customer Invoice, Payments) automatically generate balanced double-entry journal entries with zero reconciliation lag and real-time Balance Sheet & P&L generation.  
**Why this matters:** Eradicates manual bookkeeping discrepancies, enforces mathematical accounting invariants, and provides instantaneous visibility into company cash flow and profitability.

---

## Golden Demo Path

1. **Auth & Setup:** Login as Admin; inspect master data (Vendors: Azure Furniture, Customers: Nimesh Pathak, Products: Wooden Chair).
2. **Procurement Cycle:** Create Purchase Order (10 Wooden Chairs) → Confirm PO → One-click "Create Vendor Bill" (auto-creates balanced Purchase Journal Entry: Debit Expense, Credit AP).
3. **Outbound Settlement:** Register Bill Payment via Bank Journal → Bill marked Paid (auto-creates Payment Journal Entry: Debit AP, Credit Bank).
4. **Sales Cycle:** Create Sales Order (5 Chairs with 18% GST) → Confirm SO → One-click "Generate Invoice" (auto-creates Sales Journal Entry: Debit AR, Credit Sales & Tax).
5. **Inbound Settlement:** Record Customer Payment via Bank Journal → Invoice marked Paid (auto-creates Journal Entry: Debit Bank, Credit AR).
6. **Audit & Reporting:** Inspect General Ledger (`/journal-entries`) showing perfectly balanced Debits and Credits, followed by live Balance Sheet (`Assets = Liabilities + Equity`) and P&L statements.

---

## Architecture at a Glance

```text
Browser / Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
        │
        │ typed HTTP contract (REST JSON, standard error envelope)
        ▼
FastAPI (Python 3.11) -> Service Layer (Accounting Orchestration) -> SQLAlchemy 2.0 -> PostgreSQL
        │
        └── Decimal precision, transactional journal generation (∑ Debits == ∑ Credits)
```

**Key frontend decision:** Next.js 14 App Router with client components for interactive line-item calculations, shadcn/ui for accessible enterprise ergonomics, TanStack Query for server cache, and a typed API client.  
**Key backend decision:** Modular monolith using FastAPI and PostgreSQL with atomic database transactions ensuring no transaction exists without a balanced journal entry.  
**Most important business invariant:** Every journal entry must balance: $\sum \text{Debits} = \sum \text{Credits}$; POs/SOs can be billed/invoiced only once.

---

## Progress

### Implemented and Verified
- [x] Phase 0 Problem Selection: Urban Furniture Accounting System evaluated and selected (Feasibility: 85%).
- [x] Full System Specification & Domain Model locked (`SPECIFICATION.md`, `docs/ANALYSIS_DELIVERABLE.md`).
- [x] Shared API Contract locked with 22 endpoints and standard error envelope (`docs/API_CONTRACT.md`).
- [x] Frontend Architecture & Logic finalized (`docs/frontend/ARCHITECTURE_DECISIONS.md`, `docs/frontend/LOGIC.md`).
- [x] Backend Architecture Decisions finalized (`docs/backend/ARCHITECTURE_DECISIONS.md`).
- [x] Atomic Task Board locked with 15–60 min tasks (`docs/TASK_BOARD.md`).

### In Progress
- [ ] `P0-FE-01`: Next.js 14 + Tailwind + shadcn/ui shell setup (Sourabh).
- [ ] `P0-BE-01`: FastAPI scaffold + PostgreSQL + Base setup (Kunal).

### Planned, Not Yet Implemented
- P0 Vertical Slices: Auth handshake, Contacts & Products CRUD, Purchase Order → Bill → Payment, Sales Order → Invoice → Payment, General Ledger, Balance Sheet & P&L.
- P1: Budget vs Actual Report, Contact Self-Service Portal.

### Explicitly De-Scoped
- Microservices, Redis/Celery queue (P0 modular monolith is zero-network overhead).
- Real-time WebSockets (polling/TanStack revalidation sufficient for hackathon scale).

---

## Evidence

| Evidence | Result | How to Reproduce |
|---|---|---|
| Problem Selection | Score: 8.5/10 (Highest feasibility & impact) | Review `docs/PROBLEM_SELECTION.md` |
| API Contract | 22 endpoints documented with JSON samples | Review `docs/API_CONTRACT.md` |
| Architecture Docs | Complete module boundaries & ADRs | Review `docs/frontend/` and `docs/backend/` |

---

## Current Risk and Containment

**Risk:** Frontend-backend serialization discrepancies or line-item tax calculation mismatches.  
**Containment:** Locked contract in `docs/API_CONTRACT.md` with explicit decimal strings/numbers and central typed `api-client.ts`.  
**Next checkpoint:** 10:25 AM Foundation Gate (both apps running locally, health endpoint verified).
