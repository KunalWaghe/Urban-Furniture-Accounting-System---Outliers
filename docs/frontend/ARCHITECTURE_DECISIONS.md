# Frontend Architecture Decisions — Sourabh

Record decisions as they are made. Keep rejected options because reviewers care about trade-offs, not just the final library list.

## Current architecture

**Framework/rendering:** TBD  
**Styling/component system:** TBD  
**Server-state approach:** TBD  
**Client-state approach:** TBD  
**Forms/validation:** TBD  
**Auth/session handling:** TBD  
**Deployment target:** TBD

## Intended module boundaries

```text
src/
  app-or-routes/       route composition
  features/            problem-domain UI and feature logic
  components/          reusable presentational primitives
  lib/api/              typed API client and error normalization
  lib/validation/       shared client validation schemas
  hooks/                reusable UI/server-state hooks
  types/                contract-facing types
```

Avoid importing feature internals across features. Pages compose features; the API client owns transport details; components do not call raw URLs directly.

## ADR-FE-001 — Framework and rendering strategy

**Status:** Proposed  
**Context:** A two-person team needs fast UI delivery, predictable deployment, and a clear API boundary.  
**Options considered:** TBD  
**Decision:** TBD  
**Why:** TBD  
**Consequences:** TBD  
**Revisit if:** TBD

## ADR-FE-002 — State ownership

**Status:** Proposed  
**Decision rule:** URL owns navigable/filter state; server-state tooling owns remote data; form library/local state owns temporary input; global state is reserved for truly cross-cutting UI/session concerns.  
**Why:** Prevents a single global store from mixing server cache, drafts, and navigation.  
**Actual decision after statement:** TBD

## ADR-FE-003 — API isolation

**Status:** Proposed  
**Decision:** All network calls go through one typed client that normalizes the shared error envelope.  
**Why:** Backend URLs/auth/error details can change without rewriting every component.  
**Consequences:** Small upfront wrapper; faster integration and consistent recovery UI.

## ADR-FE-004 — Resilient UI states

**Status:** Proposed  
**Decision:** Every P0 remote view explicitly handles initial loading, background refresh, empty, validation error, authorization error, generic error, and success.  
**Why:** Demo stability and product credibility are more valuable than additional half-built screens.

## New decision template

### ADR-FE-___ — Title

**Status:** Proposed / Accepted / Superseded  
**Context:**  
**Options considered:**  
**Decision:**  
**Why:**  
**Consequences:**  
**Revisit if:**

## Scalability seams

- Route-level code splitting and feature boundaries.
- Pagination/virtualization for large collections when actually needed.
- Stable query keys and invalidation rules for server-state caching.
- Debouncing/cancellation for expensive search, without hiding backend rate limits.
- Centralized analytics/error hooks so observability can be added without touching every component.
- Never store secrets or authoritative permissions in the browser.

