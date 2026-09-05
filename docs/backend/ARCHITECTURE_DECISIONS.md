# Backend Architecture Decisions — Kunal

Record decisions and trade-offs as they are made. The target is a modular monolith with clean seams unless the problem statement proves that separate services are necessary.

## Current architecture

**Framework:** FastAPI
**Database:** PostgreSQL (SQLite fallback only if setup blocks P0)
**ORM/query approach:** SQLAlchemy 2.0 with Pydantic request/response schemas
**Auth:** JWT bearer tokens; bcrypt password hashes; Login ID credential with role and optional `contact_id`
**Deployment target:** Single deployable API (localhost first, VPS if time permits)
**Optional cache/queue:** Not implemented unless recorded below

## Recommended module boundaries

```text
app/
  api/             transport, auth extraction, request/response mapping
  services/        use cases and transaction orchestration
  domain/          business entities, rules, and errors
  repositories/    persistence interfaces and implementations
  integrations/    third-party adapters
  jobs/            optional background job definitions/workers
  observability/   logging, request IDs, metrics hooks
  config/          validated environment configuration
```

Dependencies point inward: routes call services; services use repositories/adapters; domain rules do not import the web framework.

## ADR-BE-001 — Modular monolith first

**Status:** Proposed  
**Decision:** Use one deployable backend with explicit domain/service/repository boundaries.  
**Why:** Lowest operational risk for 24 hours while preserving seams for future extraction.  
**Consequences:** Shared deployment and database today; simpler transactions; modules can be profiled before any service split.  
**Revisit if:** The statement requires independently scaled workloads or a hard isolation boundary.

## ADR-BE-002 — Business logic location

**Status:** Proposed  
**Decision:** Routes handle transport only; services coordinate use cases; database constraints protect critical invariants.  
**Why:** Logic remains testable and cannot be bypassed by adding another endpoint.

## ADR-BE-003 — Database and consistency

**Status:** Proposed  
**Options considered:** TBD  
**Decision:** TBD  
**Transaction boundary:** one transaction per mutating use case unless documented otherwise.  
**Why:** TBD

## ADR-BE-004 — Scaling components are adapters

**Status:** Proposed  
**Decision:** Cache, queue, and third-party services sit behind interfaces with explicit timeout/fallback behavior.  
**Why:** P0 remains testable and deployable without distributed infrastructure; bonus components can be added safely.

## ADR-BE-005 — Login identity and role assignment

**Status:** Accepted after Excalidraw clarification
**Context:** The UI reference has separate Login ID and Email fields, a public Sign Up flow, and an Admin-only Create User flow.
**Decision:** Add a case-insensitive unique `login_id` (6–12 characters) to users. Authenticate by Login ID. Keep email separately unique. Public registration always creates `invoicing_user` and does not accept a role. Admin-created users may be `admin`, `invoicing_user`, or `contact`; `contact` users require a linked `contact_id`.
**Why:** Prevents privilege escalation and matches the screen behavior while keeping email available for contact and password-reset workflows.
**Consequences:** The current email-based auth implementation and tests are a baseline, not final contract evidence; migration, schemas, JWT subject lookup, `/me`, and tests must be updated together. Portal queries must scope by `contact_id`.

## New decision template

### ADR-BE-___ — Title

**Status:** Proposed / Accepted / Superseded  
**Context:**  
**Options considered:**  
**Decision:**  
**Why:**  
**Consequences:**  
**Revisit if:**

## Scale-readiness checklist

- [ ] Queries are bounded and relevant filter/join columns are indexed.
- [ ] Mutations that may be retried are idempotent or protected by uniqueness constraints.
- [ ] Expensive external calls have timeouts and mapped failures.
- [ ] API processes remain stateless; durable state lives in the database/cache/job store.
- [ ] Rate-limit identity, window, and failure behavior are documented.
- [ ] Cache key, TTL, invalidation, sensitivity, and fallback are documented.
- [ ] Jobs define retry limit, backoff, idempotency, status, and dead-letter/manual recovery.
- [ ] Logs are structured and include a request/job ID without leaking secrets or personal data.
