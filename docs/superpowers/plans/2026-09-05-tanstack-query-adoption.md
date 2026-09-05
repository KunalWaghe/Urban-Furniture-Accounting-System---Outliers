# TanStack Query Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route all server-data reads through `useQuery` feature hooks and all auth/user writes through `useMutation`, deleting every hand-rolled fetch `useEffect`.

**Architecture:** One `queries.ts` per feature with stable literal query keys; pages consume hooks. Auth session stays in `AuthContext` (ADR-02). Dashboard order entities remain local state, seeded once from query data. No frontend test runner exists — verification is `tsc --noEmit`, `eslint`, and a live browser pass.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19, @tanstack/react-query 5.80.7, TypeScript 5.

**IMPORTANT — commits:** Do NOT run `git commit` at any point. The user has not requested commits. Leave all changes in the working tree.

**Spec:** `docs/superpowers/specs/2026-09-05-tanstack-query-adoption-design.md`

---

### Task 1: Dashboard query hooks

**Files:**
- Create: `frontend/src/features/dashboard/queries.ts`

- [ ] **Step 1: Create the hooks file**

```ts
import { useQuery } from "@tanstack/react-query";

import { fetchDashboardContacts, fetchDashboardProducts } from "./dashboard-api";

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: fetchDashboardContacts,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchDashboardProducts,
  });
}
```

Note: `fetchDashboardContacts`/`fetchDashboardProducts` catch errors internally and
return `[]` (dashboard fallback-to-demo-data behavior). These queries therefore never
enter an error state — that is intentional and unchanged.

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors related to `features/dashboard/queries.ts`

---

### Task 2: Orders query hooks

**Files:**
- Create: `frontend/src/features/orders/queries.ts`

- [ ] **Step 1: Create the hooks file**

`OrdersListPage` is shared by `/sales-orders` and `/purchase-orders`. React hooks
cannot be called conditionally, so both hooks are always called and `enabled`
ensures only the active kind actually fetches.

```ts
import { useQuery } from "@tanstack/react-query";

import { fetchPurchaseOrders, fetchSalesOrders } from "./orders-api";

export function useSalesOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["sales-orders"],
    queryFn: fetchSalesOrders,
    enabled,
  });
}

export function usePurchaseOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: fetchPurchaseOrders,
    enabled,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors related to `features/orders/queries.ts`

---

### Task 3: Users feature — API module + query/mutation hooks

**Files:**
- Create: `frontend/src/features/users/users-api.ts`
- Create: `frontend/src/features/users/queries.ts`

- [ ] **Step 1: Create `users-api.ts`**

`AdminCreateUserRequest` already exists in `frontend/src/lib/types.ts` (lines 14-21).

```ts
import { apiFetch } from "@/lib/api";
import type { AdminCreateUserRequest, AuthUser } from "@/lib/types";

export async function fetchUsers(): Promise<AuthUser[]> {
  return apiFetch<AuthUser[]>("/api/v1/users", { auth: true });
}

export async function createUser(
  payload: AdminCreateUserRequest
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/v1/users", {
    method: "POST",
    body: payload,
    auth: true,
  });
}
```

- [ ] **Step 2: Create `queries.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AuthUser } from "@/lib/types";

import { createUser, fetchUsers } from "./users-api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (createdUser) => {
      // Prepend instantly, then revalidate from the server.
      queryClient.setQueryData<AuthUser[]>(["users"], (prev) => [
        createdUser,
        ...(prev ?? []),
      ]);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors related to `features/users/`

---

### Task 4: Migrate dashboard page

**Files:**
- Modify: `frontend/src/app/(app)/page.tsx` (lines 1-143 region)

- [ ] **Step 1: Swap the data imports**

Replace:

```ts
import {
  fetchDashboardContacts,
  fetchDashboardProducts,
  buildDashboardDataFromBackend,
} from "@/features/dashboard/dashboard-api";
```

with:

```ts
import { buildDashboardDataFromBackend } from "@/features/dashboard/dashboard-api";
import { useContacts, useProducts } from "@/features/dashboard/queries";
```

- [x] **Step 2: Replace contacts/products state with queries** *(as executed)*

Replaced the `loading`/`contacts`/`products` state with `useContacts()` /
`useProducts()` destructured as `data`/`isLoading`/`refetch`, plus memoized
`contacts`/`products` arrays and a combined `loading` flag.

- [x] **Step 3: Replace entity state with derived base + local addition layers** *(revised during execution)*

The planned seed-once `useEffect` was rejected by React 19's
`react-hooks/set-state-in-effect` ESLint rule. As executed instead:

```ts
  // Server-derived demo entities (no backend order endpoints yet)
  const baseData = useMemo(
    () => (loading ? null : buildDashboardDataFromBackend(contacts, products)),
    [loading, contacts, products]
  );

  const [createdOrders, setCreatedOrders] = useState<SalesOrder[]>([]);
  const [createdPOs, setCreatedPOs] = useState<PurchaseOrder[]>([]);
  const [createdBills, setCreatedBills] = useState<VendorBill[]>([]);
  const [billedPoIds, setBilledPoIds] = useState<Record<string, true>>({});

  const salesOrders = useMemo(
    () => [...createdOrders, ...(baseData?.salesOrders ?? [])],
    [createdOrders, baseData]
  );
  const purchaseOrders = useMemo(
    () => [
      ...createdPOs,
      ...(baseData?.purchaseOrders ?? []).map((po) =>
        billedPoIds[po.id] ? { ...po, status: "Partially Billed" as const } : po
      ),
    ],
    [createdPOs, baseData, billedPoIds]
  );
  const vendorBills = useMemo(
    () => [...createdBills, ...(baseData?.vendorBills ?? [])],
    [createdBills, baseData]
  );
  const budgetMetric = baseData?.budgetMetric ?? null;
```

`handleConvertPOToBill` now calls `setCreatedBills` + `setBilledPoIds`; the
create modals call `setCreatedOrders` / `setCreatedPOs`; the unused
`BudgetMetric` import was removed.

- [x] **Step 4: Replace `handleRefresh`** *(as executed)*

```ts
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchContacts(), refetchProducts()]);
      setCreatedOrders([]);
      setCreatedPOs([]);
      setCreatedBills([]);
      setBilledPoIds({});
      showToast("Backend data refreshed successfully.");
    } catch (err) {
      console.error("Failed to refresh dashboard data:", err);
      showToast("Could not sync with backend. Using cached domain models.");
    }
  }, [refetchContacts, refetchProducts, showToast]);
```

The init `useEffect` was deleted entirely (no seeding effect needed under the
derived-base model).

- [ ] **Step 5: Typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors in `src/app/(app)/page.tsx` (`Contact`/`Product` type imports
are still used by the modal subcomponents; `useEffect` is still used by the
keyboard/navigation effects)

---

### Task 5: Migrate orders list page

**Files:**
- Modify: `frontend/src/features/orders/orders-list-page.tsx` (lines 17-95 region)

- [ ] **Step 1: Swap the fetcher import**

Replace:

```ts
import { fetchPurchaseOrders, fetchSalesOrders } from "./orders-api";
```

with:

```ts
import { usePurchaseOrders, useSalesOrders } from "./queries";
```

- [ ] **Step 2: Replace fetch state + effect with queries**

Replace:

```ts
  const isSales = kind === "sales";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = isSales ? fetchSalesOrders : fetchPurchaseOrders;

    load()
      .then((nextOrders) => {
        if (!ignore) {
          setOrders(nextOrders);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load orders");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isSales]);
```

with:

```ts
  const isSales = kind === "sales";
  // Both hooks are called unconditionally (rules of hooks); `enabled` makes
  // sure only the active kind actually hits the network.
  const salesQuery = useSalesOrders(isSales);
  const purchaseQuery = usePurchaseOrders(!isSales);
  const activeQuery = isSales ? salesQuery : purchaseQuery;

  const orders = useMemo<Order[]>(() => activeQuery.data ?? [], [activeQuery.data]);
  const loading = activeQuery.isLoading;
  const error = activeQuery.error
    ? activeQuery.error instanceof Error
      ? activeQuery.error.message
      : "Failed to load orders"
    : null;

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
```

The rest of the component (`filteredOrders`, stat cards, error panel, tables,
`OrderDetails` modal) is unchanged — it already consumes `orders`, `loading`,
`error`.

- [ ] **Step 3: Typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors in `orders-list-page.tsx` (`useEffect` import stays — the
Escape-key effect still uses it)

---

### Task 6: Migrate admin users page

**Files:**
- Modify: `frontend/src/app/(app)/admin/users/page.tsx`

- [ ] **Step 1: Replace imports**

Replace:

```ts
import { useEffect, useState } from "react";
import { Shield, UserPlus, Users, RefreshCw } from "lucide-react";

import { RequireRole } from "@/components/require-role";
import { SignupForm } from "@/features/auth/components/signup-form";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/lib/types";
```

with:

```ts
import { Shield, UserPlus, Users, RefreshCw } from "lucide-react";

import { RequireRole } from "@/components/require-role";
import { SignupForm } from "@/features/auth/components/signup-form";
import { useUsers } from "@/features/users/queries";
```

- [ ] **Step 2: Replace state, `loadUsers`, and the `useEffect`**

Replace everything from `const [users, setUsers] = useState<AuthUser[]>([]);`
through the end of the `useEffect` block with:

```ts
  const { data: users = [], isLoading: loading, refetch: refetchUsers } = useUsers();
```

- [ ] **Step 3: Update the refresh button and `SignupForm` usage**

Refresh button: replace `onClick={loadUsers}` with `onClick={() => void refetchUsers()}`.

Replace:

```tsx
            <SignupForm
              mode="admin-create"
              onSuccess={(user) => setUsers((prev) => [user, ...prev])}
              cancelHref="/"
            />
```

with:

```tsx
            <SignupForm mode="admin-create" cancelHref="/" />
```

(`onSuccess` is optional on `SignupFormProps`; `useCreateUser` inside the form
hook now prepends the created user into the `["users"]` cache and revalidates.)

- [ ] **Step 4: Typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors in `admin/users/page.tsx`

---

### Task 7: Migrate login form to `useMutation`

**Files:**
- Modify: `frontend/src/features/auth/hooks/use-login-form.ts`

- [ ] **Step 1: Add imports**

Add to the top of the file:

```ts
import { useMutation } from "@tanstack/react-query";
```

Add `LoginRequest` to the type imports:

```ts
import type { LoginRequest } from "@/lib/types";
```

- [ ] **Step 2: Create the mutation and remove `isSubmitting` state**

Replace:

```ts
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
```

with:

```ts
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const loginMutation = useMutation({
    mutationFn: ({
      payload,
      remember,
    }: {
      payload: LoginRequest;
      remember: boolean;
    }) => login(payload, remember),
  });
```

- [ ] **Step 3: Rewrite `handleSubmit`'s submit path**

Keep the validation block unchanged. Replace everything from
`setIsSubmitting(true);` to the end of the function with:

```ts
    setNotice(null);

    loginMutation.mutate(
      {
        payload: {
          login_id: fields.login_id.trim(),
          password: fields.password,
        },
        remember: rememberDevice,
      },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: handleLoginError,
      }
    );
  }

  function handleLoginError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 422 && error.fields) {
        const apiErrors = mapApiFieldsToLoginErrors(error.fields);
        setErrors((prev) => ({ ...prev, ...apiErrors }));
        setNotice({
          kind: "error",
          title: "Unable to sign in",
          message: error.message,
        });
        const firstApiInvalid = FIELD_ORDER.find((field) => apiErrors[field]);
        if (firstApiInvalid) {
          document.getElementById(firstApiInvalid)?.focus();
        }
        return;
      }

      if (error.status === 401) {
        setNotice({
          kind: "error",
          title: "Invalid credentials",
          message: error.message,
        });
        document.getElementById("password")?.focus();
        return;
      }

      if (error.status === 403) {
        setNotice({
          kind: "error",
          title: "Account Inactive",
          message: error.message || "Your account has been deactivated. Contact an administrator.",
        });
        return;
      }
    }

    setNotice({
      kind: "error",
      title: "Unable to sign in",
      message: getAuthErrorMessage(
        error,
        "Something went wrong. Please try again."
      ),
    });
  }
```

(This is the existing catch body moved verbatim into `handleLoginError`; the
`finally { setIsSubmitting(false) }` disappears because `isPending` tracks it.)

- [ ] **Step 4: Update the return value**

Replace `isSubmitting,` in the returned object with:

```ts
    isSubmitting: loginMutation.isPending,
```

- [ ] **Step 5: Typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors in `use-login-form.ts`

---

### Task 8: Migrate signup form to `useMutation`

**Files:**
- Modify: `frontend/src/features/auth/hooks/use-signup-form.ts`

- [ ] **Step 1: Update imports**

Replace:

```ts
import { apiFetch, ApiError } from "@/lib/api";
```

with:

```ts
import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import { useCreateUser } from "@/features/users/queries";
```

(`apiFetch` is no longer called directly here; `ApiError` stays for
`handleApiError`.)

Then extend the existing type import later in the file — change
`import type { AuthUser } from "@/lib/types";` to
`import type { AuthUser, RegisterRequest } from "@/lib/types";`
(merging into the existing line avoids an `import/no-duplicates` lint error).

- [ ] **Step 2: Create the mutations and remove `isSubmitting` state**

Replace:

```ts
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
```

with:

```ts
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
  });
  const createUserMutation = useCreateUser();
```

- [ ] **Step 3: Rewrite the admin-create branch**

Replace everything from `setIsSubmitting(true);` / `setNotice(null);` through the
end of the `if (mode === "admin-create") { ... return; }` block with:

```ts
    setNotice(null);

    if (mode === "admin-create") {
      createUserMutation.mutate(
        {
          name: fields.name.trim(),
          login_id: fields.login_id.trim(),
          email: fields.email.trim(),
          password: fields.password,
          role: fields.role || "invoicing_user",
        },
        {
          onSuccess: (res) => {
            setNotice({
              kind: "info",
              title: "User Created Successfully",
              message: `Account '${res.login_id}' created with role '${res.role}'.`,
            });

            setFields({
              name: "",
              login_id: "",
              email: "",
              password: "",
              confirmPassword: "",
              role: "invoicing_user",
              acceptedTerms: false,
            });
            setErrors({});
            onSuccess?.(res);
          },
          onError: (error) => handleApiError(error, "create user"),
        }
      );
      return;
    }
```

- [ ] **Step 4: Rewrite the public signup branch**

Replace the `try { await register(...); router.push("/"); } catch ... finally ...`
block with:

```ts
    // mode === "signup": Public registration creates user role (contact)
    registerMutation.mutate(
      {
        name: fields.name.trim(),
        login_id: fields.login_id.trim(),
        email: fields.email.trim(),
        password: fields.password,
      },
      {
        onSuccess: () => router.push("/"),
        onError: (error) => handleApiError(error, "create account"),
      }
    );
  }
```

`handleApiError` itself is unchanged.

- [ ] **Step 5: Update the return value**

Replace `isSubmitting,` in the returned object with:

```ts
    isSubmitting: registerMutation.isPending || createUserMutation.isPending,
```

- [ ] **Step 6: Typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors in `use-signup-form.ts`

---

### Task 9: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: zero errors/warnings introduced

- [ ] **Step 2: Browser pass against running dev servers**

Frontend is already running on `http://localhost:3000`, backend on
`http://localhost:8000`.

1. Open `http://localhost:3000/login`, sign in with a valid account.
2. Land on dashboard `/`: confirm contacts/products load (stat tiles populate)
   and the browser console shows **no** `ApiError` / 401 entries.
3. Open `/sales-orders`: table populates; navigate away and back within 30 s —
   no duplicate network request (cache hit).
4. Open `/purchase-orders`: table populates from the real backend endpoint.
5. Open `/admin/users` with a non-admin account: role gate still blocks.
6. Stop the backend, reload `/purchase-orders`: the error panel
   ("Could not load purchase orders") renders. Restart backend.

- [ ] **Step 3: Report**

Summarize: files changed, verification evidence (tsc/lint output, browser
observations), and remind the user that changes are uncommitted — ask whether to
commit with a Conventional Commits message.
