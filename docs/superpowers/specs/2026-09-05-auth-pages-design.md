# Auth Pages (Login / Signup) — Design Spec

**Date:** 2026-09-05
**Status:** Approved by user (structure: scalable feature-folder approach)
**Source design:** `~/Downloads/stitch_transitops_accounting_platform_design_system` (Stitch export: `transitops_login_screen`, `transitops_sign_up_screen`, `modern_enterprise_operations/DESIGN.md`)

---

## 1. Goal

Build the `/login` and `/signup` pages for the Urban Furniture Accounting System, visually based on the Stitch "TransitOps" mockups, using the design tokens already mapped in `globals.css`.

**Explicitly out of scope (user instruction):**
- No real authentication logic — no API calls, no JWT storage, no AuthContext, no redirects.
- No new libraries (no react-hook-form, zod, or test frameworks yet).

## 2. Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Branding | **Urban Furniture Accounting System** (adapted) | Stitch mock says "TransitOps"; project is Urban Furniture. Logo = Lucide `Armchair` icon in a blue rounded square (no external image hotlink). |
| Login field | **Email + Password** | Matches `docs/frontend/LOGIC.md` (`admin@urbanfurniture.com`), not the mock's "Login ID". |
| Interactivity | **Fully interactive locally** | Hooks hold real form state; show/hide password, strength meter, match badge, inline validation all work. Submit validates and shows UI feedback but calls no API. |
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
    └── signup/page.tsx     # renders <SignupForm />
```

- Only 2 existing files move (`layout.tsx` shell portion, `page.tsx`); nothing is rewritten.
- `/` stays `/`. New routes: `/login`, `/signup`.
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
│   ├── use-login-form.ts          # email/password state, validation, remember-me, submit stub
│   └── use-signup-form.ts         # all field state, validation, strength, match, submit stub
└── validation.ts                  # pure helpers: isValidEmail, getPasswordStrength, etc.
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
| Theme | Existing `ThemeProvider` (untouched) | `localStorage` |

No Context, no React Query, no URL state — nothing global. Auth state will be added later per `LOGIC.md` (AuthContext + localStorage JWT); these hooks are the future seam for that.

## 6. Page Content (adapted from Stitch mocks)

**Login (`/login`)** — max-w-md card:
- Brand header: Armchair logo mark, "Urban Furniture", overline "ACCOUNTING & ERP"
- Title "Sign in to your account", subtitle "Access purchase orders, bills, payments, and reports"
- Dismissible alert area (shows validation/auth-style errors from the hook)
- Email field (icon left), Password field (icon left + eye toggle right), "Forgot Password?" link (stub `href="#"`)
- "Remember me on this device" checkbox
- Primary "Sign In" submit button
- Footer link: "Don't have an account? Sign up" → `/signup`
- Card footer: version line + Security/Terms/Support links (stubs)

**Signup (`/signup`)** — max-w-lg card:
- Same brand header; title "Create your account", subtitle "Register to manage procurement and accounting"
- Full name field (replaces mock's "Login ID" row)
- Work Email field
- Password field + live `PasswordStrengthMeter` (4 segments + checklist: ≥8 chars, upper+lower, number, symbol)
- Re-enter Password + live "Passwords match" indicator
- Terms checkbox (required)
- "Create Account" (primary) + "Cancel" (link to `/login`)
- Footer link: "Already have an account? Sign in" → `/login`

**Dropped from mock:** "Ledger Node #01" badge, hardcoded prefilled values, external logo image, the "ID available" / "Unique email verified" badges (they require a backend uniqueness check — pure UI replicas would be dishonest UI), and the Enterprise SSO section (removed per user request — no SSO planned).

## 7. Validation Rules (client-side, per LOGIC.md)

| Form | Rules | Error presentation |
|---|---|---|
| Login | Email required + valid format; password required | Inline field errors + dismissible alert banner |
| Signup | Name required (min 2 chars); email required + valid; password ≥8 chars, upper+lower, 1 number, 1 symbol; confirm must match; terms must be accepted | Inline field errors; live strength/match indicators |

**Submit stub behavior (no API):**
- Invalid → set field errors, focus first invalid field.
- Valid → show dismissible notice: "Demo mode — authentication is not connected yet." (`console.log` the payload shape for future wiring.)

## 8. Styling

- Use existing semantic tokens only: `bg-background`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `primary-*` scale, `destructive`, emerald for success states.
- Dark mode works automatically via tokens already defined in `globals.css` (light + `.dark`).
- Ambient background: two blurred blue radial glows, `pointer-events-none`, per mock.
- Radius: cards `rounded-2xl`, inputs/buttons `rounded-lg`, badges `rounded-full` (per DESIGN.md).
- Icons: `lucide-react` only (already a dependency).

## 9. Error Handling

- All errors are client-side validation errors (no network yet).
- `AuthAlert` is dismissible (local `dismissed` flag in the hook).
- Future API errors will map into the same alert per `LOGIC.md` §API-to-UI Error Mapping.

## 10. Verification (no test framework — per user rule, none added)

1. `npm run lint` — clean.
2. `npm run build` — compiles, both routes prerender.
3. Browser check at `/login` and `/signup`:
   - Visual match to Stitch mocks (light + dark mode)
   - Typing updates strength meter / match badge
   - Submit with empty fields → inline errors; valid submit → demo notice
   - `/` home page still renders with sidebar shell intact

## 11. Future Seams (not built now)

- `useLoginForm.handleSubmit` → `POST /api/v1/auth/login`, store JWT, redirect `/dashboard`
- `useSignupForm.handleSubmit` → registration endpoint
- Replace stub validation with Zod + React Hook Form if adopted later (per LOGIC.md state table)
