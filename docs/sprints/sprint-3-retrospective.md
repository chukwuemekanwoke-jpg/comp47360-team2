# Tablé — Sprint 3 Retrospective

COMP47360 Team 2

*Snapshot as of July 5, 2026 | Prepared by: Integration Lead / Scrum Master*

## Executive Summary

Sprint 3 carried 65 issues — by far the largest sprint scope of the project to date. As of July 5, with two days remaining, 33 issues are Done, 3 are in Review, 14 are In Progress, and 15 are still To Do. That puts the sprint at roughly 51% fully complete (55% if in-review work is counted as effectively done).

The headline result is that the MVP's hardest technical risk — the ML matching pipeline — is resolved. Backend delivered 100% of its committed API scope, and Mobile shipped a complete P0 flow. The shortfall is concentrated in QA/testing and infrastructure: staging is not live, deeper testing has been deferred, and two frontend stories have now rolled over for a second consecutive sprint.

## Sprint 3 Snapshot

| Status | Count | Share of 65 |
|---|:--:|:--:|
| Done | 33 | 51% |
| In Review | 3 | 5% |
| In Progress | 14 | 21% |
| To Do | 15 | 23% |

*Key signal: the two riskiest workstreams from Sprint 2 — backend implementation and ML model training — both closed out fully in Sprint 3. The remaining gap is concentrated in QA, DevOps/staging, and a repeat frontend carryover.*

## What Went Well

1. **Backend fully delivered** — Yang Liu shipped all committed APIs (Users, Restaurants, Bookings, Offers, Campaigns, ETA) and closed 10/10 backend issues, a full clear of the workstream.
2. **ML models trained and served** — Jack Xu completed busyness prediction, user-restaurant matching, and the FastAPI inference endpoint — resolving the single largest unmitigated risk carried over from Sprint 2.
3. **Mobile MVP complete** — Milo Dennehy delivered all P0 mobile flows: preferences, discovery, ETA/booking, and flash deals.
4. **CI/CD pipeline established** — `ci.yml`, `deploy-staging.yml`, branch protection, and the API validation gate are all working — the Day 1 non-negotiable from Sprint 3 planning was met.
5. **Sprint 2 rollovers resolved** — Feature Engineering and Time-Series Data Preparation, both carried over from Sprint 2, are now complete.

## What Did Not Go Well

1. **Scope overload** — 65 issues was too ambitious for a two-week sprint; the To Do + In Progress backlog (29 issues, 45% of scope) reflects a planning miscalibration rather than execution failure alone.
2. **QA/testing deferred** — end-to-end integration tests, security testing, performance testing, and usability testing are still in progress or not started, leaving quality risk heading into the demo.
3. **Staging not live** — Docker containerization and Cloud Run setup remain in progress, which blocks a realistic pre-demo environment check.
4. **Repeated rollovers** — Redux State Management and Search & Discovery Screen have now rolled over from Sprint 2 into Sprint 3 and are still To Do — a second consecutive miss on the same two frontend stories.
5. **Infrastructure bottleneck** — DevOps tasks concentrated on a single person (Integration Lead), creating a single point of failure for staging, CI/CD, and deployment work.

## Key Learnings

- A 65-issue sprint exceeded team capacity; future sprint planning should size to velocity from the prior sprint (Sprint 2 closed 10/15), not to the full backlog wish list.
- Resolving the ML and backend risk early freed capacity, but that capacity was absorbed by scope growth rather than redirected to QA and staging — testing needs to be scheduled, not left to fill leftover time.
- The same two frontend stories rolling over twice suggests a structural blocker (dependency, ownership, or scope size) rather than a scheduling issue — worth a direct conversation with Andrew before Sprint 4 planning, not just a re-carry.
- Concentrating DevOps/infrastructure work on one person is a recurring single point of failure; Sprint 4 should assign a backup or pair on staging and CI/CD tasks.
- Definition of Done was not enforced consistently across issues — several "Done" items likely still need QA sign-off, which should be caught by a DoD gate rather than discovered late.

## Completed Work Highlights

| Owner | Role | Sprint 3 Result |
|---|---|---|
| Yang Liu | Backend Lead | 10/10 issues complete — all core APIs (Users, Restaurants, Bookings, Offers, Campaigns, ETA) delivered. |
| Jack Xu | Data & ML Lead | Busyness prediction, user-restaurant matching, and FastAPI inference endpoint all complete — critical path risk resolved. |
| Milo Dennehy | Mobile Lead | All P0 mobile flows delivered: preferences, discovery, ETA/booking, flash deals. |
| Chukwuemeka Nwoke | Integration Lead / SCM | CI/CD pipeline fully established: `ci.yml`, `deploy-staging.yml`, branch protection, API validation gate. |
| Andrew Mitchell | Frontend Lead | Partial — Redux State Management and Search & Discovery Screen remain To Do, rolled over for a second sprint. |
| Henry Xu | Product Owner | Partial — unit test plan ready, test plan for API contract validation still under plans, as well as usability testing and tracking Google Cloud Run costs. |

## Carryover Risks for Sprint 4

1. **Staging environment not live** — Docker + Cloud Run setup must complete before the demo; this is now the top infrastructure risk.
2. **QA coverage gap** — E2E, security, performance, and usability testing are unfinished; shipping without this coverage risks demo-day surprises.
3. **Frontend carryover (2nd consecutive sprint)** — Redux State Management and Search & Discovery Screen need root-cause attention, not just another rollover.
4. **DevOps single point of failure** — all infrastructure work sits with one person; any unavailability directly threatens staging and deployment.
5. **No enforced Definition of Done** — without a DoD gate, "Done" issues may still carry hidden QA or validation gaps into Sprint 4.

## Recommended Actions for Sprint 4

- **Priority 1:** Complete Docker + Cloud Run staging setup before the demo.
- **Priority 2:** Run E2E and security tests — Yuhao to finish integration and contract validation.
- **Priority 3:** Define and enforce a Definition of Done — add a DoD checklist to the PR template.
- **Priority 4:** Run an accessibility sprint — Andrew and Milo to close WCAG AA gaps.
- **Priority 5:** Set GCP cost budget alerts before Cloud Run costs escalate.

## Retrospective Conclusion

Sprint 3 resolved the project's two highest-severity risks from Sprint 2 — backend implementation and ML model training — with both workstreams fully closing out their committed scope. That is a significant de-risking of the MVP. The cost was overcommitment: 65 issues was more than the team's demonstrated velocity could absorb, and the resulting gaps in QA, staging, and a second frontend carryover are the direct consequence. Sprint 4 should size scope to actual velocity, treat staging and testing as first-class Day 1–2 priorities rather than late-sprint clean-up, and address the repeated frontend rollover as a root-cause conversation rather than a third carry-forward.
