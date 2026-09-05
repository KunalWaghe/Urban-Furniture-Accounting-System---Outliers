# 24-Hour Odoo Hackathon Execution Plan

This is the team's operating plan, not a wishlist. Complete each gate before moving forward. If a gate is missed, reduce scope immediately using the de-scope ladder instead of pushing the risk to the final hours.

## Ownership

| Area | Directly responsible | Supporting responsibility |
|---|---|---|
| User flows, design system, pages, responsiveness, accessibility | Sourabh | Kunal answers contract questions |
| API, business rules, auth, database, deployment, infrastructure | Kunal | Sourabh supplies real UI payloads |
| API contract | Kunal proposes, both lock | Neither changes it silently |
| Integration and end-to-end test | Both | Sourabh drives UI; Kunal watches API/logs |
| Reviewer update and demo | Both | Sourabh: experience; Kunal: architecture |

## Operating rules

1. Build one complete vertical slice before building multiple screens or endpoints.
2. P0 is the exact demo path. P1 improves it. Bonus work starts only after the P0 gate passes.
3. Contract changes require both members to acknowledge the change in `docs/API_CONTRACT.md`.
4. Commit small, runnable increments. Pull before integration. Tag stable milestones.
5. Keep seed/demo data deterministic and provide a one-command reset.
6. Use feature flags or isolated modules for risky bonus features.
7. Never break the last stable deployment. Keep its URL and commit/tag in `docs/REVIEWER_BRIEF.md`.
8. Five minutes before every expected reviewer round, stop, sync, and open the reviewer brief.

---

# Phase 0 — Problem Selection and Architecture Lock

## 9:00–10:00 AM, Day 1 — no coding

### 9:00–9:08 — Read independently

- [ ] Paste every problem statement into `docs/PROBLEM_SELECTION.md`.
- [ ] Sourabh and Kunal read silently and underline required outputs, users, constraints, and judging hints.
- [ ] Do not discuss solutions yet; avoid anchoring on the first attractive idea.

**Output:** clean list of candidate statements and hard requirements.

### 9:08–9:20 — Normalize each statement

For every candidate, write:

- [ ] primary user and pain;
- [ ] required input and output;
- [ ] one-sentence demo journey;
- [ ] non-negotiable features;
- [ ] external data/API/hardware dependency;
- [ ] largest technical uncertainty.

**Output:** comparable one-paragraph summaries.

### 9:20–9:32 — Score and select

- [ ] Score every statement using the weighted matrix in `docs/PROBLEM_SELECTION.md`.
- [ ] Codex recommends the best candidate and explains the trade-offs.
- [ ] Prefer the highest **risk-adjusted** score, not simply the most complex idea.
- [ ] Record the selected statement and why the runner-up lost.

**Selection vetoes:** reject a statement if the core demo depends on unavailable credentials/data, cannot be shown end to end, or requires both members to work on the same bottleneck for most of the event.

**Output:** one selected problem statement by 9:32.

### 9:32–9:42 — Apply the master prompt

- [ ] Paste the master prompt after the problem statements are selected.
- [ ] Use it to produce assumptions, personas, workflows, edge cases, and acceptance criteria.
- [ ] Separate explicit requirements from inferred enhancements.
- [ ] List open questions; decide them by 9:42 with reasonable, documented assumptions.

**Output:** a testable problem definition, not an open-ended brainstorm.

### 9:42–9:52 — Lock scope and vertical slice

- [ ] P0: smallest end-to-end journey that directly solves the statement.
- [ ] P1: at most two improvements that make the demo persuasive.
- [ ] Bonus: scalability or delight features, isolated from P0.
- [ ] Write three to five demo acceptance tests in Given/When/Then form.
- [ ] Define the first vertical slice: UI action → API → business logic → database → UI result.

**Output:** ordered backlog with P0/P1/Bonus labels.

### 9:52–10:00 — Architecture and contract lock

- [ ] Confirm stack, deployment target, data store, auth approach, and repository layout.
- [ ] Sketch entities and relationships.
- [ ] Lock the first API request/response and error format in `docs/API_CONTRACT.md`.
- [ ] Fill the initial frontend and backend architecture decisions.
- [ ] Fill `docs/REVIEWER_BRIEF.md` with the problem, user, solution, architecture, and next milestone.

**10:00 gate:** both members can explain the same problem, demo path, scope, entities, contract, and first task in under two minutes.

---

# Phase 1 — Foundation and Proof

## 10:00–10:25 — Runnable foundations

### Sourabh

- [ ] Create the frontend shell, design tokens, routing, API client, and environment example.
- [ ] Add loading, empty, success, and error state primitives.
- [ ] Create the first P0 screen with typed mock data.

### Kunal

- [ ] Create backend configuration, health route, structured error envelope, database connection, and migration baseline.
- [ ] Add seed/reset command and environment example.
- [ ] Deploy or verify the earliest possible backend skeleton.

### Together

- [ ] Confirm both projects run from a fresh setup path.
- [ ] Freeze endpoint names and initial payloads.

**10:25 gate:** frontend and backend run; health check succeeds; no undocumented setup knowledge.

## 10:25–12:30 — First vertical slice

Build only this path: **one user action → validation → API → database → response → visible UI result**.

### Sourabh sequence

1. Build the real input/action surface.
2. Connect it to the API client, initially against the locked example response if needed.
3. Implement visible loading, failure, empty, and success states.
4. Replace the mock with the real endpoint.
5. Verify refresh/reload behavior and responsive layout.

### Kunal sequence

1. Create the minimal schema and migration.
2. Implement the P0 use case in a service module.
3. Expose it through the locked endpoint.
4. Add input validation, expected error mapping, and a happy-path test.
5. Seed realistic data and expose deterministic reset behavior.

### Together at 11:30

- [ ] Integrate real request and response.
- [ ] Fix contract mismatches before adding anything else.

**12:30 gate:** the first slice works end to end on one machine and is pushed. If it does not, stop all parallel feature work until it does.

## 12:30–1:00 PM — Reviewer checkpoint 1 and staggered lunch

- [ ] Demo the slice, even if visually rough.
- [ ] Explain selected problem, user pain, architectural boundary, and current evidence.
- [ ] Update implemented/planned items in the reviewer brief.
- [ ] Each member takes a short food break while the other protects the running setup.

---

# Phase 2 — Complete P0

## 1:00–4:00 PM — Core workflows

### Sourabh

- [ ] Complete remaining P0 screens in demo order.
- [ ] Reuse components; avoid premature generic abstractions.
- [ ] Add form validation, navigation protection, error recovery, and mobile behavior.

### Kunal

- [ ] Complete P0 use cases and schema.
- [ ] Enforce authorization and business invariants in the service layer.
- [ ] Add migrations, indexes for real query paths, and endpoint tests.
- [ ] Deploy a shared integration environment.

### Integration cadence

- [ ] 2:00 PM: payload and CORS/auth check.
- [ ] 3:00 PM: full demo-path run.
- [ ] 3:45 PM: bug-only integration pass.

**4:00 gate:** at least 60% of P0 is genuinely integrated, not merely implemented on separate branches. If below 60%, remove the lowest-value P0 branch or simplify its interaction.

## 4:00–4:15 PM — Reviewer checkpoint 2

- [ ] Show the live product, current architecture, API contract, and decision log.
- [ ] State one risk and the action already taken to contain it.
- [ ] Record reviewer feedback as `Accept now`, `Backlog`, or `Reject with reason`.

## 4:15–7:00 PM — P0 closure

- [ ] Complete the exact golden path.
- [ ] Implement all acceptance tests manually at least once.
- [ ] Add realistic empty/error states and deterministic demo data.
- [ ] Make the shared deployment run end to end.

**7:00 gate:** 100% of the golden path is deployed. Any incomplete feature is removed from the demo path.

## 7:00–7:30 PM — Meal, sync, and stable tag

- [ ] Tag/record the last stable commit and deployment.
- [ ] Back up environment values securely; never commit secrets.
- [ ] Update all four frontend/backend documentation files.
- [ ] Take staggered breaks.

---

# Phase 3 — Make It Persuasive

## 7:30–10:00 PM — P1 sprint

Choose at most two P1 items. Rank them by visible demo value divided by integration risk.

- [ ] P1-A selected: ____________________
- [ ] P1-B selected: ____________________
- [ ] Each feature has an owner, acceptance test, and 60-minute stop-loss.
- [ ] Merge one feature completely before starting another if they share a contract.

**10:00 gate:** P0 remains stable and deployed. Drop unfinished P1 work behind a flag or remove it.

## 10:00 PM–12:00 AM — Integration, security, and failure behavior

### Sourabh

- [ ] Keyboard navigation, focus, labels, contrast, and responsive checks.
- [ ] Retry/recovery behavior for failed requests.
- [ ] Prevent duplicate submissions and destructive accidental actions.

### Kunal

- [ ] Validate inputs and authorization on every P0 endpoint.
- [ ] Verify secret handling, CORS, error redaction, transaction boundaries, and database constraints.
- [ ] Test duplicate, missing, unauthorized, malformed, and concurrent requests where relevant.

### Together

- [ ] Run the golden path in a clean/incognito browser.
- [ ] Record a short backup screen capture of the working product.

**Midnight gate:** the project is demoable if no more features are added.

## 12:00–12:20 AM — Reviewer checkpoint 3

- [ ] Show P0 evidence and one P1 improvement.
- [ ] Explain the scaling seams without pretending every distributed component is needed today.
- [ ] Ask for one piece of feedback most likely to improve judging impact.

---

# Phase 4 — Bonus Scalability Window

## 12:20–3:30 AM — Implement only evidence-backed bonuses

Start a bonus only if P0 is deployed, acceptance tests pass, seed/reset works, and the stable tag is recorded.

Implement in this order because each step adds value without forcing the next:

1. **Database efficiency:** indexes, bounded queries, pagination, uniqueness and idempotency constraints.
2. **Rate limiting:** per identity/IP on expensive or mutating endpoints; return `429` with retry guidance.
3. **Caching:** cache only read-heavy, measurable, non-sensitive data; document key, TTL, and invalidation.
4. **Background jobs:** queue only slow/retryable work; expose job state and design idempotent workers.
5. **Observability:** request IDs, structured logs, latency/error counters, and a small health/readiness view.

For every bonus:

- [ ] State the actual bottleneck or failure mode.
- [ ] Keep it behind an interface, configuration, or feature flag.
- [ ] Add a verification step or measurable result.
- [ ] Document fallback behavior if Redis/worker/third-party service is unavailable.
- [ ] Stop after 45 minutes if it threatens the stable build.

**Do not add infrastructure for theatre.** A clear module boundary plus a working, measured rate limit is stronger than five unverified services in a diagram.

## 3:30–4:00 AM — Hard code freeze

- [ ] Merge only green, integrated work.
- [ ] Disable unfinished feature flags.
- [ ] Create the release candidate tag/commit.
- [ ] From now on: blocker bugs, docs, tests, demo, and deployment only.

---

# Phase 5 — Stabilize and Package

## 4:00–5:30 AM — Bug bash and performance proof

- [ ] Run all acceptance tests from a clean browser.
- [ ] Test empty, malformed, unauthorized, duplicate, large, and slow cases relevant to P0.
- [ ] Test phone and laptop widths.
- [ ] Confirm migrations and seed/reset on the deployment target.
- [ ] Capture one or two credible metrics: response latency, query count, rate-limit behavior, or job duration.
- [ ] Fix only severity-1/2 bugs; log cosmetic issues.

## 5:30–6:15 AM — Deployment and recovery drill

- [ ] Fresh production deploy from the release candidate.
- [ ] Health/readiness checks pass.
- [ ] Reset and reseed demo data.
- [ ] Verify public URLs and required credentials.
- [ ] Write a local fallback demo procedure.
- [ ] Keep the backup recording accessible.

## 6:15–7:00 AM — Documentation freeze

- [ ] Reviewer brief contains no placeholders.
- [ ] Architecture decision files match reality.
- [ ] Logic files explain the golden path and important edge cases.
- [ ] API contract matches deployed payloads.
- [ ] README/setup includes exact run, environment, migrate, seed, test, and deploy instructions.
- [ ] Clearly label implemented versus planned scalability.

## 7:00–8:00 AM — Demo story and submission assets

Use this narrative:

1. **Problem (20 sec):** who is blocked and why it matters.
2. **Solution (20 sec):** the one-line value proposition.
3. **Live journey (2–3 min):** show the golden path with realistic data.
4. **Engineering (45 sec):** one strong frontend decision, one backend invariant, one scaling feature with evidence.
5. **Impact and roadmap (30 sec):** measurable value and the next two safe extensions.

- [ ] Prepare slides only if required; the live product remains central.
- [ ] Record a final backup video after the deployment is verified.
- [ ] Capture screenshots and architecture diagram.

## 8:00–9:00 AM — Three rehearsals

- [ ] Run 1: normal demo; time it.
- [ ] Run 2: Kunal presents while Sourabh intentionally tests failure/recovery.
- [ ] Run 3: Sourabh presents; Kunal answers architecture and scale questions.
- [ ] Prepare concise answers for trade-offs, security, scalability, data model, and next steps.

## 9:00–9:30 AM — Submit early

- [ ] Verify required form fields, repository visibility, URLs, member names, and attachments.
- [ ] Submit and capture confirmation.
- [ ] Do not change the deployed release after submission unless a blocking issue is proven.

## 9:30–10:00 AM — Final reviewer buffer

- [ ] Keep live app, reviewer brief, architecture diagram, logs, and backup video open.
- [ ] Reset demo data.
- [ ] Hydrate, breathe, and present the stable release.

---

# Gate-Based De-Scope Ladder

Apply from the bottom of the product, never from the clarity of its core value:

1. Remove animations and decorative polish.
2. Remove secondary filters, exports, dashboards, and admin controls.
3. Replace realtime behavior with refresh/polling.
4. Replace third-party automation with a deterministic simulated adapter clearly labeled as such.
5. Reduce roles/personas to the one judged golden path.
6. Reduce create/edit/delete breadth to the single action that proves value.
7. Keep one complete, reliable vertical slice and explain the roadmap.

# Reviewer Visit Protocol (five minutes)

1. Open `docs/REVIEWER_BRIEF.md` and the deployed product.
2. Say: **problem → user → promise → proof** in 30 seconds.
3. Demo the last stable slice in 90 seconds.
4. Sourabh explains one UI/UX decision; Kunal explains one business/data decision.
5. Show current gate, risk, and next checkpoint.
6. Capture feedback and classify it; do not immediately derail the locked plan.

