# TanStack Query Adoption — Design Spec

**Date:** 2026-09-05
**Status:** Approved (user delegated approach choice to assistant; Approach 1 selected)

## Problem

`@tanstack/react-query` 5.80.7 is installed and a `QueryClientProvider` is mounted at the
root (`src/components/query-provider.tsx` → `app-providers.tsx` → `app/layout.tsx`), but
**no screen uses it**. All data fetching is hand-rolled `useEffect` + `useState` +
`apiFetch`, which contradicts `docs/frontend/ARCHITECTURE_DECISIONS.md` ADR-02
("TanStack Query owns server data and cache").

Manual fetching today means: duplicated loading/error boilerplate per page, `ignore`
cleanup flags, no caching between pages, and manual list-sync after creates.

## Goals

- All server-data reads go through `useQuery` via small feature-level hooks.
- All writes (login, signup, admin create-user) go through `useMutation`.
- Admin user list updates after create via cache invalidation (no manual prepend).
- No behavior regressions: dashboard fallback-to-demo-data, toasts, error UI,
  form field-error mapping, and role gates all keep working exactly as today.

## Non-Goals (YAGNI)

- **Auth session stays in `AuthContext`** (ADR-02). `/auth/me` bootstrap, token
  storage, `RequireAuth` / `RequireRole` guards: untouched.
- No React Query DevTools, no persistence, no prefetching, no optimistic PO/SO
  creates (no backend endpoints exist for those yet).
- No test-runner setup (frontend has none; verification = typecheck + lint + browser).
- `fetchDashboardAccounts` / `fetchDashboardJournals` have no consumers — no hooks
  created for them.

## Chosen Approach: Feature Query Hooks + Mutations in Form Hooks

One small `queries.ts` per feature exposing hooks with stable query keys. Pages
consume hooks and delete their fetch machinery. Form hooks (`use-login-form`,
`use-signup-form`) keep their public API but swap `isSubmitting` + try/catch for
`useMutation` (`isPending` + `onSuccess`/`onError`).

Rejected alternatives:
- **Inline `useQuery` in pages** — scatters query keys, duplicates the
  contacts/products calls shared by dashboard and sales-orders.
- **Move auth session into Query cache** — violates ADR-02, forces guard rewrites,
  no practical gain.

## File Map

### New

| File | Responsibility |
|---|---|
| `frontend/src/features/dashboard/queries.ts` | `useContacts()`, `useProducts()` |
| `frontend/src/features/orders/queries.ts` | `useSalesOrders(enabled)`, `usePurchaseOrders(enabled)` |
| `frontend/src/features/users/users-api.ts` | `fetchUsers()`, `createUser()` (raw calls moved out of UI) |
| `frontend/src/features/users/queries.ts` | `useUsers()`, `useCreateUser()` (invalidates `["users"]`) |

### Modified

| File | Change |
|---|---|
| `frontend/src/app/(app)/page.tsx` | Replace init `useEffect` + contacts/products state with `useContacts()`/`useProducts()`; keep orders as local state seeded once from query data; refresh button → `refetch()` |
| `frontend/src/features/orders/orders-list-page.tsx` | Replace load `useEffect` with the two order hooks (`enabled` gates the inactive kind); error UI reads from query error |
| `frontend/src/app/(app)/admin/users/page.tsx` | `useUsers()`; refresh → `refetch()`; drop `onSuccess` prepend (invalidation handles it) |
| `frontend/src/features/auth/hooks/use-login-form.ts` | `useMutation` around `AuthContext.login`; error mapping moves to `onError` |
| `frontend/src/features/auth/hooks/use-signup-form.ts` | `useMutation` around `register` + `useCreateUser` for admin-create mode |

## Key Design Decisions

1. **Query keys are flat literals:** `["contacts"]`, `["products"]`,
   `["sales-orders"]`, `["purchase-orders"]`, `["users"]`. A key factory is
   overkill at this scale.
2. **`enabled` flag on order hooks.** `OrdersListPage` is shared by
   `/sales-orders` and `/purchase-orders`; hooks can't be conditional, so both are
   called and `enabled` ensures only the active kind fetches.
3. **Dashboard orders = derived base + local addition layers.** Sales orders /
   POs / bills are demo entities with client-side create/convert actions and no
   backend endpoints. The base is a `useMemo` over the query data; user creations
   live in separate prepend-only lists (`createdOrders` / `createdPOs` /
   `createdBills`) and PO status overrides (`billedPoIds`) layered on top.
   Manual refresh clears the local layers. (A seed-once `useEffect` was the
   original plan and was rejected during implementation: React 19's
   `react-hooks/set-state-in-effect` rule forbids synchronous setState in
   effects, and the layered model also keeps local creates safe from background
   refetches.)
4. **Dashboard fetchers keep swallowing errors** (return `[]` → fallback demo
   data). That is intended product behavior, preserved as-is. Purchase-orders
   fetcher *does* throw, so its query drives the orders-list error UI.
5. **`useCreateUser` does optimistic prepend + invalidate:** `setQueryData` puts
   the new user at the top instantly, `invalidateQueries` revalidates from the
   server.
6. **Provider defaults already correct** (30 s staleTime, retry 1, no
   refetch-on-focus) — `query-provider.tsx` is not modified.

## Error Handling

- Queries: dashboard fetchers return `[]` on failure (fallback path, unchanged).
  `fetchPurchaseOrders` throws → `usePurchaseOrders().error` → existing error
  panel in `orders-list-page.tsx`.
- Mutations: existing `ApiError` field-mapping (422 → field errors, 401/403/409 →
  notices) moves verbatim into `onError` handlers.

## Verification

1. `npx tsc --noEmit` — clean.
2. `npm run lint` — clean.
3. Browser pass against dev servers (frontend :3000, backend :8000):
   login → dashboard loads with no console `ApiError` → /sales-orders →
   /purchase-orders (incl. error state visible if backend stopped) →
   /admin/users gated correctly for non-admin.
