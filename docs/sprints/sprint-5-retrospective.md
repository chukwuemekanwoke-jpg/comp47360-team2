# Tablé — Sprint 5 Retrospective

COMP47360 Team 2

*Snapshot as of August 5, 2026 | Prepared by: Chukwuemeka Nwoke, Integration Lead / Scrum Master*

## Executive Summary

Sprint 5 ran 2026-07-22 to 2026-08-05 under the goal "Polished apps, Paper, Demo, Interviews" and closed as a clean sweep on the board: all 18 sprint-tagged issues reached Done, a marked improvement on Sprint 4's 72% (39 of 54). Nearly every carryover risk flagged in the Sprint 4 retrospective was resolved this sprint — ML maturity, QA/product research, and the database backup plan all closed. As this is the project's final sprint, the GCP/Firebase environment was intentionally decommissioned on 2026-08-01, following the project demo, to stop further billing — a deliberate wind-down step, not an incident. The one real process gap this sprint is documented below: `main` had been diverged from `develop` since a revert four weeks earlier, reconciled only in the sprint's final hours through a conflict-resolution pass that caught real, silent data loss in git's own auto-merge.

## What Went Well

**1. Full Board Clear — Every Sprint-Tagged Story Closed**

- 18 of 18 sprint-tagged issues (Story, Task, and Bug types alike) reached Done, with none left In Progress or In Review at sprint close — unlike Sprint 4, which closed 72% by count.
- **Impact:** no carryover backlog going into the next phase of work; the board genuinely reflects a finished increment, not a partial one requiring another clean-up pass.
- **Ownership:** whole team.

**2. Sprint 4's Two Largest Carryover Risks Fully Resolved**

- Data & ML, the Sprint 4 retro's Critical risk at 25% complete, closed all five remaining items this sprint: model evaluation/hyperparameter tuning (SCRUM-261), the heuristic match fallback (SCRUM-302), RevPASH-informed retraining (SCRUM-345), drift monitoring (SCRUM-346), and the paper's ML section (SCRUM-347). Independently verified in code: `model_service.py` loads Rui's trained XGBoost pipeline as the live model, with the heuristic `area_factor.py` demoted to a feature-input helper feeding it — not a competing predictor — per RISK_REGISTER R-05's closure.
- QA/product research, Sprint 4's High risk at 50%, also fully closed: both usability rounds (SCRUM-279 internal, SCRUM-280 external) plus the user interview session (SCRUM-348) and its feedback synthesis (SCRUM-349).
- **Impact:** both areas the Sprint 4 retro flagged as blocking a credible final demo and paper are now closed, not carried a third sprint.
- **Ownership:** Jack Xu (ML), Yuhao Xu (QA/product research).

**3. Database Backup & Recovery Plan Closed With Real Verification**

- TABL-509, open since before Sprint 4 and tied to the risk register's R-14 (Critical: unconfirmed Cloud SQL backup), closed this sprint (SCRUM-309). RISK_REGISTER records this wasn't just marked done — it was verified directly via the Cloud SQL Admin API: backups enabled, 7 retained (count-based), point-in-time recovery on, 7-day transaction log retention.
- **Impact:** closes the last Critical item still open at Sprint 4's close.
- **Ownership:** Chukwuemeka Nwoke.

**4. Booking Lifecycle Hardened With Three New Rules**

- New backend work (not carried from Sprint 4): booking cardinality (one active booking per user, SCRUM-352), auto-cancel on hold timeout (SCRUM-353), and a 5-booking retention cap per user (SCRUM-354). Verified directly in `database/schema.md` and migration `009_booking_lifecycle_rules.sql`: a unique partial index enforces the cardinality rule, the API lazily cancels lapsed holds, and the newest 5 bookings per user are retained after each create.
- **Impact:** closes three real correctness gaps in the booking flow that had no enforcement before this sprint.
- **Ownership:** Yang Liu.

**5. Rate Limiter Vulnerability From Sprint 4 Fixed and Verified Live**

- TABL-115 (Rate Limiting & DDoS Protection, SCRUM-239) closed a real production incident: the auth rate limiter shipped in Sprint 4 keyed purely on client IP, locking out mobile users behind a shared carrier IP within its first night live (RISK_REGISTER R-25). Fixed by keying on route + IP + a hash of the email/token instead, and confirmed genuinely deployed — not just merged — by matching the fix commit against the live Cloud Run revision's image tag.
- **Impact:** closes a Critical, user-facing incident with a verified-live fix, not just a merged PR.
- **Ownership:** Yang Liu, Chukwuemeka Nwoke.

## What Did Not Go Well

**1. `main` Diverged From `develop` for a Full Month, Reconciled Only at Sprint Close**

- `main` has been stuck since PR #48 reverted PR #45 ("Feature/merchant restaurant onboarding") on 2026-07-09 — before this sprint even started — while `develop` built JWT auth, RevPASH, EDI accessibility matching, and the merchant dashboard rebuild on top of the assumption that PR #45 was still there. The reconciliation PR (#91) sat open 12 days without merging and drifted into real conflicts; closing it and resolving fresh (PR #122) surfaced that git's own line-based auto-merge had silently corrupted five files with no conflict marker at all — including reverting `AuthContext.jsx` to a fake pre-JWT demo-auth pattern and stripping a WCAG contrast fix from `index.css`.
- **Risk:** had this not been caught by diffing the resolved tree directly against `develop` rather than trusting the absence of conflict markers, `main` would have silently regressed real, shipped functionality.
- **Root Cause:** a large revert wasn't immediately reconciled between branches, letting the divergence compound for a month.
- **Mitigation:** PR #122 is open with all CI green, pending the same review gate PR #91 used; going forward, treat a `main`/`develop` divergence caused by a revert as needing prompt reconciliation, not indefinite deferral.

## Key Learnings

- Verifying against live/direct sources (Cloud SQL Admin API, a real deployed Cloud Run revision's image tag, a full tree diff against the target branch) caught real problems that trusting documentation or the absence of a conflict marker would have missed — this was true for R-13/R-25 in Sprint 4 and repeated for the PR #122 merge this sprint.
- A revert of a large feature needs the same urgency as the feature itself — letting `main` drift from `develop` for a month turned a routine promotion into a one-time reconciliation project at the sprint's close.

## Snapshot By Owner

| Owner | Done | Open | Summary |
|---|:--:|:--:|---|
| Yang Liu (Backend Lead) | 4 | 0 | Booking lifecycle hardening (cardinality, timeout, 5-booking retention cap) plus the Sprint 4 rate-limiter incident fix (TABL-115). Zero carryover. |
| Jack Xu (Data & ML Lead) | 5 | 0 | Closed every remaining Sprint 4 ML carryover item: model evaluation/tuning, heuristic fallback, RevPASH-informed retraining, drift monitoring, and the paper's ML section. |
| Yuhao Xu (Product Lead) | 4 | 0 | Closed every remaining Sprint 4 QA/product-research carryover item: both usability rounds (internal + external), the user interview session, and feedback synthesis. |
| Chukwuemeka Nwoke (Scrum Master & Integration) | 3 | 0 | Database backup & recovery plan (verified live via Cloud SQL Admin API), performance testing (the same investigation that surfaced R-23 in Sprint 4), security testing (input validation / SQL injection). |
| Andrew Mitchell (Frontend Lead) | 2 | 0 | Usability & accessibility fixes (web) and the push-notifications integration ticket. |
| Milo Dennehy (Mobile Lead) | 0 | 0 | No ticket owned this sprint — consistent with Mobile fully clearing its Sprint 4 scope (8/8), but worth confirming this was intentional rather than a board-tagging gap. |

**Key Signal:** Sprint 5 closed the board completely (18/18) and resolved both of Sprint 4's flagged carryover risks (ML maturity, QA/product research) plus its lingering Critical (DB backup). The one gap this sprint is branch hygiene: `main` was reconciled with `develop` only at the very end, after a month of drift — the one area a genuinely "final" sprint most needed clean.

## Carryover Items Before Final Submission

- PR #122 (`develop`→`main`) awaiting the same approving-review gate PR #91 needed — all CI green, conflict-free, but not yet merged.

## Completed Work Highlights

| Jira Key | TABL | Story Name | Owner | Status |
|---|:--:|---|---|:--:|
| SCRUM-352 | — | Booking Cardinality Constraint - Single Active Booking Per User | Yang Liu | Done |
| SCRUM-353 | — | Booking Timeout - Auto-Cancel Lapsed Bookings | Yang Liu | Done |
| SCRUM-354 | — | Booking History Retention Cap - Keep Last 5 Per User | Yang Liu | Done |
| SCRUM-239 | TABL-115 | Rate Limiting & DDoS Protection | Yang Liu | Done |
| SCRUM-261 | TABL-404 | Model Evaluation & Hyperparameter Tuning | Jack Xu | Done |
| SCRUM-302 | TABL-401 | Heuristic Match Algorithm (Fallback) | Jack Xu | Done |
| SCRUM-345 | TABL-407 | RevPASH-Informed Model Retraining | Jack Xu | Done |
| SCRUM-346 | TABL-408 | Model Drift Monitoring | Jack Xu | Done |
| SCRUM-347 | TABL-409 | ML Section - Final Paper Contribution | Jack Xu | Done |
| SCRUM-279 | TABL-606 | Usability Test - Internal Team | Yuhao Xu | Done |
| SCRUM-280 | TABL-607 | Usability Test - External Users | Yuhao Xu | Done |
| SCRUM-348 | TABL-623 | User Interview Session - Schedule & Facilitate | Yuhao Xu | Done |
| SCRUM-349 | TABL-624 | User Feedback Synthesis - Sprint 4 | Yuhao Xu | Done |
| SCRUM-309 | TABL-509 | Database Backup & Recovery Plan | Chukwuemeka Nwoke | Done |
| SCRUM-277 | TABL-604 | Performance Testing - Load & Latency | Chukwuemeka Nwoke | Done |
| SCRUM-278 | TABL-605 | Security Testing - Input Validation / SQLi | Chukwuemeka Nwoke | Done |
| SCRUM-340 | TABL-217 | Usability & Accessibility Fixes - Web | Andrew Mitchell | Done |
| SCRUM-299 | TABL-308 | Push Notifications Integration (Firebase) | Andrew Mitchell, Milo Dennehy | Done |

## Not Completed (Open at Sprint Close)

None — all 18 sprint-tagged issues reached Done. See "What Did Not Go Well" above for the one real process item that doesn't show up as an open ticket on this board.

## Key Takeaway

- Sprint 5 closed every sprint-tagged story (18/18) and resolved both risks the Sprint 4 retrospective flagged as the sprint's real gap — ML maturity and QA/product research — plus the last open Critical (database backup).
- The GCP/Firebase environment was intentionally decommissioned at sprint end, following the project demo, to stop further billing — a deliberate wind-down step now that the project is complete, not an outstanding risk.
- `main` had drifted from `develop` for a month before being reconciled only in the sprint's closing hours — a reconciliation that itself caught git silently corrupting five files with no conflict marker.
- Net: implementation and validation work is genuinely finished; the only remaining step is merging PR #122 so `main` reflects everything shipped this project.

## Sprint 5 Risk Assessment

**High Risk: `main`/`develop` Reconciliation Not Yet Merged**

- Status: PR #122 open, all CI green, conflict-free, awaiting the same approving review PR #91 needed.
- Impact: High — `main` remains a month stale until this merges.
- Severity: HIGH, resolution in progress.

## Retrospective Conclusion

Sprint 5 delivered a complete sweep of its board — all 18 sprint-tagged stories reached Done, resolving both risks the Sprint 4 retrospective identified as the sprint's real gap (Data & ML at 25%, QA/product research at 50%) along with the last open Critical item (database backup & recovery). New booking-lifecycle hardening and a verified-live fix for Sprint 4's rate-limiter incident rounded out backend work with zero carryover. With the project now complete and demoed, the GCP/Firebase environment was intentionally decommissioned to stop further billing — a deliberate close-out step, not a defect. The one real process gap this sprint sits outside the board: `main` had diverged from `develop` for a full month before being reconciled only in the sprint's final hours, a reconciliation that itself surfaced git silently corrupting five files with no conflict marker — caught only because the resolved tree was diffed directly against `develop` rather than trusting the merge's own conflict output. So while implementation and validation are genuinely complete for this project, the one remaining step is merging PR #122 so that `main` reflects everything shipped.
