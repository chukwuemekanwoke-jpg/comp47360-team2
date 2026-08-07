# Runbook: Rollback & Recovery Procedures (TABL-507)

**Author / Owner:** Chukwuemeka Nwoke — Integration Lead / Scrum Master | **Frequency:** As needed (bad deploy, incident)
**Last Updated:** 2026-07-11 | **Last Run:** Never (git-revert step timed in isolation; full rollback path not yet drilled end-to-end — see [Status](#status-against-the-ticket) below)

## Status against the ticket

TABL-507 asks for three things. Honest status on each, as of 2026-07-11:

| Requirement | Status |
|---|---|
| Document rollback steps: git revert + redeploy | **Partially done.** `git revert` mechanics documented and timed for real (below). The "redeploy" half is **blocked** — see [Prerequisites](#prerequisites). |
| Test recovery from staging backup | **Not done — blocked.** No Cloud SQL automated backup is confirmed configured anywhere (repo, config, or docs). There is nothing to test recovery *from* yet. |
| Ensure <2 min rollback time | **Not achievable yet, and not with the mechanism the ticket implies.** A git-revert-triggers-CI-rebuild-redeploy path cannot hit 2 minutes — `ci.yml` alone runs 5 jobs that each realistically take 2-5 minutes. The actual sub-2-minute mechanism is Cloud Run's built-in revision traffic-shift (no rebuild needed), but it's unconfirmed whether Cloud Run is even the live deploy target for `api-gateway`/`ml-service` today (this is [R-02](../RISK_REGISTER.md)/[R-03](../RISK_REGISTER.md) in the risk register — Critical severity, already escalated). This runbook documents the *intended* fast path so it's ready to verify and use once that's confirmed, rather than presenting an untested claim as fact. |

## Purpose

Roll back a bad deploy of the TABL app (web frontend, `api-gateway`, or `ml-service`) to the last known-good state, as fast as possible, without losing data.

## Prerequisites

- [ ] **GCP Console access** to `tabl-app-staging` — needed to confirm the two open questions below before this runbook can be fully exercised.
- [ ] **Confirm the actual deploy mechanism for `api-gateway`/`ml-service`.** `deploy-staging.yml`'s comment claims a "Cloud Build trigger... configured directly on the Cloud Run service," but this is unverified from the repo (R-02). If confirmed, note whether it deploys on every push to `develop` or requires a manual trigger — this changes the rollback path entirely (see [Step 2](#step-2-redeploy-the-backendml-service-two-possible-paths)).
- [ ] **Confirm whether Cloud SQL automated backups are enabled** on `tabl-db-staging`. Not found anywhere in repo config; may not be provisioned. Check via:
  ```
  gcloud sql instances describe tabl-db-staging --project=tabl-app-staging --format="value(settings.backupConfiguration)"
  ```
- [ ] `git` and repo write access (for the revert path).
- [ ] `gcloud` CLI authenticated against `tabl-app-staging`, if using the Cloud Run traffic-shift path.
- [ ] `firebase` CLI authenticated, or Console access, for frontend rollback.

## Procedure

### Step 1: Identify the bad commit and confirm scope

```
git log --oneline -10 origin/develop
```

**Expected result:** the commit that introduced the regression is visible near the top. Confirm which service(s) it touches (`frontend/`, `backend/api-gateway/`, `ml-pipeline/fastapi-app/`, `database/migrations/`) — this determines which of the paths below you need.

**If it fails:** if the bad state isn't isolated to one commit (e.g. a bad merge), identify the last good commit instead and treat everything after it as "the bad range."

**If a DB migration shipped in the bad range:** stop and read [DB rollback](#db-rollback-migrations) before touching the app — reverting app code while a new migration is live can be worse than the original bug.

---

### Step 2: Redeploy — the backend/ml-service (two possible paths)

**Path A — Cloud Run revision traffic-shift (fast, target <2 min, NOT YET VERIFIED AVAILABLE):**

If `api-gateway`/`ml-service` are confirmed running on Cloud Run with revision history retained, this is the correct incident-response rollback — it shifts live traffic to the previous already-built revision, no rebuild required:

```
gcloud run services update-traffic api-gateway --to-revisions=PREVIOUS_REVISION=100 --region=europe-west1 --project=tabl-app-staging
gcloud run services update-traffic ml-service   --to-revisions=PREVIOUS_REVISION=100 --region=europe-west1 --project=tabl-app-staging
```
(Replace `PREVIOUS_REVISION` with the actual revision name from `gcloud run revisions list --service=api-gateway --region=europe-west1`.)

**Expected result:** traffic shifts within seconds; no CI run needed.
**If it fails:** `gcloud run revisions list` shows no prior healthy revision (e.g. this is the first deploy), or the service isn't actually on Cloud Run — fall back to Path B.

**Path B — git revert + CI + redeploy (slower, mechanically reliable, cannot hit <2 min today):**

```
git revert --no-edit <bad-commit-sha>
git push origin develop
```

**Expected result:** `ci.yml` runs (5 jobs: openapi-lint, web, mobile, backend, ml-pipeline — realistically 2-5 min each, running in parallel but still gating the merge), then whatever deploy mechanism is actually configured picks up the new `develop` HEAD.

*Verified for real (2026-07-11):* the `git revert` command itself takes ~200ms on this repo — it is never the bottleneck. The bottleneck, if this is the only available path, is CI + rebuild + redeploy, which is why Path A matters and needs to be confirmed as available.

**If it fails:** revert conflicts (rare for a straight revert) — resolve manually, or revert the whole merge commit with `git revert -m 1 <merge-sha>` if the bad change landed via a merge.

---

### Step 3: Redeploy — the frontend (fast, available today)

Firebase Hosting keeps a release history for every deploy to the `live` channel and supports instant rollback — this is the one part of the stack where a real sub-2-minute rollback is available right now, no unconfirmed infrastructure needed:

- **Console:** Firebase Console → Hosting → `tabl-app-staging` → Release history → find the last good release → **Rollback**.
- **CLI:**
  ```
  firebase hosting:channel:list --project tabl-app-staging
  firebase hosting:clone tabl-app-staging:live:<GOOD_VERSION_ID> tabl-app-staging:live
  ```

**Expected result:** live site serves the previous build within seconds.
**If it fails:** release history was pruned (Firebase keeps a limited number of recent releases) — fall back to `git revert` + re-run the `deploy-staging.yml` `deploy` job manually via `workflow_dispatch`.

## DB rollback (migrations)

Only relevant if the bad range included a `database/migrations/*.sql` file.

- Every migration in this repo has a matching `*.down.sql` file (see `database/migrations/`) — run it via `npm run migrate:down` from `database/`.
- **This does not restore data**, only schema. If the bad migration also corrupted/lost data, schema rollback isn't enough — you need the DB backup restore below, which is currently unverified as available (see [Prerequisites](#prerequisites)).

## DB backup recovery (currently blocked — action items, not a tested procedure)

This section is deliberately written as **what needs to happen before this can be tested**, not as a procedure known to work, because backup existence isn't confirmed:

1. Verify backups are enabled (command in [Prerequisites](#prerequisites)). If not enabled, enable them:
   ```
   gcloud sql instances patch tabl-db-staging --backup-start-time=03:00 --project=tabl-app-staging
   ```
2. Once enabled and at least one automated backup has run, list available backups:
   ```
   gcloud sql backups list --instance=tabl-db-staging --project=tabl-app-staging
   ```
3. Restore drill (**do this against staging only, and only with explicit go-ahead — it can overwrite current staging data**):
   ```
   gcloud sql backups restore <BACKUP_ID> --restore-instance=tabl-db-staging --project=tabl-app-staging
   ```
4. Time the restore, record it in [History](#history), and update the [Status](#status-against-the-ticket) table above once actually run.

## Verification

- [ ] Hit the health endpoint of each rolled-back service and confirm it responds: `GET /health` (api-gateway), `GET /health` (ml-service).
- [ ] Confirm the frontend serves the expected (previous-good) build — check a version marker or recently-changed UI element.
- [ ] Re-run the specific flow that was broken (e.g. if the regression was in `/predict/busyness`, hit `GET /api/v1/restaurants/:id` and confirm `busynessScore` is sane).
- [ ] Check `RISK_REGISTER.md` — if the incident exposed a new risk, add it.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `gcloud run services update-traffic` fails with "service not found" | Service isn't actually deployed on Cloud Run under that name/region, or Path A was never actually available | Fall back to Path B; update this runbook once the real service name/region is confirmed |
| CI takes far longer than expected, blocking Path B | One of the 5 `ci.yml` jobs is slow/flaky | Don't wait — use Path A or the Firebase rollback for the frontend while backend CI runs in parallel |
| Revert doesn't fix the symptom | Bad state wasn't actually introduced by the reverted commit (e.g. external dependency, data issue) | Check `RISK_REGISTER.md` for related open risks; don't keep reverting commits blindly |
| DB migration rollback (`migrate:down`) fails | Down-migration wasn't written correctly, or data already depends on the new schema | Do not force it — escalate; this needs manual DBA judgment, not a scripted rollback |

## Rollback (of this runbook's own actions)

If Path A traffic-shift causes a *different* problem (e.g. the "previous" revision wasn't actually healthy), shift traffic forward again to the newer revision — this is symmetric and equally fast. If a DB backup restore was performed and made things worse, there is no further fallback beyond restoring from an even earlier backup — this is why the restore step above requires explicit go-ahead each time, not automation.

## Escalation

| Situation | Contact | Method |
|---|---|---|
| Rollback mechanism itself is unconfirmed/unavailable mid-incident | chukwuemekanwoke-jpg | Direct — this is the owner of R-02/R-03 |
| DB data loss suspected, no backup to restore from | chukwuemekanwoke-jpg | Direct — treat as highest severity, this runbook cannot currently resolve it |
| Migration rollback needs data-level judgment | Whoever authored the migration | Check `git blame` on the migration file |

## History

| Date | Run By | Notes |
|---|---|---|
| 2026-07-11 | Claude (for chukwuemekanwoke-jpg) | Initial runbook written. `git revert` step timed for real (~200ms, scratch branch, no effect on `integrate`). Path A (Cloud Run traffic-shift) and the DB backup restore section are documented but **not yet exercised** — both blocked on GCP Console verification (R-02/R-03). Do not treat the <2 min target as met until Path A is confirmed available and timed end-to-end. |
