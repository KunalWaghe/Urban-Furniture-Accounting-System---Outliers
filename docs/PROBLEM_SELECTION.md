# Problem Selection Analysis — 5 September 2026

**Status:** Recommendation complete; team lock pending  
**Recommended candidate:** **DealFlow360**  
**Safest fallback:** **Urban Furniture Accounting System**  
**Do not select:** **PeoplePay360 HR & Payroll**

## Decision in one sentence

Choose **DealFlow360** because it has the highest final-round judging ceiling, the clearest five-minute story, and the best frontend/backend parallelism; its complexity is high but concentrated in one connected quotation state machine, whereas PeoplePay360 spreads comparable complexity across many independent mandatory modules.

## Normalized candidates

### Candidate A — Urban Furniture Accounting System

**Primary user:** business owner/accountant; customer/vendor portal user is also mentioned.  
**Core outcome:** master data → purchase/sale → bill/invoice → payment → double-entry journal → financial reports.  
**Required business logic:** balanced debit/credit postings, payment state, taxes, inventory/stock effects, account classification, budgets, Balance Sheet, P&L, and Budget Report.  
**Strong demo:** record a purchase and sale, register payments, then show the resulting ledger and reports.  
**Main risk:** accounting correctness is unforgiving, and the supplied Markdown appears incomplete between Contact Master and Journal configuration, leaving some master-data requirements ambiguous.  
**Assessment:** best completion probability, but lower differentiation and a backend-heavy workload that underuses Sourabh's frontend strengths.

### Candidate B — PeoplePay360 HR & Payroll

**Primary users:** employee, HR manager, payroll user, payroll manager, and admin.  
**Core outcome:** employee/contract/schedule/attendance/leave data drives a configurable payrun and payslip, followed by PDF/email delivery and live reporting.  
**Required business logic:** period-specific contract selection, no concurrent active contracts, schedule calculation, attendance corrections, allocation-backed leave, ordered salary rules using fixed/percentage/formula methods, payroll warnings, payrun state transitions, RBAC, PDF generation, bulk email, and live dashboard aggregation.  
**Required demo:** two end-to-end scenarios in five minutes.  
**Main risk:** the scope is a collection of separate products rather than one thin workflow. Salary-rule configuration must be genuinely functional, so a hardcoded payroll calculator would not satisfy the statement. PDF/email and five roles add more failure surfaces.  
**Assessment:** lowest probability of a polished, complete result for two people in 24 hours.

### Candidate C — DealFlow360

**Primary users:** sales rep, sales manager/approver, finance/operations, customer portal user, and admin.  
**Core outcome:** configure deal rules → build quote → calculate margin/discount risk → route approval → allocate warehouses → split hybrid billing → negotiate in customer portal → reapprove if necessary → confirm/pay.  
**Required business logic:** configurable tier/category discount governance, blended risk and multi-level approvals, audit trail, live upsell/margin impact, warehouse allocation/backorders, one-time plus recurring billing/proration, restricted customer portal, reapproval after negotiation, deal-health alerts, and payment/invoice status.  
**Required demo:** at least two full flows in five minutes, plus a one-page architecture diagram and roadmap.  
**Main risk:** four coupled algorithms and several roles must work together. The statement explicitly forbids faking the core rules, and the portal must be a genuinely restricted view.  
**Why it remains viable:** both demo flows reuse the same Quote/QuoteLine/Approval/Order state machine, stored configuration, audit log, and seed data. Sourabh can build the quotation and portal experiences while Kunal implements the rules behind a locked contract.

## Weighted scoring matrix

Scores are 1 (poor) to 5 (excellent). Weighted totals are normalized to 100. The official judging rubric was not supplied, so this is a decision aid rather than a claim about official scoring.

| Criterion | Weight | Urban | PeoplePay | DealFlow | Reasoning |
|---|---:|---:|---:|---:|---|
| 24-hour feasibility for two people | 25 | 4 | 2 | 2 | Urban is narrower; the other two are very large |
| Demo clarity and visible impact | 20 | 3 | 4 | 5 | DealFlow shows visible decisions and state changes |
| Fit for frontend/backend parallelism | 10 | 4 | 4 | 5 | DealFlow has a strong builder/portal ↔ rule-engine boundary |
| Differentiation and judging appeal | 15 | 2 | 4 | 5 | Deal governance and negotiation are the most memorable |
| Low external dependency/data risk | 10 | 5 | 4 | 5 | PeoplePay adds email/PDF delivery; all can use seed data |
| Testability and deterministic demo | 10 | 4 | 4 | 4 | All have deterministic rules; DealFlow supplies an explicit quick test |
| Credible scalability/business story | 5 | 4 | 4 | 5 | DealFlow naturally supports queues, cache, rate limits, and alerts |
| Team skill fit | 5 | 4 | 3 | 4 | PeoplePay's payroll/formula breadth is the weakest fit |
| **Weighted total / 100** | **100** | **72** | **69** | **82** | **DealFlow has the highest ceiling** |

## Difficulty and delivery-risk ranking

| Rank | Candidate | Difficulty | Completion risk | Judging ceiling |
|---:|---|---|---|---|
| 1 | DealFlow360 | 9/10 | Very high | Excellent |
| 2 | PeoplePay360 | 9/10 | Extreme | High |
| 3 | Urban Furniture | 7/10 | Medium | Moderate |

DealFlow and PeoplePay have similar headline difficulty, but DealFlow is the better choice because its required behavior is more cohesive and visually demonstrable. PeoplePay has more independent configuration surfaces and less room to cut without violating explicit requirements.

## Selection rationale

**Recommended:** DealFlow360  
**Raw weighted score:** 82/100  
**One-line reason:** strongest demo impact and differentiation with a clean two-person seam around a single connected deal lifecycle.  
**Why the runner-up loses:** Urban is safer but less differentiated, has an incomplete supplied specification, and places more of the judged value in Kunal's accounting correctness than in an equally balanced team execution.  
**Why PeoplePay is rejected:** too many mandatory, independently complex modules for two people; a thin implementation would visibly violate its technical guidelines.

## Conditions for locking DealFlow360

Choose DealFlow only if the team accepts all of these constraints:

1. One connected domain model and modular-monolith backend; no microservices.
2. Minimal stored configuration screens for discount tier, warehouses/stock, and subscription plan—no broad admin-suite polish.
3. Two demo flows reuse the same quotation and approval state machine.
4. Core calculations are real and configuration-driven; no hardcoded demo outcomes.
5. The separate customer portal has real token/session restriction.
6. Dashboard metrics come from live stored records, but the dashboard stays compact.
7. First vertical slice is quote → excessive discount → pending manager approval.
8. If that slice is not integrated by 12:30 PM, remove non-core DealFlow breadth and protect the two required flows.

## Preliminary DealFlow scope for master-prompt expansion

This is not the final architecture. It is the boundary the master prompt must respect.

### P0 — must ship

1. Seeded users/roles plus minimal internal login and restricted portal token/session.
2. Stored product, customer tier, discount/category rule, warehouse stock, and subscription-plan configuration.
3. Quotation builder with one-time and recurring lines, quantity, discount, totals, and live margin.
4. Configuration-driven blended discount risk and automatic manager/finance routing with audit log.
5. Approval action and valid quote-state transitions.
6. Upsell suggestion with immediate total/margin update. Pairing configuration can be minimal because its admin setup is marked optional, but behavior is required by the quick test.
7. Deterministic warehouse split across two warehouses with visible reasoning and acceptance.
8. Hybrid billing result: one-time invoice plus recurring schedule with a defined proration rule.
9. Separate customer portal negotiation; counter-discount change re-enters approval automatically.
10. Confirmation, payment recording, and invoice status update.
11. Compact live deal-health view using real quote/approval data.
12. Deterministic reset/seed, acceptance tests, deployment, architecture page, and five-minute demo covering two flows.

### P1 — at most two

1. Manual warehouse override with validation.
2. One useful anomaly/stalled-deal action linked to the relevant quotation.

### Bonus — only after P0 is deployed and stable

1. Rate limiting for portal negotiation/auth and expensive quote recomputation.
2. Cached dashboard aggregates with explicit invalidation/fallback.
3. Queued nudge/report export with job status and idempotency.
4. Multi-currency or multi-company only if everything above is already complete.

## Proposed two demo flows

### Flow 1 — Governed quote to fulfillment and billing

Rep creates a mixed hardware/subscription quote → accepts an upsell → applies excessive discount → system calculates blended risk → manager approves → system allocates stock across two warehouses → system displays one-time invoice and recurring schedule → payment updates invoice status.

### Flow 2 — Customer negotiation and automatic reapproval

Customer opens restricted portal → requests a larger discount → system records the negotiation and reopens approval → finance approves → customer confirms → deal-health state updates.

## Decision record

**Selected candidate:** DealFlow360 — recommended, awaiting team lock  
**Decision trigger:** Team says `LOCK DEALFLOW` or `LOCK AND BUILD`  
**Next step:** Run `MASTER_PROMPT.md` against the exact DealFlow360 statement and materialize architecture, API contract, logic, acceptance tests, and the problem-specific task board.

