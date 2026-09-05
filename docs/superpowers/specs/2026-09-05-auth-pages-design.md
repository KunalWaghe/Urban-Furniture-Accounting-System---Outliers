# Auth Pages (Login / Signup) — Design Spec

**Date:** 2026-09-05
**Status:** Approved UI baseline; auth fields and role behavior clarified by `excalidraw-board.png`
**Source design:** `excalidraw-board.png` plus the Stitch visual design system

---

## 1. Goal

Build the `/login` and `/signup` pages for the Urban Furniture Accounting System, visually based on the Stitch "TransitOps" mockups, using the design tokens already mapped in `globals.css`.

**Implementation note:** The existing UI was intentionally built first as a local baseline. The next auth task must connect it to the API contract after replacing email login with `loginId`; no screen should claim authentication succeeded while the API is unavailable.

## 2. Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Branding | **Urban Furniture Accounting System** (adapted) | Stitch mock says "TransitOps"; project is Urban Furniture. Logo = Lucide `Armchair` icon in a blue rounded square (no external image hotlink). |
| Login field | **Login ID + Password** | Excalidraw explicitly says Login ID is used for login; email remains a separate unique field. |
| Login ID policy | **Unique, 6–12 characters** | Enforce inline where possible and authoritatively on the backend. |
| Public signup role | **Accountant / `invoicing_user` only** | Sign Up must not expose a role selector; Admin creates other roles from the internal Create User screen. |
| Roles | **Admin, Accountant, User** | API values remain `admin`, `invoicing_user`, and `contact`; User is the restricted portal role. |
| Interactivity | **Interactive, then API-backed** | Local validation remains immediate; submit must call the locked auth endpoints in the wiring task. |
| Structure | **Scalable feature folder** (`src/features/auth/`) | User-selected. Colocates components + hooks + validation per feature; scales as more features are added. |

## 3. Structural Change: Route Groups (SAFE)

**Problem:** Root `app/layout.tsx` renders `SiteSidebar` + `SiteHeader` + `SiteFooter` around every route. Auth pages must render without the app shell.

**Solution:** Next.js route groups — parentheses folders are invisible in the URL.

```
src/app/
├── layout.tsx              # KEEPS: <html>, <body>, ThemeProvider only (shell removed)
├── (app)/                  # existing app, URLs unchanged
│   ├── layout.tsx          # shell moved here: sidebar + header + footer
│   └── page.tsx            # existing home page, moved as-is
└── (auth)/                 # no shell
    ├── layout.tsx          # centered column, ambient glows, auth footer
    ├── login/page.tsx      # renders <LoginForm />
    ├── signup/page.tsx     # renders <SignupForm />
    └── forgot-password/page.tsx # renders reset request form
```

- Only 2 existing files move (`layout.tsx` shell portion, `page.tsx`); nothing is rewritten.
- `/` stays `/`. New routes: `/login`, `/signup`, `/forgot-password`.
- Risk: LOW. If the move breaks, `git checkout` restores it.

## 4. File Map (new files)

```
src/features/auth/
├── components/
│   ├── auth-brand-header.tsx      # logo mark + "Urban Furniture" + tagline
│   ├── auth-alert.tsx             # dismissible error/notice banner (from login mock)
│   ├── password-input.tsx         # input + show/hide eye toggle
│   ├── password-strength-meter.tsx# 4-segment bar + rule checklist (signup mock)
│   ├── login-form.tsx             # UI only; consumes useLoginForm()
│   └── signup-form.tsx            # UI only; consumes useSignupForm()
├── hooks/
│   ├── use-login-form.ts          # loginId/password state, validation, remember-me, API submit
│   ├── use-signup-form.ts         # loginId/email/password state, validation, strength, match, API submit
│   └── use-forgot-password-form.ts # reset request state and truthful demo/API result
└── validation.ts                  # pure helpers: isValidEmail, isValidLoginId, getPasswordStrength, etc.
```

**Rule (user requirement): hooks and UI stay separate.**
- Hooks own: field values, errors, UI flags (showPassword), derived state (strength, match), `handleSubmit`.
- Components own: JSX/rendering only. No `useState` for form data inside form components.
- `validation.ts` holds pure functions (no React) so logic is testable later without rendering.

## 5. State Ownership

| State | Owner | Source of truth |
|---|---|---|
| Form field values / errors | `useLoginForm` / `useSignupForm` (local `useState`) | Local component state — ephemeral |
| Password visibility | Same hooks | Local state |
| Auth & session | `AuthContext` | JWT token + user profile in selected browser storage |
| Theme | Existing `ThemeProvider` (untouched) | `localStorage` |

Form state stays local; authenticated identity is global in `AuthContext`, as defined by `docs/frontend/LOGIC.md`.

## 6. Page Content (adapted from Stitch mocks)

**Login (`/login`)** — max-w-md card:
- Brand header: Armchair logo mark, "Urban Furniture", overline "ACCOUNTING & ERP"
- Title "Sign in to your account", subtitle "Access purchase orders, bills, payments, and reports"
- Dismissible alert area (shows validation/auth-style errors from the hook)
- Login ID field (icon left), Password field (icon left + eye toggle right), "Forgot Password?" link → `/forgot-password`
- "Remember me on this device" checkbox
- Primary "Sign In" submit button
- Footer link: "Don't have an account? Sign up" → `/signup`
- Card footer: version line + Security/Terms/Support links (stubs)

**Signup (`/signup`)** — max-w-lg card:
- Same brand header; title "Create your account", subtitle "Register to manage procurement and accounting"
- Login ID field
- Work Email field
- Password field + live `PasswordStrengthMeter` (4 segments + checklist: ≥8 chars, upper+lower, special character)
- Re-enter Password + live "Passwords match" indicator
- No role selector; successful public signup is always an Accountant/Invoicing User
- Terms checkbox (required)
- "Create Account" (primary) + "Cancel" (link to `/login`)
- Footer link: "Already have an account? Sign in" → `/login`

**Dropped from mock:** "Ledger Node #01" badge, hardcoded prefilled values, external logo image, the "ID available" / "Unique email verified" badges (they require a backend uniqueness check — pure UI replicas would be dishonest UI), and the Enterprise SSO section (removed per user request — no SSO planned).

## 7. Validation Rules (client-side, per LOGIC.md)

| Form | Rules | Error presentation |
|---|---|---|
| Login | Login ID required, 6–12 characters; password required | Inline field errors + dismissible alert banner |
| Signup | Login ID required, 6–12 characters; email required + valid; password ≥8 chars, upper+lower, 1 special character; confirm must match; terms must be accepted | Inline field errors; live strength/match indicators |
| Admin Create User | Name, Login ID, email, role, password, confirmation; Contact link required for User role | Inline field errors; Admin-only route |

**Submit behavior:**
- Invalid → set field errors and focus the first invalid field.
- Valid → submit `{login_id, email, password}` to the locked endpoint; public signup never sends a client-selected role.
- API `401` → show exactly `Invalid Login Id or Password`; API `409/422` → map `login_id` and `email` conflicts/errors to the relevant fields.

## 8. Styling

- Use existing semantic tokens only: `bg-background`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `primary-*` scale, `destructive`, emerald for success states.
- Dark mode works automatically via tokens already defined in `globals.css` (light + `.dark`).
- Ambient background: two blurred blue radial glows, `pointer-events-none`, per mock.
- Radius: cards `rounded-2xl`, inputs/buttons `rounded-lg`, badges `rounded-full` (per DESIGN.md).
- Icons: `lucide-react` only (already a dependency).

## 9. Error Handling

- `AuthAlert` is dismissible (local `dismissed` flag in the hook).
- API errors map into the same alert per `LOGIC.md` §API-to-UI Error Mapping.
- Forgot Password is a separate route. If reset delivery is not configured, show a truthful demo/not-configured message rather than a false success.

## 10. Verification (no test framework — per user rule, none added)

1. `npm run lint` — clean.
2. `npm run build` — compiles, all auth routes prerender where applicable.
3. Browser check at `/login`, `/signup`, and `/forgot-password`:
   - Visual match to Stitch mocks (light + dark mode)
   - Typing updates strength meter / match badge
   - Submit with empty fields → inline errors; valid submit → API success or truthful reset/demo notice
   - `/` home page still renders with sidebar shell intact

## 11. Future Seams

- `useLoginForm.handleSubmit` → `POST /api/v1/auth/login`, store JWT, redirect `/dashboard`
- `useSignupForm.handleSubmit` → `POST /api/v1/auth/register`; backend assigns `invoicing_user`
- Admin Create User → `POST /api/v1/users`; role and `contact_id` are server-authorized
- Forgot Password → reset endpoint when delivery infrastructure is configured
- Replace stub validation with Zod + React Hook Form if adopted later (per LOGIC.md state table)
