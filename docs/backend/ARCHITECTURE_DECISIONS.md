# Backend Architecture Decisions — Kunal

Record decisions and trade-offs as they are made. The target is a modular monolith with clean seams unless the problem statement proves that separate services are necessary.

## Current architecture

**Framework:** TBD  
**Database:** TBD  
**ORM/query approach:** TBD  
**Auth:** TBD  
**Deployment target:** TBD  
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

