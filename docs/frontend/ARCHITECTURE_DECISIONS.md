# Frontend Architecture Decisions — Sourabh

> **Reviewer Pitch (30 seconds):**  
> *"We chose Next.js 14 with TypeScript and shadcn/ui so we could build a dense, reliable accounting UI fast. We strictly separate state into 4 simple buckets (URL, Server Cache, Forms, Auth), route all calls through a single typed API client with automatic error handling, and guarantee that every screen handles loading, empty, and error states gracefully."*

---

## 1. Tech Stack (What & Why)

| Choice | What We Use | Why We Chose It (Simple Words) |
|---|---|---|
| **Framework** | **Next.js 14 (App Router)** | Fast file-based routing and nested layouts for dashboard & tables. |
| **UI & Styling** | **Tailwind CSS + shadcn/ui** | Pre-built accessible components (Dialogs, Tables, Dropdowns) that look like enterprise software out of the box. Saves 3–4 hours of styling. |
| **Server Data** | **TanStack Query** | Fetches and caches backend data automatically. Refetches fresh data whenever an order, bill, or payment is created. |
| **Forms & Math** | **React Hook Form + Zod** | Handles dynamic line items and instant tax/subtotal calculation without laggy re-renders. |
| **Auth** | **JWT Bearer Token + Context** | Simple token stored in `localStorage`, sent automatically in every API header. |

---

## 2. Clean Folder Boundaries

```text
src/
├── app/          # Pages & Routes (/login, /dashboard, /purchase-orders, /reports)
├── components/   # Reusable UI pieces (tables, modals, forms, sidebar shell)
├── lib/
│   ├── api.ts    # Single typed fetch client (handles JWT, baseURL, errors)
│   ├── types.ts  # Shared TypeScript models matching the backend
│   └── utils.ts  # Currency (₹ INR) and date formatting helpers
└── hooks/        # useAuth (session) & useQuery (data fetching)
```

**Rule:** UI components never call raw `fetch()` URLs directly. They always talk through `lib/api.ts`.

---

## 3. Key Architectural Decisions (ADRs) in Plain English

### ADR-01: Next.js 14 + shadcn/ui for Speed & Polish
- **Decision:** Use Next.js 14 App Router with shadcn/ui components.
- **Why to Reviewer:** *"In a 24-hour hackathon, we cannot spend hours writing custom table styles or modal dialogs. shadcn gives us accessible, production-ready enterprise widgets instantly."*

### ADR-02: Strict State Separation (No Messy Global Store)
- **Decision:** We split state into 4 simple layers:
  1. **URL:** Owns filters, search terms, and active tabs (`?status=draft`).
  2. **TanStack Query:** Owns server data and cache (Contacts, Orders, Reports).
  3. **React Hook Form:** Owns live user typing and line items.
  4. **Auth Context:** Only owns the logged-in user and JWT token.
- **Why to Reviewer:** *"We avoided a giant, messy Redux store. Server data stays in the server cache, form inputs stay in the form, and filter links remain bookmarkable."*

### ADR-03: Single Typed API Client with Standard Error Envelope
- **Decision:** All requests pass through `lib/api.ts`, which injects the JWT token and unwraps backend error responses (`VALIDATION_ERROR`, `CONFLICT`, etc.).
- **Why to Reviewer:** *"If backend routes or error formats change, we only fix one file (`api.ts`), not 15 different screens."*

### ADR-04: Resilient UI States (Zero Broken Demo Screens)
- **Decision:** Every table and page must handle 5 states: **Loading Skeleton**, **Empty State with CTA**, **Error with Retry Button**, **Background Refresh**, and **Success**.
- **Why to Reviewer:** *"Nothing looks worse in an accounting demo than a blank screen or a crash on an empty list. Our tables always show helpful guidance."*

### ADR-05: Real-Time Live Math, Backend Authoritative
- **Decision:** Line items calculate Subtotal, GST, and Total live on keystroke for instant feedback, but the backend double-checks and validates the numbers upon submit.
- **Why to Reviewer:** *"The user gets instantaneous UI responsiveness, but the backend remains the strict authority for accounting accuracy."*

### ADR-06: Route Group Isolation & Feature Collocation for Auth
- **Decision:** Auth pages (`/login`, `/signup`, `/forgot-password`) are decoupled from the main dashboard shell using Next.js route groups (`(auth)` vs `(app)`), collocating hooks, validation, and presentation under `src/features/auth/`.
- **Why to Reviewer:** *"This eliminates conditional layout hacks in the root shell, ensuring clean full-screen auth branding while keeping form state hooks independently testable and API-backed."*

### ADR-07: Login ID and server-authoritative role gates
- **Decision:** Login submits `login_id` plus password. Email remains a separately unique user field. Public signup never accepts a role and always creates `invoicing_user`; only the Admin Create User flow may select Admin, Accountant, or User.
- **Why:** The Excalidraw explicitly separates Login ID from email and makes role assignment an authorization concern. The frontend hides unavailable navigation, but the backend remains the security authority.
- **Consequence:** The existing email-based auth UI is a baseline and must be corrected before auth integration is considered complete. `contact_id` must be included in the authenticated user profile for portal scoping.

---

## 4. Reviewer Cheat Sheet (How to Answer Questions)

- **Q: Why not just plain Vite + React?**  
  *A: Next.js gives us robust routing, layout persistence, and fast integration out of the box. (Vite is kept as an easy fallback if needed).*
- **Q: How do you prevent duplicate order submissions?**  
  *A: Buttons auto-disable with a spinner on first click, and the backend has unique constraints (e.g. one Bill per PO).*
- **Q: Where does the double-entry accounting happen?**  
  *A: The backend service layer handles the transactional ledger balancing, while the frontend displays the verified Debit = Credit ledger and reports.*
