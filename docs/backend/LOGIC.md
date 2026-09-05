# Backend Logic — Kunal

This is the reviewer-readable source of truth for business behavior. Update it whenever a rule, state transition, or failure policy changes.

## Domain glossary

| Term/entity | Meaning | Important fields | Owner/visibility |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Golden use case

**Name:** TBD  
**Actor and permission:** TBD  
**Input:** TBD  
**Preconditions:** TBD

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

**Success output:** TBD  
**Expected failures:** TBD  
**Side effects:** TBD

## Business invariants

| ID | Invariant | Enforced in | Error code | Test |
|---|---|---|---|---|
| INV-001 | TBD | service + DB constraint where possible | TBD | TBD |

## State transitions

| Entity | From | Event/command | To | Allowed actor | Invalid transition result |
|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | `409 CONFLICT` |

## Authorization matrix

| Capability | Anonymous | User | Owner | Admin/system |
|---|---:|---:|---:|---:|
| TBD | No | TBD | TBD | TBD |

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

