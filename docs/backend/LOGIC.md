# Backend Logic — Kunal

This is the reviewer-readable source of truth for business behavior. Update it whenever a rule, state transition, or failure policy changes.

## Excalidraw auth and workflow decisions

- User credentials are `login_id` + password. `login_id` is case-insensitively unique and 6–12 characters; email is a separate case-insensitively unique field.
- Passwords are bcrypt-hashed and must be at least 8 characters with lowercase, uppercase, and a special character. “Unique password” means it must not equal the Login ID or email; never enforce global plaintext password uniqueness.
- Public `/auth/register` always creates `invoicing_user` and ignores or rejects a client role. Admin-only `/users` may create `admin`, `invoicing_user`, or `contact`; `contact` requires `contact_id`.
- Login failure message is `Invalid Login Id or Password`; inactive accounts are rejected.
- Portal reads and payments are always scoped to the authenticated user's `contact_id`.
- Invoice lines accept Income analytics; PO/vendor-bill lines accept Expense analytics. Journal entry confirmation is rejected unless total debits equal total credits.

## Domain glossary

| Term/entity | Meaning | Important fields | Owner/visibility |
|---|---|---|---|
| User | Authenticated system account | `login_id`, `email`, `password_hash`, `role`, `contact_id`, `is_active` | Admin creates all; public signup creates Accountant only |
| Contact | Customer/vendor business party | name, type, email, mobile, address, `is_active` | Internal users; linked User sees only own portal records |
| Analytic Account | Income/Expense marker used by budgets | name, type | Internal users |
| Budget | Planned amount for an analytic and date period | name, responsible contact, dates, committed amount, revision state | Admin/Accountant |
| Journal Entry | Balanced accounting posting | journal, date, partner, account lines, debit, credit | Admin/Accountant |

## Golden use case

**Name:** Login by Login ID
**Actor and permission:** Public
**Input:** `login_id`, `password`
**Preconditions:** Account exists, is active, and password matches

### Ordered logic

1. Authenticate actor.
2. Validate input shape.
3. Load required entities using bounded queries.
4. Authorize the action against stored truth.
5. Enforce business invariants.
6. Execute mutation inside the documented transaction boundary.
7. Commit durable state.
8. Invalidate affected cache entries or enqueue post-commit work if implemented.
9. Return the stable API response and request ID.

**Success output:** JWT plus user profile including role and nullable `contact_id`
**Expected failures:** `INVALID_LOGIN_ID`/`VALIDATION_ERROR` (422), invalid credentials (401), inactive account (401)
**Side effects:** No mutation; login attempt may be logged without credentials

## Purchase Order lifecycle (implemented 5 Sep 2026)

- **Endpoints:** `POST/GET /api/v1/purchase-orders`, `GET/PUT /api/v1/purchase-orders/{id}`, `PATCH .../confirm`, `PATCH .../cancel`, `GET /api/v1/analytic-accounts`. All require a valid JWT (`get_current_user`).
- **Status machine:** `draft` → `confirmed` (sets `confirmed_at` timestamp) and `draft` → `cancelled`. Confirmed or cancelled POs cannot be edited, confirmed, or cancelled again — every invalid transition returns `VALIDATION_ERROR` (422).
- **Edit:** `PUT` performs full line replacement inside one transaction; vendor is re-validated and the total is recomputed from line subtotals.
- **Defaults:** PO numbers are sequential (`PO-0001`, …). Line `account_id` defaults to the `Purchase Expense` account (code `5010`) when omitted.
- **Budget analytics:** `GET /api/v1/analytic-accounts` returns each active analytic with `budget_amount`, `committed_amount` (sum of line subtotals on **confirmed** POs), and `remaining_amount`. The frontend warns "Exceeds Approved Budget" when a draft's per-analytic total exceeds the remaining budget; the backend does not block over-budget orders (warning-only by design).
- **Timestamps:** stored as naive `TIMESTAMP` in the Postgres session timezone; API responses serialize them without a timezone suffix.

## Business invariants

| ID | Invariant | Enforced in | Error code | Test |
|---|---|---|---|---|
| INV-001 | Login ID is case-insensitively unique and 6–12 characters | service + DB unique index | `LOGIN_ID_ALREADY_EXISTS` / `INVALID_LOGIN_ID` | auth duplicate/validation tests |
| INV-002 | Email is case-insensitively unique | service + DB unique index | `EMAIL_ALREADY_EXISTS` | auth duplicate test |
| INV-003 | Public signup cannot choose a privileged role | service | `ROLE_NOT_ALLOWED` | signup role escalation test |
| INV-004 | Contact role must have a contact link; portal queries use it | service + query authorization | `FORBIDDEN` | portal isolation test |
| INV-005 | Journal debits equal credits before commit | service transaction | `JOURNAL_UNBALANCED` | ledger balance test |
| INV-006 | Payment cannot exceed remaining bill/invoice amount | service transaction | `PAYMENT_EXCEEDS_AMOUNT` | overpayment test |

## State transitions

| Entity | From | Event/command | To | Allowed actor | Invalid transition result |
|---|---|---|---|---|---|
| Purchase Order | draft | confirm | confirmed | Admin/Accountant | `409 CONFLICT` |
| Purchase Order | confirmed | create bill | billed | Admin/Accountant | `409 CONFLICT` |
| Sales Order | draft | confirm | confirmed | Admin/Accountant | `409 CONFLICT` |
| Sales Order | confirmed | create invoice | invoiced | Admin/Accountant | `409 CONFLICT` |
| Vendor Bill / Invoice | open | full payment | paid | Admin/Accountant or linked portal User | `409 CONFLICT` |
| Budget | draft | confirm | confirmed | Admin/Accountant | `409 CONFLICT` |
| Budget | confirmed | revise | revised + new confirmed budget | Admin/Accountant | `409 CONFLICT` |

## Authorization matrix

| Capability | Anonymous | User/contact portal | Accountant | Admin/system |
|---|---:|---:|---:|---:|
| Login / public signup | Yes | Yes | Yes | Yes |
| View own portal invoices/bills | No | Yes, linked `contact_id` only | Yes | Yes |
| Create master data / transactions | No | No | Yes | Yes |
| View internal reports and all journal entries | No | No | Yes | Yes |
| Create users / assign roles | No | No | No | Yes |

## Transaction and concurrency policy

**Mutating use case:** TBD  
**Atomic operations:** TBD  
**Conflict protection:** uniqueness constraint / version check / row lock / not required — choose and explain  
**Retry/idempotency behavior:** TBD

## Query and index plan

| Endpoint/use case | Query/filter/sort | Bounded by | Index | Evidence |
|---|---|---|---|---|
| TBD | TBD | limit/cursor | TBD | TBD |

## Cache policy — complete only if implemented

| Data | Key | TTL | Invalidation | Sensitive? | Cache-down fallback |
|---|---|---:|---|---:|---|
| TBD | TBD | TBD | TBD | No/Yes | Database/direct compute |

Never cache authorization decisions or sensitive responses casually. Cache-aside is the default for read-heavy derived/reference data; correctness comes before hit rate.

## Rate-limit policy — complete only if implemented

| Endpoint class | Identity | Limit/window | Why | `429` behavior |
|---|---|---|---|---|
| Expensive/mutating TBD | user/IP | TBD | protect cost/abuse | retry guidance |

Define trusted proxy behavior before using forwarded IP headers. Decide whether a rate-limit store failure fails open or closed based on endpoint risk.

## Background job policy — complete only if implemented

| Job | Trigger | Idempotency key | Retries/backoff | User-visible status | Failure recovery |
|---|---|---|---|---|---|
| TBD | after successful commit | TBD | TBD | queued/running/done/failed | TBD |

Queue only work that is slow, retryable, or independently scalable. Never enqueue before the state it depends on is durably committed.

## External integration policy

| Integration | Timeout | Retry | Fallback | Demo substitute |
|---|---:|---:|---|---|
| TBD | TBD | TBD | TBD | deterministic adapter, clearly labeled |

## Backend test checklist

- [ ] Golden use case.
- [ ] Invalid input.
- [ ] Unauthenticated and forbidden actor.
- [ ] Missing entity.
- [ ] Duplicate/idempotent request.
- [ ] Invalid state transition.
- [ ] Transaction rollback on failure.
- [ ] Large/bounded list query.
- [ ] External dependency timeout/failure.
- [ ] Rate limit/cache/job fallback if those bonuses exist.
