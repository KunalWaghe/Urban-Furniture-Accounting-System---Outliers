# Frontend Remaining Work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish all remaining frontend work from `docs/TASK_BOARD.md` — fix the broken dashboard build, ship the P0 financial reports (Balance Sheet, P&L), wire navigation/dashboard to real routes, then deliver the P1 Budget module and Contact Portal.

**Architecture:** Follow the established feature-folder pattern: thin route wrappers in `src/app/(app)/<route>/page.tsx` delegating to feature components in `src/features/<feature>/`. All HTTP goes through `apiFetch` (`src/lib/api.ts`) with `auth: true`; server state lives in TanStack Query; shared types in `src/lib/types.ts` or feature-local API modules. No new npm dependencies — the budget donut chart is a hand-rolled SVG (recharts was suggested in the system plan, but the project rule is no new libraries unless explicitly requested).

**Tech Stack:** Next.js 16.3.4 (App Router), React 19, TanStack Query 5.80.7, Tailwind CSS v4, shadcn/base-ui primitives (`Card`, `Button`, `Badge`), lucide-react icons, `formatINR`/`formatDate` from `src/lib/format.ts`.

**Repo conventions (override skill defaults):**
- **No test framework exists and none is added** (user rule). Verification per task = `npx tsc --noEmit` clean + `npm run lint` clean + `npm run build` passing + browser check of the route.
- **No git commits unless the user explicitly asks** (git safety rule).

---

## Current State (verified 5 Sep 2026, ~10:50 PM IST)

### Already built and working
- Auth (login/signup/forgot/reset), `AuthContext`, `RequireAuth`, `RequireRole`
- Dashboard shell: `SiteHeader` mega-nav, ⌘K search, theme toggle, mobile drawer
- Master data pages: Contacts, Products (list + Kanban), Chart of Accounts, Journals
- Journal Entries page (list + balanced manual entry form) — task 7A.2 is **done**
- Purchase flow: PO list/new/detail, Vendor Bills list/detail, `PaymentModal` (outbound)
- Sales flow: SO list/new/detail, Customer Invoices list/detail, `CustomerPaymentModal` (inbound)
- Admin users page (`/admin/users`)

### Broken right now (blocks everything)
`cd frontend && npx tsc --noEmit` currently reports **26 errors**:
- `src/app/(app)/page.tsx` — 24 errors: uses `selectedBillForPayment`, `setSelectedBillForPayment`, `setCreatedBills`, `PaymentModal`, and the `VendorBill` type without declaring or importing them (leftover from a partial refactor; the dashboard now gets bills from `useDashboardOrderData`).
- `src/lib/error-utils.ts:127` + `src/lib/toast-utils.ts:96` — `getErrorMessage`'s `fallback` parameter is inferred as a string **literal** type (because `ERROR_MESSAGES` is `as const`), so callers passing other messages fail to compile.

### Missing pages/features (the actual remaining work)
| Priority | Item | Route | Backend dependency |
|---|---|---|---|
| P0 | Balance Sheet page | `/reports/balance-sheet` | `GET /api/v1/reports/balance-sheet` — **not implemented yet** (contract locked) |
| P0 | Profit & Loss page | `/reports/pnl` | `GET /api/v1/reports/pnl` — **not implemented yet** (contract locked) |
| P0 | Reports nav links point to `/#budget-section` placeholders | — | none |
| P0 | Dashboard "Balancesheet" / "Profit & Loss" buttons are toast stubs | — | none |
| P0 | Dashboard KPI cards (Cash, Bank, AR, AP, Net Profit) — golden-path step 2, task 10.1 | dashboard | report endpoints above |
| P1 | Analytic Accounts view | `/analytic-accounts` | `GET /api/v1/analytic-accounts` — **not implemented yet** |
| P1 | Budget list + form + revise | `/budgets` | `POST/GET /api/v1/budgets` — **not implemented yet** |
| P1 | Budget Report with donut chart | `/reports/budget` | `GET /api/v1/reports/budget` — **not implemented yet** |
| P1 | Contact Portal ("My Invoices") + pay | `/portal` | `GET /api/v1/portal/invoices` — **not implemented yet** |
| P1 | Role-safe navigation (hide internal routes from `contact` role) | all | none (server 403 is the real gate) |
| P0 | Polish: responsive, empty/error states, golden-path check | all | none |

> **Backend coordination note for Kunal:** the transactional core routers (PO, SO, bills, invoices, payments, journal entries) exist in `backend/app/main.py`, but **reports, budgets, analytic-accounts, and portal routers do not**. Every page below is built against the locked contract in `docs/API_CONTRACT.md` and must show a proper loading/error/empty state when the endpoint 404s — never a crash or blank screen. This lets FE ship before BE and integrate without rework.

---

## Phase 0 — Unblock the Build (P0, do first)

The repo does not compile. Nothing else can be verified until this lands.

### Task 0.1: Fix `getErrorMessage` fallback literal-type error

**Files:**
- Modify: `frontend/src/lib/error-utils.ts:34`

- [ ] **Step 1: Widen the `fallback` parameter to `string`**

The default value `ERROR_MESSAGES.UNKNOWN_ERROR` comes from an `as const` object, so TypeScript infers the parameter type as that exact literal. Callers in `error-utils.ts:127` and `toast-utils.ts:96` pass different messages and fail. Change line 34 from:

```ts
export function getErrorMessage(error: unknown, fallback = ERROR_MESSAGES.UNKNOWN_ERROR): string {
```

to:

```ts
export function getErrorMessage(error: unknown, fallback: string = ERROR_MESSAGES.UNKNOWN_ERROR): string {
```

- [ ] **Step 2: Verify the two downstream errors are gone**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -E "error-utils|toast-utils"`
Expected: no output (both errors resolved). The 24 `page.tsx` errors remain — fixed next.

### Task 0.2: Fix the dashboard page (`page.tsx`)

**Files:**
- Modify: `frontend/src/app/(app)/page.tsx` (imports ~line 37-58, state ~line 92-93, PaymentModal block ~line 1520-1563)

- [ ] **Step 1: Add the missing imports**

In the import block, add `VendorBill` to the `@/lib/types` type import and add the two new imports:

```tsx
import type {
  Contact,
  Product,
  SalesOrder,
  PurchaseOrder,
  VendorBill,
} from "@/lib/types";
import { PaymentModal } from "@/components/payment-modal";
import { formatINR } from "@/lib/format";
```

- [ ] **Step 2: Declare the missing state**

Directly below the existing `const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);` add:

```tsx
  // Vendor bill currently being settled via the PaymentModal
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<VendorBill | null>(null);
```

- [ ] **Step 3: Replace the stale `onSuccess` handler**

The current handler references `setCreatedBills`, a leftover local-store pattern — the dashboard now reads bills from the `["vendor-bills"]` React Query cache. Replace the entire `onSuccess={(payment) => { ... }}` body (the `setCreatedBills(...)` block through the closing `}}`) with:

```tsx
          onSuccess={(payment) => {
            showToast(
              `Payment ${payment.payment_number} (${formatINR(payment.amount)}) recorded for Bill ${selectedBillForPayment.bill_number}! Journal Entry auto-posted.`
            );
            void queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
            setSelectedBillForPayment(null);
          }}
```

(`payment` is typed as `PaymentRecord` by `PaymentModalProps`, so the implicit-`any` errors disappear too.)

- [ ] **Step 4: Verify the whole frontend compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0, zero errors.

Run: `cd frontend && npm run build`
Expected: build succeeds; `/` route compiles.

- [ ] **Step 5: Browser smoke check**

Run dev server, open `/`, click **Pay** on an unpaid vendor bill in the Purchase section → PaymentModal opens → submit a payment → toast appears, modal closes, bill list refreshes.

---

## Phase 1 — Financial Reports API Client (P0)

One feature module owns both report endpoints. Pages in Phases 2–4 consume these hooks.

### Task 1.1: Add report query keys

**Files:**
- Modify: `frontend/src/lib/constants.ts:405-439` (`QUERY_KEYS`)

- [ ] **Step 1: Add report keys inside `QUERY_KEYS`**

Insert after the `USERS` / `USER_DETAIL` entries, before the closing `} as const;`:

```ts
  // Financial Reports
  BALANCE_SHEET: ["reports", "balance-sheet"],
  PNL: (periodStart: string, periodEnd: string) =>
    ["reports", "pnl", periodStart, periodEnd],
  BUDGET_REPORT: ["reports", "budget"],

  // Budgets & Analytics (P1)
  ANALYTIC_ACCOUNTS: ["analytic-accounts"],
  BUDGETS: ["budgets"],
  BUDGET_DETAIL: (id: number) => ["budgets", id],

  // Contact Portal (P1)
  PORTAL_INVOICES: ["portal", "invoices"],
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

### Task 1.2: Create the reports API module

**Files:**
- Create: `frontend/src/features/reports/reports-api.ts`

- [ ] **Step 1: Write the module**

Types mirror the locked contract (`docs/API_CONTRACT.md` §8) exactly. `staleTime: 0` per the LOGIC.md caching rule ("financial reports always fetch latest balances"). `retry: 1` so a missing backend endpoint fails fast into the page's error state instead of retry-storming.

```ts
/**
 * Financial Reports API client (P0-FE-13a/b).
 *
 * Wraps the locked report endpoints from docs/API_CONTRACT.md §8:
 * - GET /api/v1/reports/balance-sheet
 * - GET /api/v1/reports/pnl?period_start=&period_end=
 *
 * Backend note: these endpoints are contract-locked but not yet implemented.
 * Hooks surface errors normally so pages render their error/retry state.
 */

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";

/** One account row inside a report section. */
export interface ReportLineItem {
  account_code: string;
  account_name: string;
  balance?: number; // balance-sheet rows
  amount?: number; // pnl rows
}

export interface ReportSection {
  items: ReportLineItem[];
  total: number;
}

export interface BalanceSheetReport {
  as_of_date: string;
  assets: ReportSection;
  liabilities: ReportSection;
  capital: ReportSection;
  total_assets: number;
  total_liabilities_and_capital: number;
  is_balanced: boolean;
}

export interface PnlReport {
  period_start: string;
  period_end: string;
  income: ReportSection;
  expenses: ReportSection;
  net_profit: number;
}

/** GET /api/v1/reports/balance-sheet — real-time statement of financial position. */
export async function fetchBalanceSheet(): Promise<BalanceSheetReport> {
  return apiFetch<BalanceSheetReport>("/api/v1/reports/balance-sheet", {
    auth: true,
  });
}

/** GET /api/v1/reports/pnl — income vs expenses for a date period. */
export async function fetchProfitAndLoss(params: {
  period_start: string;
  period_end: string;
}): Promise<PnlReport> {
  const query = new URLSearchParams({
    period_start: params.period_start,
    period_end: params.period_end,
  });
  return apiFetch<PnlReport>(`/api/v1/reports/pnl?${query.toString()}`, {
    auth: true,
  });
}

/** React Query hook for the live Balance Sheet. Always refetches on mount. */
export function useBalanceSheet() {
  return useQuery({
    queryKey: QUERY_KEYS.BALANCE_SHEET,
    queryFn: fetchBalanceSheet,
    staleTime: 0,
    retry: 1,
  });
}

/** React Query hook for the P&L of a period. */
export function useProfitAndLoss(periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PNL(periodStart, periodEnd),
    queryFn: () =>
      fetchProfitAndLoss({ period_start: periodStart, period_end: periodEnd }),
    staleTime: 0,
    retry: 1,
  });
}

/**
 * Finds an account row's balance inside a Balance Sheet section by account code
 * (e.g. `"1010"` Cash, `"1020"` Bank, `"1030"` AR, `"2010"` AP).
 * Returns 0 when the account is absent (no postings yet).
 */
export function findAccountBalance(
  section: ReportSection | undefined,
  accountCode: string
): number {
  const item = section?.items.find((row) => row.account_code === accountCode);
  return Number(item?.balance ?? item?.amount ?? 0);
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

---

## Phase 2 — Balance Sheet Page (P0, task 7B.2)

### Task 2.1: Create the Balance Sheet feature component

**Files:**
- Create: `frontend/src/features/reports/balance-sheet-page.tsx`

- [ ] **Step 1: Write the component**

Layout follows System_Plan §3.6: two columns — Assets | Liabilities + Capital — each with per-account rows and totals, plus the `is_balanced` sanity indicator (the demo "wow" moment). Print uses `window.print()`.

```tsx
/**
 * Balance Sheet report page (P0-FE-13a).
 *
 * Route: `/reports/balance-sheet` (via `app/(app)/reports/balance-sheet/page.tsx`)
 *
 * State OWNED: none (all server data via `useBalanceSheet`).
 * State CONSUMED: BalanceSheetReport from the reports API.
 * Source of truth: backend report endpoint (TanStack Query cache, staleTime 0).
 */
"use client";

import { Printer, RefreshCw, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatDate, formatINR } from "@/lib/format";
import { useBalanceSheet, type ReportSection } from "./reports-api";

/** One column of the statement: account rows plus a total footer. */
function SectionTable({
  title,
  section,
}: {
  title: string;
  section: ReportSection;
}) {
  return (
    <div className="rounded-xl border border-border/80 overflow-hidden">
      <div className="border-b border-border bg-surface-muted/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text">
        {title}
      </div>
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-border">
          {section.items.map((item) => (
            <tr key={item.account_code} className="hover:bg-surface-muted/40">
              <td className="px-4 py-2.5 text-text">
                <span className="mr-2 font-mono text-xs text-text-muted">
                  {item.account_code}
                </span>
                {item.account_name}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-text">
                {formatINR(Number(item.balance ?? 0))}
              </td>
            </tr>
          ))}
          {section.items.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-6 text-center text-xs text-text-muted">
                No balances posted yet.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-muted/60">
            <td className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text">
              Total {title}
            </td>
            <td className="px-4 py-2.5 text-right font-mono font-bold text-text">
              {formatINR(section.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function BalanceSheetPage() {
  const reportQuery = useBalanceSheet();
  const report = reportQuery.data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Financial Reports
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">
            Balance Sheet
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {report
              ? `As of ${formatDate(report.as_of_date)} · Assets = Liabilities + Capital`
              : "Real-time statement of financial position."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <Badge variant={report.is_balanced ? "secondary" : "destructive"}>
              <Scale className="h-3 w-3" />
              {report.is_balanced ? "Balanced" : "Out of balance"}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => void reportQuery.refetch()}
            disabled={reportQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Body states */}
      {reportQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : reportQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-red-600">
              Unable to load the Balance Sheet. The reports endpoint may not be
              available yet.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void reportQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !report ||
        (report.assets.items.length === 0 &&
          report.liabilities.items.length === 0 &&
          report.capital.items.length === 0) ? (
        <EmptyState
          title="No accounting data yet"
          description="Post a vendor bill or customer invoice first — the Balance Sheet is computed from journal entries."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionTable title="Assets" section={report.assets} />
            <div className="space-y-4">
              <SectionTable title="Liabilities" section={report.liabilities} />
              <SectionTable title="Capital" section={report.capital} />
            </div>
          </div>

          {/* Equation footer */}
          <div
            className={`grid gap-4 rounded-xl border p-4 sm:grid-cols-2 ${
              report.is_balanced
                ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                : "border-red-200/60 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20"
            }`}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-text">Total Assets</span>
              <span className="font-mono font-bold text-text">
                {formatINR(report.total_assets)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-text">
                Total Liabilities + Capital
              </span>
              <span className="font-mono font-bold text-text">
                {formatINR(report.total_liabilities_and_capital)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

### Task 2.2: Create the route

**Files:**
- Create: `frontend/src/app/(app)/reports/balance-sheet/page.tsx`

- [ ] **Step 1: Write the thin route wrapper** (same pattern as `journal-entries/page.tsx`; `RequireRole` matches the contract's Admin / Invoicing audience):

```tsx
import { RequireRole } from "@/components/require-role";
import { BalanceSheetPage } from "@/features/reports/balance-sheet-page";

export const metadata = {
  title: "Balance Sheet | Urban Furniture Accounting",
};

export default function Page() {
  return (
    <RequireRole allowedRoles={["admin", "invoicing_user"]}>
      <BalanceSheetPage />
    </RequireRole>
  );
}
```

- [ ] **Step 2: Verify build + browser**

Run: `cd frontend && npm run build`
Expected: build succeeds, `/reports/balance-sheet` appears in the route list.

Browser: log in as admin → visit `/reports/balance-sheet`. With the backend endpoint missing, the **error card with Retry** must render (not a crash). Once Kunal ships the endpoint, the two-column statement renders and the Balanced badge shows.

---

## Phase 3 — Profit & Loss Page (P0, task 7B.3)

### Task 3.1: Create the P&L feature component

**Files:**
- Create: `frontend/src/features/reports/pnl-page.tsx`

- [ ] **Step 1: Write the component**

Period filter defaults to the current calendar year (contract uses `period_start` / `period_end` query params). Changing either date refetches via the query key.

```tsx
/**
 * Profit & Loss report page (P0-FE-13b).
 *
 * Route: `/reports/pnl` (via `app/(app)/reports/pnl/page.tsx`)
 *
 * State OWNED: `periodStart`, `periodEnd` date-filter inputs (local useState).
 * State CONSUMED: PnlReport from the reports API.
 * Source of truth: backend report endpoint (TanStack Query cache, staleTime 0).
 */
"use client";

import { useState } from "react";
import { Printer, RefreshCw, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatINR } from "@/lib/format";
import { useProfitAndLoss, type ReportSection } from "./reports-api";

/** Income or Expenses block: account rows plus a total footer. */
function PnlSection({
  title,
  section,
}: {
  title: string;
  section: ReportSection;
}) {
  return (
    <div className="rounded-xl border border-border/80 overflow-hidden">
      <div className="border-b border-border bg-surface-muted/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text">
        {title}
      </div>
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-border">
          {section.items.map((item) => (
            <tr key={item.account_code} className="hover:bg-surface-muted/40">
              <td className="px-4 py-2.5 text-text">
                <span className="mr-2 font-mono text-xs text-text-muted">
                  {item.account_code}
                </span>
                {item.account_name}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-text">
                {formatINR(Number(item.amount ?? 0))}
              </td>
            </tr>
          ))}
          {section.items.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-6 text-center text-xs text-text-muted">
                No {title.toLowerCase()} recorded in this period.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-muted/60">
            <td className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text">
              Total {title}
            </td>
            <td className="px-4 py-2.5 text-right font-mono font-bold text-text">
              {formatINR(section.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function PnlPage() {
  // Default period: current calendar year up to today.
  const [periodStart, setPeriodStart] = useState(
    () => `${new Date().getFullYear()}-01-01`
  );
  const [periodEnd, setPeriodEnd] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const reportQuery = useProfitAndLoss(periodStart, periodEnd);
  const report = reportQuery.data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Financial Reports
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">
            Profit &amp; Loss
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Income minus expenses for the selected period.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-text">
            From
            <input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
            />
          </label>
          <label className="text-xs font-semibold text-text">
            To
            <input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
            />
          </label>
          <Button
            variant="outline"
            onClick={() => void reportQuery.refetch()}
            disabled={reportQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Body states */}
      {reportQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : reportQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-red-600">
              Unable to load the Profit &amp; Loss statement. The reports
              endpoint may not be available yet.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void reportQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !report ||
        (report.income.items.length === 0 && report.expenses.items.length === 0) ? (
        <EmptyState
          title="No activity in this period"
          description="Confirm an invoice or bill inside the selected dates and the P&L will populate."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PnlSection title="Income" section={report.income} />
            <PnlSection title="Expenses" section={report.expenses} />
          </div>

          {/* Net profit banner */}
          <div
            className={`flex items-center justify-between rounded-xl border p-4 ${
              report.net_profit >= 0
                ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                : "border-red-200/60 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-text">
              <TrendingUp className="h-4 w-4" />
              Net {report.net_profit >= 0 ? "Profit" : "Loss"} ({report.period_start} →{" "}
              {report.period_end})
            </span>
            <span
              className={`font-mono text-lg font-bold ${
                report.net_profit >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {formatINR(report.net_profit)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

### Task 3.2: Create the route

**Files:**
- Create: `frontend/src/app/(app)/reports/pnl/page.tsx`

- [ ] **Step 1: Write the route wrapper**

```tsx
import { RequireRole } from "@/components/require-role";
import { PnlPage } from "@/features/reports/pnl-page";

export const metadata = {
  title: "Profit & Loss | Urban Furniture Accounting",
};

export default function Page() {
  return (
    <RequireRole allowedRoles={["admin", "invoicing_user"]}>
      <PnlPage />
    </RequireRole>
  );
}
```

- [ ] **Step 2: Verify build + browser**

Run: `cd frontend && npm run build`
Expected: build succeeds, `/reports/pnl` in the route list.

Browser: visit `/reports/pnl` → error/retry card while the endpoint is missing; after BE lands, change the date filters and confirm the query refetches and Net Profit banner updates.

---

## Phase 4 — Navigation, Dashboard Wiring & KPI Cards (P0)

### Task 4.1: Point the Reports nav at real routes

**Files:**
- Modify: `frontend/src/components/site-header.tsx:92-96` (`NAV_CATEGORIES` → `reports` items)

- [ ] **Step 1: Replace the placeholder hrefs**

Change the `reports` category items from `/#budget-section` placeholders to the real routes. (The Budget Report link is activated in Phase 6 when its page exists — until then it keeps the hash href.)

```ts
  {
    id: "reports",
    label: "Reports",
    color: "bg-purple-500",
    items: [
      { label: "Balance Sheet", href: "/reports/balance-sheet", description: "Assets = Liabilities + Capital check" },
      { label: "Profit and Loss", href: "/reports/pnl", description: "Operating revenue, COGS & net income" },
      { label: "Budget Report", href: "/#budget-section", description: "Committed vs Achieved utilization metrics" },
    ],
  },
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

Browser: open the Reports dropdown on any page → Balance Sheet / Profit and Loss navigate to the new pages.

### Task 4.2: Replace dashboard toast-stub buttons with real links

**Files:**
- Modify: `frontend/src/app/(app)/page.tsx` (budget section, ~line 1046-1053 and ~line 1191-1207)

- [ ] **Step 1: "Full Analytical P&L" button → Link**

Replace the `<button … onClick={() => showToast("Loading Full Analytical Profit & Loss report...")}>` block with:

```tsx
              <Link
                href="/reports/pnl"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors dark:text-purple-400"
              >
                <span>Full Analytical P&amp;L</span>
                <span>→</span>
              </Link>
```

- [ ] **Step 2: "Balancesheet" / "Profit & Loss" quick links → Links**

Replace the two toast `<button>` elements at the bottom of the budget section with:

```tsx
                <Link
                  href="/reports/balance-sheet"
                  className="text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400"
                >
                  Balancesheet
                </Link>
                <span className="text-border">•</span>
                <Link
                  href="/reports/pnl"
                  className="text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400"
                >
                  Profit &amp; Loss
                </Link>
```

(`Link` is already imported at the top of `page.tsx`.)

- [ ] **Step 3: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: exit 0, no lint errors.

### Task 4.3: Dashboard KPI cards (task 10.1 / golden-path step 2)

**Files:**
- Create: `frontend/src/features/dashboard/kpi-cards.tsx`
- Modify: `frontend/src/app/(app)/page.tsx` (insert `<KpiCards />` before SECTION 1, ~line 309)

- [ ] **Step 1: Write the KPI cards component**

Five cards — Cash, Bank, Receivables, Payables, Net Profit — sourced from the two report endpoints. While the backend reports API is missing, the cards render `—` with a subtle "reports unavailable" hint instead of breaking the dashboard (ADR-04 resilient states).

```tsx
/**
 * Dashboard KPI cards (BONUS-02 / golden-path step 2).
 *
 * Shows accounting-health metrics — Cash, Bank, Accounts Receivable,
 * Accounts Payable, Net Profit — computed from the live report endpoints.
 *
 * State OWNED: none.
 * State CONSUMED: `useBalanceSheet`, `useProfitAndLoss` (reports API).
 * Resilience: when the reports API is unavailable, cards show "—" and a hint.
 */
"use client";

import type { ReactNode } from "react";
import { CreditCard, IndianRupee, Landmark, TrendingUp, Wallet } from "lucide-react";

import { formatINR } from "@/lib/format";
import {
  findAccountBalance,
  useBalanceSheet,
  useProfitAndLoss,
} from "@/features/reports/reports-api";

/** One KPI tile; `value` is null while loading or when the API is unavailable. */
function KpiTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface-muted/60 p-4 transition-all hover:bg-surface-muted">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-border text-text-muted">
          {icon}
        </div>
      </div>
      <div className="mt-2.5">
        <span className="text-xl font-bold tracking-tight text-text font-mono">
          {value === null ? "—" : formatINR(value)}
        </span>
      </div>
    </div>
  );
}

export function KpiCards() {
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const today = new Date().toISOString().slice(0, 10);

  const balanceSheetQuery = useBalanceSheet();
  const pnlQuery = useProfitAndLoss(yearStart, today);

  // null = data unavailable (loading or endpoint missing) → tile shows "—"
  const available = Boolean(balanceSheetQuery.data) && Boolean(pnlQuery.data);
  const bs = balanceSheetQuery.data;

  const cash = bs ? findAccountBalance(bs.assets, "1010") : null;
  const bank = bs ? findAccountBalance(bs.assets, "1020") : null;
  const receivables = bs ? findAccountBalance(bs.assets, "1030") : null;
  const payables = bs ? findAccountBalance(bs.liabilities, "2010") : null;
  const netProfit = pnlQuery.data ? pnlQuery.data.net_profit : null;

  return (
    <section aria-label="Accounting health" className="space-y-2">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiTile label="Cash" value={cash} icon={<Wallet className="h-3.5 w-3.5" />} />
        <KpiTile label="Bank" value={bank} icon={<Landmark className="h-3.5 w-3.5" />} />
        <KpiTile
          label="Receivables"
          value={receivables}
          icon={<IndianRupee className="h-3.5 w-3.5" />}
        />
        <KpiTile
          label="Payables"
          value={payables}
          icon={<CreditCard className="h-3.5 w-3.5" />}
        />
        <KpiTile
          label="Net Profit (YTD)"
          value={netProfit}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
      </div>
      {!available && !balanceSheetQuery.isLoading && (
        <p className="text-[11px] text-text-muted">
          Live financial KPIs will appear once the reports API is available.
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Mount it on the dashboard**

In `frontend/src/app/(app)/page.tsx`, add the import:

```tsx
import { KpiCards } from "@/features/dashboard/kpi-cards";
```

and render it immediately after the toast banner block (`{toastMessage && (...)}`) and before `{/* SECTION 1: Sales Module Card */}`:

```tsx
      <KpiCards />
```

- [ ] **Step 3: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: exit 0; build succeeds.

Browser: dashboard renders five KPI tiles. With no reports backend they show `—` plus the hint line; the rest of the dashboard is unaffected.

---

## Phase 5 — Analytic Accounts & Budgets (P1, tasks 9.1/9.2 FE parts)

> Start only after Phases 0–4 pass. Budget response shapes follow System_Plan §3.4 (committed / achieved / achieved % / amount to achieve); confirm the exact JSON keys with the backend when `GET /api/v1/budgets` lands and adjust the mapper in one place (`budgets-api.ts`).

### Task 5.1: Create the budgets API module

**Files:**
- Create: `frontend/src/features/budgets/budgets-api.ts`

- [ ] **Step 1: Write the module**

```ts
/**
 * Budgets & Analytic Accounts API client (P1-FE-01).
 *
 * Endpoints (contract-locked, backend implementation pending):
 * - GET  /api/v1/analytic-accounts
 * - GET  /api/v1/budgets
 * - POST /api/v1/budgets
 * - POST /api/v1/budgets/:id/confirm
 * - POST /api/v1/budgets/:id/revise   → creates a new budget row (revised_from_id)
 * - GET  /api/v1/reports/budget       → committed vs achieved per budget
 *
 * Field semantics (System_Plan §3.4):
 * - achieved_amount is computed by the backend from tagged invoices/bills
 * - achieved_percent = achieved / committed * 100
 * - amount_to_achieve = committed - achieved
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";

export interface AnalyticAccount {
  id: number;
  name: string;
  type: "income" | "expense";
  description?: string | null;
  is_active: boolean;
}

export type BudgetStatus = "draft" | "confirmed" | "revised" | "cancelled";

export interface Budget {
  id: number;
  name: string;
  period_start: string;
  period_end: string;
  analytic_account_id: number;
  analytic_account_name?: string | null;
  committed_amount: number;
  achieved_amount: number;
  achieved_percent: number;
  amount_to_achieve: number;
  status: BudgetStatus;
  revised_from_id?: number | null;
}

export interface CreateBudgetInput {
  name: string;
  period_start: string;
  period_end: string;
  analytic_account_id: number;
  committed_amount: number;
}

interface ListResponse<T> {
  data: T[];
  total: number;
}

/** GET /api/v1/analytic-accounts — income/expense analytic tags. */
export async function fetchAnalyticAccounts(): Promise<AnalyticAccount[]> {
  const res = await apiFetch<ListResponse<AnalyticAccount>>(
    "/api/v1/analytic-accounts?is_active=true&limit=100",
    { auth: true }
  );
  return res.data ?? [];
}

/** GET /api/v1/budgets — all budgets with computed achieved fields. */
export async function fetchBudgets(): Promise<Budget[]> {
  const res = await apiFetch<ListResponse<Budget>>("/api/v1/budgets?limit=100", {
    auth: true,
  });
  return res.data ?? [];
}

/** POST /api/v1/budgets — create a budget in draft status (Admin). */
export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  return apiFetch<Budget>("/api/v1/budgets", {
    method: "POST",
    auth: true,
    body: input,
  });
}

/** POST /api/v1/budgets/:id/confirm — lock the budget (draft → confirmed). */
export async function confirmBudget(id: number): Promise<Budget> {
  return apiFetch<Budget>(`/api/v1/budgets/${id}/confirm`, {
    method: "POST",
    auth: true,
  });
}

/** POST /api/v1/budgets/:id/revise — create a new revision linked to the original. */
export async function reviseBudget(id: number): Promise<Budget> {
  return apiFetch<Budget>(`/api/v1/budgets/${id}/revise`, {
    method: "POST",
    auth: true,
  });
}

export function useAnalyticAccounts() {
  return useQuery({
    queryKey: QUERY_KEYS.ANALYTIC_ACCOUNTS,
    queryFn: fetchAnalyticAccounts,
    staleTime: 5 * 60 * 1000, // master data caching rule from LOGIC.md
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: QUERY_KEYS.BUDGETS,
    queryFn: fetchBudgets,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/** Shared invalidation after any budget mutation. */
function useBudgetMutation<TInput>(
  mutationFn: (input: TInput) => Promise<Budget>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUDGETS });
    },
  });
}

export function useCreateBudget() {
  return useBudgetMutation(createBudget);
}

export function useConfirmBudget() {
  return useBudgetMutation(confirmBudget);
}

export function useReviseBudget() {
  return useBudgetMutation(reviseBudget);
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

### Task 5.2: Analytic Accounts page

**Files:**
- Create: `frontend/src/features/budgets/analytic-accounts-page.tsx`
- Create: `frontend/src/app/(app)/analytic-accounts/page.tsx`

- [ ] **Step 1: Write the feature component** — read-only list grouped by type (matches the CoA page's read-only posture; creation is admin/seed territory for the hackathon):

```tsx
/**
 * Analytic Accounts page (P1-FE-01a).
 *
 * Route: `/analytic-accounts`
 * Read-only list of income/expense analytic tags used on order lines and budgets.
 *
 * State OWNED: `search` filter text.
 * State CONSUMED: analytic accounts via `useAnalyticAccounts`.
 */
"use client";

import { useMemo, useState } from "react";
import { Search, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAnalyticAccounts } from "./budgets-api";

export function AnalyticAccountsPage() {
  const [search, setSearch] = useState("");
  const accountsQuery = useAnalyticAccounts();
  const accounts = accountsQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const income = filtered.filter((a) => a.type === "income");
  const expense = filtered.filter((a) => a.type === "expense");

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
          Cost Accounting
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">
          Analytic Accounts
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Income and expense tags that connect order lines to budgets.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-5">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search analytic accounts..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {accountsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : accountsQuery.isError ? (
            <div className="p-8 text-center text-sm text-red-600">
              Unable to load analytic accounts. The endpoint may not be available yet.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No analytic accounts found"
                description="Analytic accounts are seeded by the backend and tag order lines for budget tracking."
              />
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {(
                [
                  ["Income", income],
                  ["Expenses", expense],
                ] as const
              ).map(([label, rows]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/80 overflow-hidden"
                >
                  <div className="border-b border-border bg-surface-muted/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text">
                    {label} ({rows.length})
                  </div>
                  <ul className="divide-y divide-border">
                    {rows.map((account) => (
                      <li key={account.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                          <Tags className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">
                            {account.name}
                          </p>
                          {account.description && (
                            <p className="truncate text-xs text-text-muted">
                              {account.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {account.type}
                        </Badge>
                      </li>
                    ))}
                    {rows.length === 0 && (
                      <li className="px-4 py-6 text-center text-xs text-text-muted">
                        No {label.toLowerCase()} accounts.
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Write the route wrapper**

```tsx
import { RequireRole } from "@/components/require-role";
import { AnalyticAccountsPage } from "@/features/budgets/analytic-accounts-page";

export const metadata = {
  title: "Analytic Accounts | Urban Furniture Accounting",
};

export default function Page() {
  return (
    <RequireRole allowedRoles={["admin", "invoicing_user"]}>
      <AnalyticAccountsPage />
    </RequireRole>
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: exit 0; `/analytic-accounts` in the route list.

### Task 5.3: Budgets list + create form + confirm/revise actions

**Files:**
- Create: `frontend/src/features/budgets/budgets-page.tsx`
- Create: `frontend/src/app/(app)/budgets/page.tsx`

- [ ] **Step 1: Write the budgets page**

List view with status badges, achieved-% progress bar, per-row Confirm (draft only) and Revise (confirmed only) actions, and a create modal. Keep it one file, following the `journal-entries-page.tsx` modal idiom.

```tsx
/**
 * Budgets page (P1-FE-01b).
 *
 * Route: `/budgets`
 * List budgets with committed vs achieved progress; create, confirm, and revise.
 *
 * State OWNED: `search`, `isCreateOpen`, and the create-form fields.
 * State CONSUMED: budgets + analytic accounts via budgets-api hooks.
 * Source of truth: backend budgets endpoint (TanStack Query).
 */
"use client";

import { useState } from "react";
import { GitBranch, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatDate, formatINR } from "@/lib/format";
import {
  useAnalyticAccounts,
  useBudgets,
  useConfirmBudget,
  useCreateBudget,
  useReviseBudget,
  type BudgetStatus,
} from "./budgets-api";

const STATUS_VARIANT: Record<BudgetStatus, "outline" | "secondary" | "default" | "destructive"> = {
  draft: "outline",
  confirmed: "secondary",
  revised: "default",
  cancelled: "destructive",
};

export function BudgetsPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create-form fields
  const [name, setName] = useState("");
  const [analyticAccountId, setAnalyticAccountId] = useState<number>(0);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [committedAmount, setCommittedAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const budgetsQuery = useBudgets();
  const analyticQuery = useAnalyticAccounts();
  const createMutation = useCreateBudget();
  const confirmMutation = useConfirmBudget();
  const reviseMutation = useReviseBudget();

  const budgets = (budgetsQuery.data ?? []).filter((budget) => {
    const q = search.trim().toLowerCase();
    return !q || budget.name.toLowerCase().includes(q);
  });

  function resetForm() {
    setName("");
    setAnalyticAccountId(0);
    setPeriodStart("");
    setPeriodEnd("");
    setCommittedAmount("");
    setFormError(null);
  }

  function submitCreate() {
    const amount = Number(committedAmount);
    if (!name.trim()) return setFormError("Name is required.");
    if (!analyticAccountId) return setFormError("Select an analytic account.");
    if (!periodStart || !periodEnd) return setFormError("Select the budget period.");
    if (periodEnd < periodStart) return setFormError("End date must be after the start date.");
    if (!amount || amount <= 0) return setFormError("Committed amount must be greater than zero.");

    setFormError(null);
    createMutation.mutate(
      {
        name: name.trim(),
        analytic_account_id: analyticAccountId,
        period_start: periodStart,
        period_end: periodEnd,
        committed_amount: amount,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetForm();
        },
        onError: (error) =>
          setFormError(
            error instanceof Error ? error.message : "Unable to create budget."
          ),
      }
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Cost Accounting
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">
            Analytical Budgets
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Committed amounts vs achieved actuals per analytic account.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New Budget
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-5">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search budgets..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {budgetsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : budgetsQuery.isError ? (
            <div className="p-8 text-center text-sm text-red-600">
              Unable to load budgets. The endpoint may not be available yet.
            </div>
          ) : budgets.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No budgets yet"
                description="Create a budget to track committed vs achieved amounts for an analytic account."
                action={
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4" /> New Budget
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Analytic Account</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3 text-right">Committed</th>
                    <th className="px-5 py-3 text-right">Achieved</th>
                    <th className="px-5 py-3">Progress</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="hover:bg-surface-muted/40">
                      <td className="px-5 py-3 font-medium text-text">
                        {budget.name}
                        {budget.revised_from_id && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-text-muted">
                            <GitBranch className="h-3 w-3" /> revision
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-text-muted">
                        {budget.analytic_account_name ?? `#${budget.analytic_account_id}`}
                      </td>
                      <td className="px-5 py-3 text-text-muted">
                        {formatDate(budget.period_start)} → {formatDate(budget.period_end)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text">
                        {formatINR(budget.committed_amount)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text">
                        {formatINR(budget.achieved_amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, budget.achieved_percent))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-text-muted">
                            {Math.round(budget.achieved_percent)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_VARIANT[budget.status] ?? "outline"}>
                          {budget.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {budget.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={confirmMutation.isPending}
                              onClick={() => confirmMutation.mutate(budget.id)}
                            >
                              Confirm
                            </Button>
                          )}
                          {budget.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reviseMutation.isPending}
                              onClick={() => reviseMutation.mutate(budget.id)}
                            >
                              Revise
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-text">New Budget</h2>
            <p className="mt-1 text-sm text-text-muted">
              Budgets start in draft. Confirm to lock them; revise to create a new version.
            </p>

            <div className="mt-5 space-y-4 text-xs font-semibold text-text">
              <label className="block">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. FY26 Raw Materials"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                />
              </label>
              <label className="block">
                Analytic Account
                <select
                  value={analyticAccountId || ""}
                  onChange={(event) => setAnalyticAccountId(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                >
                  <option value="">Select analytic account</option>
                  {(analyticQuery.data ?? []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  Period start
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(event) => setPeriodStart(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                  />
                </label>
                <label className="block">
                  Period end
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(event) => setPeriodEnd(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                  />
                </label>
              </div>
              <label className="block">
                Committed Amount (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={committedAmount}
                  onChange={(event) => setCommittedAmount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                />
              </label>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create Budget"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write the route wrapper**

```tsx
import { RequireRole } from "@/components/require-role";
import { BudgetsPage } from "@/features/budgets/budgets-page";

export const metadata = {
  title: "Budgets | Urban Furniture Accounting",
};

export default function Page() {
  return (
    <RequireRole allowedRoles={["admin", "invoicing_user"]}>
      <BudgetsPage />
    </RequireRole>
  );
}
```

- [ ] **Step 3: Point the Account nav item at the new pages**

In `frontend/src/components/site-header.tsx`, change the Account category's "Analytical Budget" item (line ~81) to the real route, and add the analytic accounts page:

```ts
      { label: "Analytical Budget", href: "/budgets", description: "Production & operational cost centers" },
      { label: "Analytic Accounts", href: "/analytic-accounts", description: "Income & expense budget tags" },
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: exit 0; `/budgets` and `/analytic-accounts` in the route list.

---

## Phase 6 — Budget Report with Donut Chart (P1, task 9.2 FE part)

### Task 6.1: Budget report page (list + kanban with SVG donut)

**Files:**
- Create: `frontend/src/features/budgets/budget-report-page.tsx`
- Create: `frontend/src/app/(app)/reports/budget/page.tsx`

- [ ] **Step 1: Write the report page**

The donut is a dependency-free SVG (no recharts — see Architecture note at the top). The page reads from `useBudgets` (the same computed fields the list uses), so it works the moment the budgets endpoint lands; `GET /api/v1/reports/budget` can be adopted later without UI changes.

```tsx
/**
 * Budget Report page (P1-FE-01c).
 *
 * Route: `/reports/budget`
 * List ↔ Kanban toggle. Kanban cards show an Achieved vs Balance donut per budget.
 *
 * State OWNED: `view` ("list" | "kanban").
 * State CONSUMED: budgets via `useBudgets`.
 */
"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatDate, formatINR } from "@/lib/format";
import { useBudgets, type Budget } from "./budgets-api";

/** Dependency-free donut: emerald = achieved, track = remaining to achieve. */
function BudgetDonut({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28" role="img" aria-label={`${Math.round(clamped)}% achieved`}>
      <circle
        cx="50" cy="50" r={radius} fill="none" strokeWidth="12"
        className="stroke-border"
      />
      <circle
        cx="50" cy="50" r={radius} fill="none" strokeWidth="12" strokeLinecap="round"
        className="stroke-emerald-500 transition-all duration-500"
        strokeDasharray={`${filled} ${circumference - filled}`}
        transform="rotate(-90 50 50)"
      />
      <text
        x="50" y="54" textAnchor="middle"
        className="fill-current text-sm font-bold text-text"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

/** One budget as a kanban card with donut + committed/achieved/balance figures. */
function BudgetCard({ budget }: { budget: Budget }) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{budget.name}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {formatDate(budget.period_start)} → {formatDate(budget.period_end)}
          </p>
        </div>
        <Badge variant={budget.status === "confirmed" ? "secondary" : "outline"}>
          {budget.status}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <BudgetDonut percent={budget.achieved_percent} />
        <dl className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <dt className="text-text-muted">Achieved</dt>
            <dd className="ml-auto font-mono font-semibold text-text">
              {formatINR(budget.achieved_amount)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-border" />
            <dt className="text-text-muted">To achieve</dt>
            <dd className="ml-auto font-mono font-semibold text-text">
              {formatINR(budget.amount_to_achieve)}
            </dd>
          </div>
          <div className="flex items-center gap-2 border-t border-border/60 pt-1">
            <dt className="text-text-muted">Committed</dt>
            <dd className="ml-auto font-mono font-semibold text-text">
              {formatINR(budget.committed_amount)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function BudgetReportPage() {
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const budgetsQuery = useBudgets();
  const budgets = budgetsQuery.data ?? [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Financial Reports
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">
            Budget Report
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Committed vs achieved utilization per analytic budget.
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-surface-muted p-1 text-xs font-medium text-text-muted">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              view === "list" ? "bg-surface text-primary-600 font-semibold shadow-xs" : "hover:text-text"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              view === "kanban" ? "bg-surface text-primary-600 font-semibold shadow-xs" : "hover:text-text"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
      </div>

      {budgetsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : budgetsQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-red-600">
            Unable to load the budget report. The budgets endpoint may not be available yet.
          </CardContent>
        </Card>
      ) : budgets.length === 0 ? (
        <EmptyState
          title="No budgets to report on"
          description="Create and confirm a budget first — achieved amounts are computed from tagged invoices and bills."
        />
      ) : view === "kanban" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Committed</th>
                    <th className="px-5 py-3 text-right">Achieved</th>
                    <th className="px-5 py-3 text-right">% Achieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="hover:bg-surface-muted/40">
                      <td className="px-5 py-3 font-medium text-text">{budget.name}</td>
                      <td className="px-5 py-3 text-text-muted">
                        {formatDate(budget.period_start)} → {formatDate(budget.period_end)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={budget.status === "confirmed" ? "secondary" : "outline"}>
                          {budget.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text">
                        {formatINR(budget.committed_amount)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text">
                        {formatINR(budget.achieved_amount)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-text">
                        {Math.round(budget.achieved_percent)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write the route wrapper**

```tsx
import { RequireRole } from "@/components/require-role";
import { BudgetReportPage } from "@/features/budgets/budget-report-page";

export const metadata = {
  title: "Budget Report | Urban Furniture Accounting",
};

export default function Page() {
  return (
    <RequireRole allowedRoles={["admin", "invoicing_user"]}>
      <BudgetReportPage />
    </RequireRole>
  );
}
```

- [ ] **Step 3: Activate the Budget Report nav link**

In `frontend/src/components/site-header.tsx` Reports category, change:

```ts
      { label: "Budget Report", href: "/reports/budget", description: "Committed vs Achieved utilization metrics" },
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: exit 0; `/reports/budget` in the route list.

Browser: `/reports/budget` → kanban default with donuts; toggle to list; both handle the missing-endpoint error state cleanly.

---

## Phase 7 — Contact Portal & Role-Safe Navigation (P1, tasks 9.4/9.5 FE parts)

> **Contract gap to confirm with backend:** the locked contract has `GET /api/v1/portal/invoices` but no portal pay endpoint. The UI reuses the existing `payCustomerInvoice` client (`POST /api/v1/customer-invoices/:id/pay`); the backend must permit the `contact` role on it (scoped to their own invoices). If Kunal ships a dedicated `/api/v1/portal/invoices/:id/pay` instead, swap one function in `portal-api.ts` — the page does not change.

### Task 7.1: Portal API module

**Files:**
- Create: `frontend/src/features/portal/portal-api.ts`

- [ ] **Step 1: Write the module**

```ts
/**
 * Contact Portal API client (P1-FE-02).
 *
 * Self-service surface for users with the `contact` role: they see only
 * their own invoices (scoped server-side by their user's contact_id).
 *
 * Endpoint: GET /api/v1/portal/invoices (contract-locked, BE pending).
 * Records are mapped through the existing customer-invoice mapper so the
 * portal reuses `CustomerPaymentModal` and `payCustomerInvoice` unchanged.
 */

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  payCustomerInvoice,
  type CustomerInvoice,
  type CustomerPaymentInput,
} from "@/features/customer-invoices/customer-invoices-api";

/** Raw portal invoice record as returned by the portal endpoint. */
interface PortalInvoiceRecord {
  id: number;
  invoice_number: string;
  so_id?: number | null;
  customer_id: number;
  customer_name?: string | null;
  invoice_date: string;
  due_date?: string | null;
  total: number;
  amount_paid: number;
  status: string;
}

/** GET /api/v1/portal/invoices — the contact's own invoice ledger. */
export async function fetchPortalInvoices(): Promise<CustomerInvoice[]> {
  const res = await apiFetch<{ data: PortalInvoiceRecord[]; total: number }>(
    "/api/v1/portal/invoices",
    { auth: true }
  );

  return (res.data ?? []).map((raw) => {
    const status = (raw.status || "").toLowerCase();
    return {
      id: String(raw.id),
      invoice_number: raw.invoice_number,
      so_id: raw.so_id ?? null,
      so_number: raw.so_id ? `SO-${String(raw.so_id).padStart(4, "0")}` : null,
      customer_id: raw.customer_id,
      customer_name: raw.customer_name ?? "You",
      invoice_date: (raw.invoice_date ?? "").split("T")[0],
      due_date: (raw.due_date ?? raw.invoice_date ?? "").split("T")[0],
      status: status === "paid" ? "Paid" : status === "cancelled" ? "Cancelled" : "Confirmed",
      total_amount: raw.total,
      amount_paid: raw.amount_paid ?? 0,
      amount_due: Math.max(0, raw.total - (raw.amount_paid ?? 0)),
      created_at: raw.invoice_date,
      lines: [],
    } satisfies CustomerInvoice;
  });
}

/** Portal queries are keyed per user — never share the internal invoice cache. */
export function usePortalInvoices() {
  return useQuery({
    queryKey: QUERY_KEYS.PORTAL_INVOICES,
    queryFn: fetchPortalInvoices,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/** Record a payment against the contact's own invoice. */
export async function payPortalInvoice(
  invoiceId: string,
  input: CustomerPaymentInput
) {
  return payCustomerInvoice(invoiceId, input);
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: exit 0.

### Task 7.2: Portal page ("My Invoices")

**Files:**
- Create: `frontend/src/features/portal/portal-page.tsx`
- Create: `frontend/src/app/(app)/portal/page.tsx`

- [ ] **Step 1: Write the portal page**

Reuses `CustomerPaymentModal` (props: `invoice`, `open`, `onClose`, `onSubmit`, `isSubmitting`, `error`) so the pay flow is identical to the internal one.

```tsx
/**
 * Contact Portal page (P1-FE-02) — "My Invoices".
 *
 * Route: `/portal` — the home surface for users with the `contact` role.
 * Shows only their own invoices and lets them record a payment.
 *
 * State OWNED: `payingInvoice` (invoice currently in the payment modal),
 *              `submitting` / `payError` for the mutation.
 * State CONSUMED: own invoices via `usePortalInvoices` (per-user query key).
 */
"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { CustomerPaymentModal } from "@/features/customer-invoices/customer-payment-modal";
import type {
  CustomerInvoice,
  CustomerPaymentInput,
} from "@/features/customer-invoices/customer-invoices-api";
import { formatDate, formatINR } from "@/lib/format";
import { QUERY_KEYS } from "@/lib/constants";
import { payPortalInvoice, usePortalInvoices } from "./portal-api";

export function PortalPage() {
  const queryClient = useQueryClient();
  const invoicesQuery = usePortalInvoices();
  const invoices = invoicesQuery.data ?? [];

  const [payingInvoice, setPayingInvoice] = useState<CustomerInvoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function submitPayment(input: CustomerPaymentInput) {
    if (!payingInvoice) return;
    setSubmitting(true);
    setPayError(null);
    try {
      await payPortalInvoice(payingInvoice.id, input);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PORTAL_INVOICES });
      setPayingInvoice(null);
    } catch (error) {
      setPayError(error instanceof Error ? error.message : "Unable to record payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
          Customer Portal
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">My Invoices</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your invoices from Urban Furniture and their payment status.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : invoicesQuery.isError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">Unable to load your invoices.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => void invoicesQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No invoices yet"
                description="When Urban Furniture bills you, your invoices will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Balance Due</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-surface-muted/40">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-primary-600">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-5 py-3 text-text-muted">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-5 py-3 text-text-muted">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text">
                        {formatINR(invoice.total_amount)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text">
                        {formatINR(invoice.amount_due)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={invoice.status === "Paid" ? "secondary" : "outline"}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {invoice.amount_due > 0 && invoice.status !== "Cancelled" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setPayError(null);
                              setPayingInvoice(invoice);
                            }}
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {payingInvoice && (
        <CustomerPaymentModal
          invoice={payingInvoice}
          open={Boolean(payingInvoice)}
          onClose={() => setPayingInvoice(null)}
          onSubmit={(input) => void submitPayment(input)}
          isSubmitting={submitting}
          error={payError}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write the route wrapper** — guarded to the `contact` role:

```tsx
import { RequireRole } from "@/components/require-role";
import { PortalPage } from "@/features/portal/portal-page";

export const metadata = {
  title: "My Invoices | Urban Furniture Accounting",
};

export default function Page() {
  return (
    <RequireRole allowedRoles={["contact"]}>
      <PortalPage />
    </RequireRole>
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: exit 0; `/portal` in the route list.

### Task 7.3: Role-safe navigation

**Files:**
- Modify: `frontend/src/components/site-header.tsx:145-156` (category filtering)
- Modify: `frontend/src/app/(app)/page.tsx` (dashboard redirect for contact users)

- [ ] **Step 1: Hide internal modules from contact users**

In `site-header.tsx`, replace the `categories` memo so `contact`-role users see only the portal:

```tsx
  // Remove admin-only items for non-admin users; contacts get the portal only.
  const categories = useMemo(() => {
    if (userRole === "contact") {
      return [
        {
          id: "account" as const,
          label: "Portal",
          color: "bg-amber-500",
          items: [
            { label: "My Invoices", href: "/portal", description: "Your invoices & payments" },
          ],
        },
      ];
    }
    return NAV_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (item.adminOnly && userRole !== "admin") return false;
        return true;
      }),
    }));
  }, [userRole]);
```

- [ ] **Step 2: Redirect contact users off the dashboard**

In `frontend/src/app/(app)/page.tsx`, add near the top of `AppDashboardPage` (after the existing hooks):

```tsx
  const { user } = useAuth();
  const router = useRouter();

  // Contact-role users land on the portal, not the internal dashboard.
  useEffect(() => {
    if (user?.role === "contact") {
      router.replace("/portal");
    }
  }, [user, router]);
```

Add the imports (`useAuth` from `@/features/auth/auth-context`, `useRouter` from `next/navigation`). `useEffect` is already imported.

- [ ] **Step 3: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: exit 0.

Browser: log in as a contact-role user → you land on `/portal`, and the header shows only "Portal → My Invoices". Log in as admin → full nav unchanged. (Server-side 403s remain the real enforcement; this is UX only.)

---

## Phase 8 — Polish & Golden-Path Verification (P0 finish, task 11.1 FE parts)

### Task 8.1: Empty / error / loading state audit

**Files:**
- Review only (no new files): all routes created in Phases 2–7

- [ ] **Step 1: With the backend reports/budget/portal endpoints still down, visit each new route and confirm the designed fallback renders**

Checklist: `/reports/balance-sheet` (error card + Retry), `/reports/pnl` (error card + Retry), `/reports/budget` (error card), `/budgets` (error message), `/analytic-accounts` (error message), `/portal` (error card + Retry as a contact user). No white screens, no unhandled promise rejections in the console.

- [ ] **Step 2: Confirm loading states**

Throttle network to "Slow 3G" in DevTools → each new page shows `LoadingSpinner`, not a blank area.

### Task 8.2: Responsive & keyboard pass

**Files:**
- Modify only if defects found: the new pages above

- [ ] **Step 1: Responsive check**

Viewport 390px (phone) and 1440px (laptop): report grids collapse to one column (`grid lg:grid-cols-2` already does), tables scroll horizontally (`overflow-x-auto` already present), the budget kanban collapses (`sm:grid-cols-2 xl:grid-cols-3`), modals fit (`max-h-[92vh] overflow-y-auto` pattern). Fix any overflow found.

- [ ] **Step 2: Keyboard check**

Tab through: nav dropdowns open/close, date inputs focusable, modal Cancel/Submit reachable, ESC closes the dashboard modals (already implemented) — add ESC handling to the budget create modal if missing:

In `budgets-page.tsx`, inside `BudgetsPage`, add:

```tsx
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsCreateOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
```

(`useEffect` must be added to the React import.)

### Task 8.3: Full golden-path verification

**Files:**
- Modify: `docs/TASK_BOARD.md` (check off completed items after verification)

- [ ] **Step 1: Run the golden path from `docs/frontend/LOGIC.md` steps 1–15 in the browser**

With the backend running (and its reports endpoints landed): login → dashboard KPIs → create vendor/product → PO → confirm → create bill → pay → SO → confirm → generate invoice → pay → journal entries balanced → **Balance Sheet shows Total Assets == Total Liabilities + Capital with the Balanced badge** → **P&L shows Net Profit** → (P1) create budget, confirm, watch achieved % move on `/reports/budget` after transactions → (P1) log in as contact, pay own invoice in `/portal`.

- [ ] **Step 2: Final gates**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run build`
Expected: all three pass with zero errors.

- [ ] **Step 3: Update the task board**

In `docs/TASK_BOARD.md`, check off: 7B.2, 7B.3, 9.2, 9.5, 10.1, and 11.1 (FE portions) as they verify. Do not commit unless the user asks.

---

## Execution Order Summary

| Phase | Scope | Priority | Depends on |
|---|---|---|---|
| 0 | Fix 26 TS errors (dashboard + error utils) | P0 blocker | — |
| 1 | Reports API client + query keys | P0 | 0 |
| 2 | Balance Sheet page + route | P0 | 1 |
| 3 | P&L page + route | P0 | 1 |
| 4 | Nav links, dashboard links, KPI cards | P0 | 2, 3 |
| 5 | Analytic accounts + budgets pages | P1 | 4 |
| 6 | Budget report + donut + nav link | P1 | 5 |
| 7 | Contact portal + role-safe nav | P1 | 4 |
| 8 | Polish + golden-path verification | P0 | all |

Phases 2 and 3 are independent of each other; Phases 5–7 can run in parallel with each other once Phase 4 lands. Backend report/budget/portal endpoints (Kunal's tasks 7B.1, 9.1, 9.4) can land at any point — the frontend handles their absence gracefully by design.
