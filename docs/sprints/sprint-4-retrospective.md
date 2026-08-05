# Tablé — Sprint 4 Retrospective

COMP47360 Team 2

*Snapshot as of July 22, 2026 | Prepared by: Integration Lead / Scrum Master*

## Executive Summary

Sprint 4 was an implementation-and-integration sprint following Sprint 2/3's specification lock-in. The team shipped a working full-stack product: web and mobile clients now run on real authentication, merchant onboarding, and the RevPASH revenue-lift feature end-to-end, and backend closed all but one of its items. The weak spots are concentrated, not diffuse: ML (Jack Xu, 25% done) and QA/product research (Yuhao Xu, 50% done) account for most of the sprint's open work.

**Overall Outcome:** 39 of 54 sprint-tagged stories completed (72% by count, 70% by story points — 221 of 314 SP).

## What Went Well

**1. Backend Nearly Cleared Its Scope**

- 5 of 6 items closed: authentication, merchant registration, RevPASH migration/view/endpoint, booking status transitions, restaurant settings & bookings API.
- **Impact:** removes backend as a blocker for nearly every frontend/mobile feature depending on it this sprint.
- **Ownership:** Yang Liu.

**2. Real Auth & Merchant Onboarding, Web + Mobile**

- AuthContext and its mobile equivalent now call real `/auth/login` and `/auth/register` instead of a dev bypass; sign-up screens on both platforms wire to `POST /restaurants` for venue creation.
- **Impact:** closes the merchant sign-up gap identified in the Sprint 3 gap analysis (TABL-622).
- **Ownership:** Andrew Mitchell (web), Milo Dennehy (mobile).

**3. RevPASH Rollout Completed Across the Full Stack**

- A feature designed in Sprint 2, seeded ahead of its backend in Sprint 3, shipped coherently in Sprint 4: DB migration + view + endpoint, web RevpashMeter, CampaignHistory lift badge, and a mobile RevPASH card.
- **Impact:** a three-sprint feature arc closed without rework.
- **Ownership:** Yang Liu, Chukwuemeka Nwoke, Andrew Mitchell.

**4. Mobile Cleared Its Entire Scope**

- Push notifications, mobile accessibility, search & discovery screen, Redux state management, bookings/settings UI, mobile sign-up, mobile JWT auth, mobile usability fixes — 8 of 8.
- **Ownership:** Milo Dennehy.

**5. Infra/Integration Rollovers Closed**

- Secrets management, staging Cloud Run deployment, rollback/recovery procedures, Docker containerization, monitoring/alerting, Cloud SQL migration, and final end-to-end integration all closed — 13 of 15 items (performance and security testing remain open).
- **Ownership:** Chukwuemeka Nwoke.

## What Did Not Go Well

**1. Data & ML Stalled**

- Only model deployment and initial training are done. Model evaluation/tuning, the heuristic fallback, A/B testing, RevPASH-informed retraining, drift monitoring, and the paper's ML section are all still open — 6 of 8 items.
- **Risk:** no evaluated/retrained model exists to describe in the final paper's evaluation section, and the heuristic fallback itself isn't finished either.
- **Root Cause:** retraining was gated on RevPASH data, which only became available mid-sprint once TABL-118 shipped — leaving little runway.
- **Mitigation:** prioritize evaluation + the heuristic fallback immediately; defer drift monitoring explicitly rather than let it silently carry over again.

**2. QA/Product Research Half-Open**

- Both usability test rounds (internal + external), the user interview session, and feedback synthesis are all still In Progress — the second sprint running these have carried over.
- **Risk:** no validated usability evidence exists for the final demo, and the synthesis step feeds two other open tickets (TABL-217, TABL-314-adjacent fixes).
- **Mitigation:** prioritize finishing the interviews and synthesis since they block downstream fixes; timebox the remaining usability rounds.

**3. Database Backup Plan Still Open**

- TABL-509 remains In Progress, meaning the risk register's R-14 (Critical: no confirmed Cloud SQL backup on staging) is still unresolved at sprint close.
- **Mitigation:** verify via `gcloud sql instances describe` and enable automated backups before final submission.

## Key Learnings

- Backend and Mobile both executed cleanly because their scope was well-specified ahead of the sprint — the same lesson Sprint 2 drew for itself about locking specs early.
- ML retraining depended on RevPASH data landing mid-sprint before it could start — a sequencing problem more than a raw capacity problem for the ML owner.
- QA/product research carried over from Sprint 3 again — performance, security, and usability testing have now slipped two sprints running.

## Snapshot By Owner

| Owner | Done | Open | Summary |
|---|:--:|:--:|---|
| Yang Liu (Backend Lead) | 5 | 1 | Authentication, merchant registration, RevPASH backend (migration/view/endpoint), booking status API, restaurant settings & bookings API.<br>Open: database backup & recovery plan (TABL-509) still In Progress. |
| Chukwuemeka Nwoke (Scrum Master & Integration) | 13 | 2 | Staging deploy, rollback runbook, Docker, monitoring, secrets management, cost tracking, risk register, standup facilitation, Sprint 3 retro, Cloud SQL migration, final end-to-end integration, mobile RevPASH card.<br>Open: performance testing and security testing both still In Progress. |
| Andrew Mitchell (Frontend Lead) | 7 | 2 | Form validation, accessibility audit, shared component library, merchant sign-up screen, JWT auth wiring, CampaignHistory RevPASH badge.<br>Open: usability/accessibility fixes (In Review); a second Push Notifications ticket sits under this owner In Review — see duplicate-ticket note below. |
| Milo Dennehy (Mobile Lead) | 8 | 0 | Push notifications, mobile accessibility, search & discovery screen, Redux state management, bookings/settings UI, mobile sign-up, mobile JWT auth, mobile usability fixes.<br>Zero carryover — full clear of this owner's Sprint 4 scope. |
| Jack Xu (Data & ML Lead) | 2 | 6 | Initial ML model training, model deployment to production.<br>Open: model evaluation/tuning, heuristic match algorithm, A/B testing, RevPASH-informed retraining, drift monitoring, and the ML paper section — 6 of 8 items. |
| Yuhao Xu (Product Lead) | 4 | 4 | Integration tests, API contract validation, accessibility testing, final paper outline.<br>Open: both usability test rounds (internal + external), user interview session, feedback synthesis. |

**Key Signal:** Implementation is essentially done for the product's core path (Backend 83%, Frontend 78%, Mobile 100%, Infra/Integration 87%). The gap is entirely in ML maturity (25%) and QA/product research (50%) — the two areas a "final" sprint most needs to close.

## Carryover Risks Before Final Demo/Submission

1. ML: evaluation, heuristic fallback, A/B testing, retraining, drift monitoring, paper section — 6 items, none finished.
2. QA/product research: both usability rounds, user interviews, feedback synthesis — 4 items still open.
3. Database backup & recovery plan unconfirmed — directly ties to risk register R-14 (Critical).
4. Board cleanup needed: resolve the TABL-308 duplicate (SCRUM-253 vs SCRUM-299), and decide whether the 7 untagged-but-done items should be retroactively attached to Sprint 4.

## Completed Work Highlights

| Jira Key | TABL | Story Name | Owner | Status |
|---|---|---|---|---|
| SCRUM-149 | TABL-006 | Authentication & Authorization | Yang Liu | Done |
| SCRUM-330 | TABL-117 | Merchant Registration Endpoint | Yang Liu | Done |
| SCRUM-331 | TABL-118 | RevPASH Backend (Migration/View/Endpoint) | Yang Liu | Done |
| SCRUM-333 | TABL-120 | Bookings Status API | Yang Liu | Done |
| SCRUM-334 | TABL-121 | Restaurant Settings & Bookings API | Yang Liu | Done |
| SCRUM-332 | TABL-119 | Cloud SQL Migration (pool.js) | Chukwuemeka | Done |
| SCRUM-335 | TABL-122 | Final Integration - E2E Wiring | Chukwuemeka | Done |
| SCRUM-269 | TABL-506 | Staging Deployment - Cloud Run | Chukwuemeka | Done |
| SCRUM-343 | TABL-313 | Mobile Merchant Dashboard - RevPASH Card | Chukwuemeka | Done |
| SCRUM-336 | TABL-213 | Merchant Sign-Up Screen | Andrew Mitchell | Done |
| SCRUM-337 | TABL-214 | Wire AuthContext to Real JWT | Andrew Mitchell | Done |
| SCRUM-338 | TABL-215 | CampaignHistory RevPASH Lift Badge | Andrew Mitchell | Done |
| SCRUM-253 | TABL-308 | Push Notifications Integration (Firebase) | Milo Dennehy | Done |
| SCRUM-341 | TABL-311 | Mobile Sign-Up Screen | Milo Dennehy | Done |
| SCRUM-342 | TABL-312 | Mobile - Wire Real JWT Auth | Milo Dennehy | Done |
| SCRUM-263 | TABL-406 | Model Deployment to Production | Rui Xu | Done |
| SCRUM-275 | TABL-602 | Test Plan - Integration Tests (E2E) | Yuhao Xu | Done |
| SCRUM-350 | TABL-625 | Final Paper - Outline & First Draft | Yuhao Xu | Done |

## Not Completed (Open at Sprint Close)

| Jira Key | TABL | Story Name | Owner | Status |
|---|---|---|---|---|
| SCRUM-261 | TABL-404 | Model Evaluation & Hyperparameter Tuning | Rui Xu | To Do |
| SCRUM-277 | TABL-604 | Performance Testing - Load & Latency | Chukwuemeka Nwoke | In Progress |
| SCRUM-278 | TABL-605 | Security Testing - Input Validation/SQLi | Chukwuemeka Nwoke | In Progress |
| SCRUM-279 | TABL-606 | Usability Test - Internal Team | Yuhao Xu | In Progress |
| SCRUM-280 | TABL-607 | Usability Test - External Users | Yuhao Xu | In Progress |
| SCRUM-299 | TABL-308 | Push Notifications Integration (Firebase)\* | Andrew Mitchell | In Review |
| SCRUM-302 | TABL-401 | Heuristic Match Algorithm (Fallback) | Rui Xu | In Progress |
| SCRUM-309 | TABL-509 | Database Backup & Recovery Plan | Yang Liu | In Progress |
| SCRUM-317 | TABL-608 | A/B Testing - Heuristic vs ML Model | Rui Xu | To Do |
| SCRUM-340 | TABL-217 | Usability & Accessibility Fixes - Web | Andrew Mitchell | In Review |
| SCRUM-345 | TABL-407 | RevPASH-Informed Model Retraining | Rui Xu | To Do |
| SCRUM-346 | TABL-408 | Model Drift Monitoring | Rui Xu | To Do |
| SCRUM-347 | TABL-409 | ML Section - Final Paper Contribution | Rui Xu | To Do |
| SCRUM-348 | TABL-623 | User Interview Session - Schedule & Facilitate | Yuhao Xu | In Progress |
| SCRUM-349 | TABL-624 | User Feedback Synthesis - Sprint 4 | Yuhao Xu | In Progress |

\* Known duplicate of SCRUM-253, closed earlier this sprint — see the board-cleanup note in "Carryover Risks" above.

## Key Takeaway

- Sprint 4 delivered a working, integrated full-stack MVP: auth, merchant onboarding, RevPASH, and bookings all function end-to-end on web and mobile.
- Mobile executed flawlessly (8/8); Backend and Infra/Integration are close behind (83%, 87%).
- Data & ML is the real carryover at 25% complete, followed by QA/product research at 50% — both directly affect what can be claimed in the final demo and paper.
- Board hygiene needs a pass before numbers are reported as final: a genuine duplicate ticket (TABL-308) and 7 completed items sitting outside the sprint entirely.

## Sprint 4 Risk Assessment

**Critical Risk: Data & ML**

- Status: 2 of 8 items done (initial training, model deployment); evaluation, heuristic fallback, A/B testing, retraining, drift monitoring, and paper section all open.
- Impact: High — blocks the final paper's ML methodology/results sections and any RevPASH-informed matching claim.
- Severity: CRITICAL for final submission.

**High Risk: QA/Product Research**

- Status: 4 of 8 items done; both usability rounds, user interviews, and feedback synthesis still open — second sprint carrying this debt.
- Impact: High — no validated usability evidence for the demo; synthesis blocks downstream fix tickets.
- Severity: HIGH for final submission.

**Medium Risk: Database Backup & Recovery**

- Status: TABL-509 still In Progress; ties directly to risk register R-14 (Critical).
- Severity: MEDIUM, escalating if left open past sprint close.

**Low Risk: Backend, Infra/Integration, Frontend, Mobile**

- Status: 83%–100% complete across all four; remaining items are one backend backup plan, two testing tasks, and in-review polish — none of it a blocker for the core product.
- Severity: LOW (on track).

With ML evaluation and QA/product research prioritized immediately, and the board-hygiene items above cleaned up, Sprint 4's work is in strong shape to support the final demo and paper.

## Retrospective Conclusion

**Sprint 4** was an implementation-and-integration sprint that delivered a working, end-to-end full-stack MVP — real JWT authentication, merchant registration and onboarding, and the three-sprint RevPASH revenue-lift feature all shipped coherently across web and mobile — closing 39 of 54 sprint-tagged stories (72% by count, 70% by story points), with Mobile clearing its entire scope (8/8), Infra/Integration at 87%, Backend at 83% (only the database backup plan left open), and Frontend at 78% (in-review polish remaining); the clear lag were Data & ML at just 25% complete (model evaluation, retraining, drift monitoring, and the paper's ML section all still open) and QA/product research at 50% (both usability test rounds and feedback synthesis unfinished), and the review also surfaced board-hygiene problems worth fixing before final reporting — so while the sprint's core integration goal was clearly met, the validation and ML-maturity work a "final" sprint typically needs was not, leaving those two areas as the priority carryover into Sprint 5.
