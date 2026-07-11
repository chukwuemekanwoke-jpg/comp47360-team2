# Risk Register — TABL-611

Maintained per TABL-611 (Risk Register - Monitor & Escalate Blockers). Reviewed at each standup; new risks added as identified, mitigation status updated as work lands. Last updated: 2026-07-11.

## Escalate now (Critical / High severity, active blockers)

| ID | Description | Likelihood | Impact | Risk Level | Owner |
|----|---|---|---|---|---|
| R-04 | `ml-service` (fastapi-app) has **no confirmed deploy mechanism** — no GitHub Actions step, no visible Cloud Build/Cloud Run trigger config anywhere in the repo. Today's busyness-prediction work (area_factor.py + /predict/busyness wiring) may be unable to reach staging even after merging, regardless of code correctness. | Medium-High | High — blocks shipping the core deliverable | **Critical** | chukwuemekanwoke-jpg |
| R-02 | `main` still has **zero branch protection**. Already caused one incident (Yang Liu's PR #45 merged unreviewed, later reverted via PR #48). Next `develop`→`main` promotion is unprotected against a repeat. | High (has already happened once) | High (production branch) | **Critical** | chukwuemekanwoke-jpg |
| R-01 | `main` is missing functionality present on `develop`/`integrate` (JWT auth, restaurant registration routes, migrations 004/005) because PR #48 reverted PR #45 on `main` only. Promoting `develop`→`main` without reconciling this could produce confusing conflicts or silently drop work. | Medium | High | High | chukwuemekanwoke-jpg |
| R-09 | RevPASH has **zero backend progress** (no schema, no route, no aggregation view) and depends entirely on Yang Liu (SCRUM-302/TABL-118), whose current status is unconfirmed. Sprint deliverable at risk. | High | Medium-High | High | Yang Liu (assigned) / escalate if no update by next standup |

## Full register

| ID | Description | Category | Likelihood | Impact | Risk Level | Mitigation | Owner | Status |
|----|---|---|---|---|---|---|---|---|
| R-01 | `main` missing auth/registration/migration work reverted by PR #48, diverging from `develop`/`integrate` | Operational | Medium | High | High | Reconcile deliberately before next promotion — decide whether PR #45's content should be reintroduced via a fresh, reviewed PR | chukwuemekanwoke-jpg | Open — planned, not started |
| R-02 | No branch protection on `main` | Operational | High | High | **Critical** | CODEOWNERS (me only) + "require review from code owners," `enforce_admins` off — planned before next promotion | chukwuemekanwoke-jpg | Open — planned, not started |
| R-03 | GCP deploy trigger status for api-gateway unverified from repo; `TASKS.md` claims `gcloud run deploy` steps exist in `deploy-staging.yml` but the file doesn't contain one | Operational | Medium | Medium-High | High | Verify Cloud Run trigger config directly in GCP Console; correct the TASKS.md entry once confirmed | chukwuemekanwoke-jpg | Open — action assigned, awaiting Console check |
| R-04 | `ml-service` has no confirmed deploy mechanism at all | Operational | Medium-High | High | **Critical** | Confirm or create a Cloud Run deploy path for fastapi-app (Console-side continuous deploy, or explicit `gcloud run deploy` step) | chukwuemekanwoke-jpg | **Open — blocking, escalate** |
| R-05 | `origin/TeslatotheMars-patch-5`: stale base, deletes `RestaurantSetupView.jsx`+tests and the fastapi-app `Dockerfile` (which we just fixed today), bundles an unrelated 100k-row Egyptian delivery dataset | Operational | Low-Medium | High | High | Do not merge until Rui confirms intent — asked in group chat 2026-07-11 | Rui (clarify) / chukwuemekanwoke-jpg (gatekeep) | Open — escalated, awaiting reply |
| R-06 | Duplicated busyness-prediction effort: our heuristic area_factor vs. Rui's already-trained OLS/RF/XGBoost model, both targeting the same problem | Strategic | Medium | Medium | Medium-High | Coordination message sent 2026-07-11; holding further busyness/model work until Rui responds | chukwuemekanwoke-jpg + Rui | Open — mitigation in progress |
| R-07 | `tabl_app` Cloud SQL password is weak (`ChangeMe1!`) and was pasted in plaintext in earlier chat-history debugging | Security | Low | Medium | Medium | Rotate to a random alphanumeric-only password (staging DB only, not prod) | chukwuemekanwoke-jpg | Open — not started |
| R-08 | `enrich-places.js` blocked on Places API (New) being enabled + real spend approval — easy to forget since it needs manual GCP Console action | Financial/Operational | Medium | Low | Low | Tracked in TASKS.md; enable + approve when convenient | chukwuemekanwoke-jpg | Open — low priority |
| R-09 | RevPASH: no schema, no route, no revenue data; depends on Yang Liu's unconfirmed SCRUM-302 status | Operational | High | Medium-High | High | Send coordination note to Yang Liu; consider starting migration 006 directly if no response by next standup | Yang Liu / chukwuemekanwoke-jpg | Open — blocked on external confirmation |
| R-10 | `rolling_busyness_7d` still never computed/fed to `/predict/busyness` despite `availability_snapshots` now being written — a silent quality gap, not an outage | Operational | High | Low-Medium | Medium | Build a 7-day rolling-average aggregation query and wire it into the busyness client call | chukwuemekanwoke-jpg | Open — not started |
| R-11 | `GET /restaurants/nearby` (diner-facing) still shows static busyness while the merchant detail view is live — inconsistent numbers across surfaces | Reputational | High | Medium | Medium | Deliberately deferred pending a batched/cached design (avoid N+1 ml-service calls from a list endpoint) | chukwuemekanwoke-jpg | Open — design decision needed |
| R-12 | Local `main`/`develop` branches can silently drift far behind origin (found 32/35 commits behind on 2026-07-11) with no process to prevent recurrence | Operational | Medium-High | Low-Medium | Medium | Adopt a habit of `git fetch --all` at the start of any session before drawing conclusions from local branch state | chukwuemekanwoke-jpg | Open — informal awareness only |
| R-13 | `TASKS.md` "Done" entries can be inaccurate relative to actual repo state (see R-03) — undermines trust in the tracker as a status source | Operational | Medium | Medium | Medium | Spot-check other "Done" claims periodically; correct entries once verified | chukwuemekanwoke-jpg | Open — one instance found |

## Mitigated / Closed

_None yet — register created 2026-07-11._

## Standup log

- **2026-07-11**: Register created from findings surfaced during busyness-prediction wiring work and branch review. 4 items flagged for escalation (R-01, R-02, R-04, R-09). Awaiting: Rui's reply (R-05, R-06), Yang Liu's status (R-09), GCP Console verification (R-03, R-04).
