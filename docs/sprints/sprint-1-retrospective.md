# Tablé — Sprint 1 Retrospective

COMP47360 Team 2

*Sprint Period: May 18, 2026 - June 5, 2026 | Prepared by: Chukwuemeka Nwoke (Integration Lead / Scrum Master)*


**Goal:** Define user stories, mockups, technology selection, and early prototypes.

Sprint 1 established the project foundation across backend, frontend, mobile, and team operations. The team made strong progress on architecture, documentation, mobile research, and early interface definition. At the same time, several important discovery and infrastructure items remained unfinished, especially in Data & ML and project tooling. Overall, the sprint produced meaningful groundwork, but completion was uneven across workstreams.

**Overall outcome:** 13 of 21 stories were completed during the sprint, for an estimated completion rate of **62%**. Mobile finished all planned stories, backend completed most foundation work, and documentation/cross-team communication were delivered successfully.

## Snapshot

| Area | Completed | Not Completed | Summary |
|---|:--:|:--:|---|
| Backend | 5 | 2 | Strong foundation delivered, with follow-up research still open |
| Frontend | 3 | 1 | Initial direction and mockups completed, design system planning slipped |
| Data & ML | 0 | 4 | No planned discovery work was completed |
| Mobile | 3 | 0 | All sprint commitments completed |
| DevOps / Management | 2 | 1 | Documentation and alignment completed, tooling setup not finished |

## What went well

- **Backend foundation moved quickly.** Core setup work was completed, including service bootstrap, schema design, API contract, architecture decision record, and dataset strategy.
- **Mobile execution was the strongest area.** Mobile architecture, geolocation and permissions research, and push notification setup were all completed by the end of the sprint.
- **Frontend made visible progress.** Framework investigation and user story/mockup work gave the team clearer product direction.
- **Team enablement work helped project clarity.** Documentation and cross-team alignment were completed, reducing ambiguity for future sprints.
- **Several high-priority items were closed.** This suggests the team can deliver foundational work effectively when scope is clear and dependencies are limited.

## What did not go well

- **Data & ML made no measurable sprint progress.** Four planned stories remained in To Do, creating risk for downstream backend and product decisions.
- **Infrastructure setup was not completed.** Project tooling and environment readiness were still open at sprint end.
- **Some backend discovery work slipped.** The geospatial/routing feasibility spike and ML integration interface spec remained unfinished.
- **Design system planning did not start.** This may slow UI consistency and handoff quality in later sprints.
- **Commitment balance across workstreams appears uneven.** Some contributors completed all items, while others had no completed sprint deliverables.

## Key learnings

- **Foundational engineering tasks are easier to deliver than exploratory research tasks.** Research-heavy work may need tighter definition, smaller slices, or stronger checkpoints.
- **Cross-functional dependencies need earlier visibility.** Backend and product planning depend on Data & ML discoveries, so delays there affect the broader roadmap.
- **Work should be sized for sprint completion, not just inclusion.** Several unfinished items look like valid objectives, but they may have been too broad or insufficiently broken down.
- **Clear ownership alone is not enough.** The team needs progress tracking, early escalation, and support when work stalls.

## Completed work highlights

- [SCRUM-5](https://table-ucdconnect.atlassian.net/browse/SCRUM-5) — Backend service bootstrap
- [SCRUM-11](https://table-ucdconnect.atlassian.net/browse/SCRUM-11) — PostgreSQL schema design v1
- [SCRUM-39](https://table-ucdconnect.atlassian.net/browse/SCRUM-39) — API contract v0
- [SCRUM-40](https://table-ucdconnect.atlassian.net/browse/SCRUM-40) — System architecture decision record
- [SCRUM-41](https://table-ucdconnect.atlassian.net/browse/SCRUM-41) — Dataset and busyness strategy
- [SCRUM-42](https://table-ucdconnect.atlassian.net/browse/SCRUM-42) — Frontend framework investigation
- [SCRUM-43](https://table-ucdconnect.atlassian.net/browse/SCRUM-43) — User story definition and mockups
- [SCRUM-44](https://table-ucdconnect.atlassian.net/browse/SCRUM-44) — Mobile app framework investigation
- [SCRUM-87](https://table-ucdconnect.atlassian.net/browse/SCRUM-87) — Mobile app architecture and navigation
- [SCRUM-88](https://table-ucdconnect.atlassian.net/browse/SCRUM-88) — Geolocation and permissions research
- [SCRUM-89](https://table-ucdconnect.atlassian.net/browse/SCRUM-89) — Push notifications setup
- [SCRUM-91](https://table-ucdconnect.atlassian.net/browse/SCRUM-91) — Documentation and knowledge base setup
- [SCRUM-92](https://table-ucdconnect.atlassian.net/browse/SCRUM-92) — Cross-team alignment and communication

## Carryover risks for next sprint

**Main risk:** Unfinished discovery and infrastructure tasks may block implementation work in Sprint 2 if they are simply rolled over without re-scoping.

- Data quality and ML research remain unvalidated
- Geospatial feasibility is still unclear
- ML integration boundaries are not yet defined
- Project infrastructure/tooling may slow team productivity if left incomplete
- Design system planning delay could create inconsistent frontend and mobile patterns

## Recommended actions for Sprint 2

- Re-scope unfinished Data & ML stories into smaller, reviewable tasks with mid-sprint checkpoints.
- Prioritize infrastructure/tooling setup early to remove delivery friction.
- Confirm whether geospatial spike and ML interface spec are blockers for upcoming implementation work.
- Add an explicit dependency review during sprint planning.
- Track workstream health mid-sprint so stalled areas are escalated sooner.
- Decide whether design system planning should remain in Sprint 2 or be split into a lighter starter task.

## Retrospective conclusion

Sprint 1 was a productive foundation sprint, especially for backend, mobile, and team coordination. The strongest signal is that the team can deliver well-defined setup work. The main concern is uneven execution across workstreams, particularly where research and planning tasks were broader or less structured. For **Sprint 2**, the biggest improvement opportunity is to break discovery work into smaller outcomes, surface blockers earlier, and align commitments more evenly across the team.

## Key observations (end-of-sprint check-in)

- **Sprint ends today** — 8 stories (38%) are still in "To Do" status.
- **Mobile** is fully complete — Milo delivered all 3 stories.
- **Data & ML is at risk** — all 4 of Jack Xu's stories remain in "To Do".
- **Backend** has 2 remaining items: the geospatial spike and ML integration spec.

## References

- [Sprint 1 Jira issue list](https://table-ucdconnect.atlassian.net/issues/?jql=sprint%20%3D%201%20ORDER%20BY%20key%20ASC)
- [Sprint 1 metadata](https://table-ucdconnect.atlassian.net/rest/agile/1.0/sprint/1)
- [Gantt Chart - Sprint 1](https://table-ucdconnect.atlassian.net/avpviz/c/3a35c85b-f090-4bdc-89b0-58b2971c5162/w/08da0440-80a1-46e2-94d0-6fb01a857d93/d/daae2d23-a202-4318-9d20-86d899179a4a/chart/6c8f865a-3e30-415a-84a0-7d3eea82496c)
