# Tablé — Sprint 2 Retrospective

COMP47360 Team 2

*Sprint Period: June 8–19, 2026 | Prepared by: Chukwuemeka Nwoke (Integration Lead / Scrum Master)*

## Executive Summary

Sprint 2 closed with 10 of 15 committed stories completed — a 67% completion rate. Specification work (architecture, API contract, database schema, and user stories) reached roughly 95% completion, while code implementation sat at approximately 20%. This split was intentional: the team prioritized locking the architecture (ADR-001 Rev 3) before writing implementation code, in order to avoid rework once development began in earnest.

The most significant unmitigated risk carried into Sprint 3 is ML model training — the Data & ML workstream completed only 1 of 4 stories (25%), and the `POST /api/v1/match` endpoint that the flash deals feature depends on remains unbuilt. This is a bigger blocker than backend or frontend capacity and requires direct attention at the start of Sprint 3.

## Sprint 2 Snapshot by Workstream

| Workstream | Completed | In Progress / To Do | Notes |
|---|:--:|:--:|---|
| Backend | 4 | 0 | All 4 core API stories done — Gateway foundations, seed data plan, users/discovery endpoints, ETA & booking confirmation endpoints. |
| Frontend | 2 | 2 | Basic web app structure and Restaurant Detail Page shipped. Search & Discovery Screen and Redux state management still in progress. |
| Mobile | 3 | 0 | Basic app structure, geolocation integration, and search screen all complete — strongest workstream this sprint. |
| Data & ML | 1 | 3 | Only data cleaning & preparation complete. ML model training, feature engineering, and time-series prep not started — primary Sprint 3 risk. |
| Product & UX | — | — | All 5 user stories (1.1–5.2) detailed with BDD acceptance criteria. Complete. |
| DevOps / Integration | — | — | CI/CD gates designed but not yet implemented in GitHub Actions. |

*Key signal: specification work (upstream) is ~95% complete; implementation work (code) is ~20% started. This gap is expected given the sequencing decision, but it means Sprint 3 begins under real implementation pressure.*

## What Went Well

1. **Architecture finalized without rework** — ADR-001 Rev 3 crystallized all stack decisions, ending scope creep and giving the team one canonical source of truth.
2. **API contract comprehensive and machine-readable** — `docs/api-contract-v0.md` and `openapi-v0.yaml` were completed, letting Frontend and Backend work in parallel without ambiguity.
3. **Database schema delivered and tested** — all core tables designed with migrations written and tested; the data layer is ready for integration.
4. **User stories detailed to BDD level** — every P0 story has Gherkin Given/When/Then scenarios, giving unambiguous acceptance criteria.
5. **Frontend and mobile scaffolding fast-tracked** — Next.js + Tailwind configured on web; Expo Router + NativeWind complete on mobile, ready for Sprint 3 component build.
6. **Data strategy locked, no surprises on ML sourcing** — datasets identified and sourced, busyness modeling formula written; MVP can ship with a heuristic match if the trained model isn't ready in time.
7. **Team coordination and documentation** — the knowledge base stayed populated throughout the sprint, with ADRs, user stories, and the API contract all living in the repo. Zero information silos.

## What Did Not Go Well

1. **Backend implementation lagged behind design** — routes were stubbed without full persistence wiring in places, putting pressure on early Sprint 3 days.
2. **CI/CD pipeline not integrated** — GitHub Actions workflows were designed but not committed; the API-contract validation gate existed only as a design, not as a running check.
3. **Design system planning deferred again** — started in Sprint 1, slipped to Sprint 2, slipped again to Sprint 3. Risk of inconsistent styling between web and mobile if not addressed early.
4. **ETA validation (geospatial spike) not de-risked** — the Google Distance Matrix integration was not prototyped, so cost and quota assumptions remain unvalidated.
5. **ML model training not started** — data was sourced and the heuristic was designed, but zero lines of model code were written. This is the sprint's biggest shortfall.
6. **Frontend capacity concerns not addressed** — two frontend stories (Search & Discovery Screen, Redux state management) carried over, signaling the frontend workstream may be under-resourced relative to scope.

## Key Learnings

- Specification-heavy sprints need explicit closure criteria, or spec work can quietly consume the whole sprint.
- Heuristic fallbacks (e.g., random/rule-based matching in place of a trained model) are an effective way to de-risk feature deadlines without blocking the whole team.
- Deferred design-system work compounds — each sprint it slips, the eventual cost of retrofitting consistent styling grows.
- Specification drift requires enforced CI gates, not just documented intent — a designed check that isn't running provides no actual protection.
- Frontend and ML capacity, not backend, are the real bottlenecks heading into Sprint 3 — resourcing and escalation should focus there first.

## Completed Work Highlights (10 of 15 stories — 67%)

Verified against the Atlassian Jira board (project key SCRUM):

| Story ID | Jira Key | Story Name | Owner |
|---|---|---|---|
| SCRUM-147 | TABL-008 | Gateway dev foundations | Yang Liu |
| SCRUM-148 | TABL-009 | Seed data plan (design only) | Yang Liu |
| SCRUM-225 | TABL-011 | Implement users and discovery API endpoints | Yang Liu |
| SCRUM-226 | TABL-006 | Add restaurant ETA and booking confirmation endpoints | Yang Liu |
| SCRUM-152 | TABL-105 | Basic Web App Structure | Andrew Mitchell |
| SCRUM-154 | TABL-107 | Restaurant Detail Page | Andrew Mitchell |
| SCRUM-155 | TABL-205 | Data Cleaning & Preparation | Rui Xu |
| SCRUM-158 | TABL-304 | Basic Mobile App Structure | Milo Dennehy |
| SCRUM-159 | TABL-305 | Mobile Geolocation Integration | Milo Dennehy |
| SCRUM-160 | TABL-306 | Mobile Search Screen | Milo Dennehy |

## Not Completed (5 of 15 stories — 33%)

| Story ID | Jira Key | Story Name | Owner | Status |
|---|---|---|---|---|
| SCRUM-153 | TABL-106 | Search & Discovery Screen | Andrew Mitchell | In Progress |
| SCRUM-224 | TABL-307 | Frontend Redux State Management | Andrew Mitchell | In Progress |
| SCRUM-151 | TABL-008 | Initial ML Model Training | Rui Xu | To Do |
| SCRUM-156 | TABL-206 | Feature Engineering for Matching | Rui Xu | To Do |
| SCRUM-157 | TABL-207 | Time-Series Data Preparation | Rui Xu | To Do |

*All five incomplete stories rolled over into Sprint 3 as carryover work.*

## Carryover Risks for Sprint 3

1. **ML model training not started** — highest severity. The `POST /api/v1/match` endpoint depends on this, and it directly gates the flash deals feature. Heuristic/random match is the agreed contingency if the model isn't ready.
2. **Frontend carryover (2 stories)** — Search & Discovery Screen and Redux state management need to close early in Sprint 3 to avoid compounding delays.
3. **ETA / geospatial validation unprototyped** — Google Distance Matrix cost and quota assumptions still need real-world validation before the reachability feature can be trusted.
4. **CI/CD pipeline not yet running** — SCRUM-401–404 must go green early in Sprint 3; treated as a non-negotiable Day 1 deliverable.
5. **Design system still deferred** — risk of visual inconsistency between web and mobile grows the longer this is pushed back.

## Recommended Actions for Sprint 3

- **Day 1:** Land CI/CD gates (SCRUM-401–404) and confirm they're green before other work proceeds.
- **Day 1–2:** Escalate directly with Rui Xu on ML model training status; agree on a go/no-go checkpoint for the heuristic fallback.
- **Day 2–3:** Close out the two frontend carryover stories before starting new frontend scope.
- **Day 3:** Prototype the Google Distance Matrix integration to validate cost/quota assumptions ahead of the reachability feature build.
- **Ongoing:** Build a lightweight design system pass (even a 1-hour token/style sweep) to stop further slippage.

## Workstream Summary by Owner

| Owner | Role | Sprint 2 Result |
|---|---|---|
| Yang Liu | Backend Lead | 4/4 stories complete (100%) — strongest backend showing of the project so far. |
| Andrew Mitchell | Frontend Lead | 2 complete, 2 in progress — on track but needs early Sprint 3 closure on carryover. |
| Milo Dennehy | Mobile Lead | 3/3 stories complete (100%) — mobile scaffolding and core screens ahead of plan. |
| Rui Xu | Data & ML Lead | 1/4 stories complete (25%) — ML model training is the critical path risk for Sprint 3. |
| Yuhao Xu | Product Owner | All 5 user stories detailed to BDD level — specification work complete. |
| Chukwuemeka Nwoke | Integration Lead / Scrum Master | CI/CD gates designed but not yet running in GitHub Actions — top Sprint 3 Day 1 priority. |

## Retrospective Conclusion

Sprint 2 delivered a strong specification foundation — architecture, API contract, database schema, and user stories are all locked and unlikely to require rework. Backend and Mobile closed their committed scope in full. The gap is concentrated in two places: Data & ML, where model training has not started and is now the single biggest risk to the flash deals feature, and Frontend, where two stories are carrying over. Sprint 3 should treat CI/CD and the ML escalation as Day 1 priorities, with frontend carryover closed early to keep pace with the rest of the team.
