# Frontend Logic — Sourabh

This file explains behavior. Keep CSS and component-library details in code; capture user flows, states, validation, permissions, and API mapping here.

## Golden path

| Step | Route/surface | User action | API call | Success state | Failure recovery |
|---:|---|---|---|---|---|
| 1 | TBD | TBD | TBD | TBD | TBD |

## Screen inventory

| Priority | Screen | Job to be done | Required states | Status |
|---|---|---|---|---|
| P0 | TBD | TBD | loading / empty / error / success | Planned |

## State ownership

| State | Owner | Persistence | Why |
|---|---|---|---|
| Auth/session | TBD | TBD | TBD |
| Remote entities | API/server-state cache | Bounded cache | Backend remains source of truth |
| Filters/search | URL where shareable | URL | Back/forward and share links work |
| Form draft | Form/local state | None unless required | Avoid stale global drafts |

## Form and validation logic

| Field/action | Client validation | Backend remains authoritative for | Error presentation |
|---|---|---|---|
| TBD | TBD | permissions, invariants, conflicts | TBD |

## API-to-UI error mapping

| API code | UI response |
|---|---|
| `VALIDATION_ERROR` | Inline field errors and focus first invalid field |
| `UNAUTHENTICATED` | Preserve safe intent and request sign-in |
| `FORBIDDEN` | Disable/replace action and explain why |
| `NOT_FOUND` | Remove stale item or navigate to safe parent |
| `CONFLICT` | Explain stale/duplicate action and refresh data |
| `RATE_LIMITED` | Show retry time; prevent request spam |
| `INTERNAL_ERROR` | Keep user input where safe; show retry and request ID |

## Interaction invariants

- [ ] A mutation cannot be double-submitted while pending.
- [ ] Destructive actions require explicit confirmation or a reversible undo.
- [ ] UI role checks improve experience but never replace backend authorization.
- [ ] Loading indicators do not erase previously useful data during background refresh.
- [ ] Empty state tells the user the next useful action.
- [ ] Keyboard focus moves to errors/dialogs intentionally.

## Performance/scaling behavior

**Large lists:** TBD pagination/virtualization rule  
**Search:** TBD debounce and cancellation rule  
**Cache freshness:** TBD per query; do not use one global TTL  
**Optimistic updates:** only where conflict/rollback behavior is clear  
**Asset strategy:** TBD

## Frontend test checklist

- [ ] Golden path at laptop width.
- [ ] Golden path at phone width.
- [ ] Keyboard-only golden path.
- [ ] Slow request and server failure.
- [ ] Empty dataset.
- [ ] Invalid input.
- [ ] Expired/absent session.
- [ ] Duplicate click/submission.

