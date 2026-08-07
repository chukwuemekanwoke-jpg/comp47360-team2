# Tablé documentation

Grouped by who reads it. The root [README](../README.md#key-documents) lists the
same documents in dependency order — read that first if you're new.

| Directory | Audience | Contents |
| :--- | :--- | :--- |
| [`product/`](./product/) | Everyone | What the MVP is: [product spec](./product/product-spec.md), [user stories](./product/user-stories/) |
| [`architecture/`](./architecture/) | Engineers | Binding decisions and contracts: [ADR-001](./architecture/adr/ADR-001.md), [API contract](./architecture/api-contract-v0.md) + [OpenAPI spec](./architecture/openapi-v0.yaml) + [Postman](./architecture/postman/), [data strategy](./architecture/data-strategy.md), [database schema](./architecture/database-schema.md), [frontend strategy](./architecture/frontend-strategy.md), [integration strategy](./architecture/integration-strategy.md), [system map](./architecture/system-architecture-map.md) |
| [`ops/`](./ops/) | Whoever is running or shipping it | [Docker local](./ops/docker-local.md), [deployment guide](./ops/deployment-guide.md), [rollback runbook](./ops/rollback-recovery-runbook.md), [performance testing](./ops/performance-testing.md) |
| [`design/`](./design/) | Frontend + UX | [UI style guide](./design/ui-style-guide.md) |
| [`user-testing/`](./user-testing/) | Frontend + UX, assessors | [Usability test & interview report](./user-testing/Table_Usability_Test_and_Interview_Report.docx), [SUS scores](./user-testing/sus_usability_scores.pdf), [fixes strategy & change log](./user-testing/user-testing-fixes-strategy.md) |
| [`sprints/`](./sprints/) | Team + assessors | [Retrospectives](./sprints/README.md) for sprints 1–5, plus the Jira board links |
| [`budget-timesheets/`](./budget-timesheets/) | Module submission | [Timesheet and budget tracker](./budget-timesheets/README.md) — planned vs actual hours and costs |
| [`academic/`](./academic/) | Module submission | [Business plan](./academic/business-plan/), [IEEE paper](./academic/final-paper/) |
| [`assets/`](./assets/) | — | Screenshots and figures referenced by the docs above |

## Where things live outside `docs/`

| Document | Why it's there |
| :--- | :--- |
| [`RISK_REGISTER.md`](../RISK_REGISTER.md) | Live register, edited per sprint — kept at the repo root for visibility |
| [`cloud_deployments/README.md`](../cloud_deployments/README.md) | Sits with the Terraform it describes |
| Workspace `README.md`s (`backend/api-gateway`, `frontend/*`, `database`, `ml-pipeline`) | How to run and develop that one workspace |

## Adding a document

Put it in the directory matching its audience, then add one line to the table
above and — only if a newcomer needs it to get oriented — to the root README's
Key Documents list. Keep that root list short; this index is the complete one.
