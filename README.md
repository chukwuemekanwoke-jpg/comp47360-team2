<div align="center">

# Tablé

**Manhattan Busyness Analytics Platform** *UCD COMP47360 Research Practicum (Team 2) Core Academic Deliverable*

*Authors: Yuhao Xu — Product & UX Lead · Yang Liu — Backend Lead · Chukwuemeka Nwoke — Integration Lead / Scrum Master*

![React + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-646CFF?style=flat-square&logo=vite)
![React Native](https://img.shields.io/badge/Mobile-Expo-02569B?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=nodedotjs)
![FastAPI](https://img.shields.io/badge/ML_Pipeline-FastAPI-009688?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)

</div>

---


## Introduction

**Tablé** is a Location-Based Service (LBS) data-driven platform designed for real-time dining and dynamic yield management. 

Operating as a two-sided marketplace, Tablé bridges the gap between spontaneous diners seeking immediate seating and restaurants experiencing unexpected operational lulls. By leveraging real-time geospatial search, transit-validated ETA guardrails, and Machine Learning-driven 1-to-1 flash deal matching, Tablé protects brand equity while efficiently filling empty seats and significantly reducing queue times for urban diners.

---

## Core MVP Highlights

- **Geospatial Discovery**
  Acquires real-time user location to accurately display premium restaurants with immediate table availability within a strictly defined `1.5km` radius.
- **Transit-Validated Booking (ETA Guardrails)**
  Integrates the Google **Routes API** to calculate Estimated Time of Arrival (ETA). It ensures users can physically arrive before the restaurant's reservation hold window expires, effectively mitigating "no-shows".
- **Lull-Mitigation Trigger (Flash Deals)**
  A B-suite dashboard feature allowing restaurant managers to convert empty tables into exclusive 1-to-1 flash deals with a single click. These offers are pushed secretly to the most compatible nearby diners via our recommendation algorithms, avoiding public mass discounting.

---

## Monorepo Structure

This repository follows a Monorepo architecture to ensure high-efficiency collaboration across frontend, backend, and data engineering teams:

```text
comp47360-team2/
├── docker-compose.yml   # Full local stack (see docs/ops/docker-local.md)
├── docs/                # All documentation, grouped by audience (see docs/README.md)
│   ├── product/         # Product spec, user stories
│   ├── architecture/    # ADR, API contract + OpenAPI, data strategy, DB schema
│   ├── ops/             # Running, deploying, rolling back, load testing
│   ├── design/          # UI style guide, user-testing fixes
│   └── academic/        # Business plan, IEEE paper
├── frontend/            # Frontend ecosystem
│   ├── web-app/         # Responsive Web App (React + Vite)
│   ├── mobile-app/      # Cross-platform Mobile App (React Native/Expo)
│   └── packages/shared/ # Shared API client + types (RTK Query)
├── backend/             # Backend
│   └── api-gateway/     # API Gateway & business logic (Node.js/Express monolith)
├── ml-pipeline/         # Machine Learning & Data Engine
│   ├── fastapi-app/     # Algorithm Inference API (Python/FastAPI)
│   └── notebooks/       # Data exploration & feature engineering workflows
└── database/            # PostgreSQL migrations and seeds
```

## Key Documents

Nested top-down: each document assumes the one above it, so read a branch in order.
The full index, grouped by audience, is [`docs/README.md`](./docs/README.md).

**Product — what we're building**

- [Product spec](./docs/product/product-spec.md) — the MVP in one page
  - [User stories](./docs/product/user-stories/) — acceptance criteria per journey

**Architecture — start here for engineering**

- [ADR-001](./docs/architecture/adr/ADR-001.md) — the binding architecture decisions (A–J); everything below implements one of them
  - [Data strategy](./docs/architecture/data-strategy.md) — datasets, busyness representation, simulated live updates
    - [Database schema](./docs/architecture/database-schema.md) — tables, migrations, seeds
  - [API contract v0](./docs/architecture/api-contract-v0.md) — routes, payloads, errors ([openapi-v0.yaml](./docs/architecture/openapi-v0.yaml) · [Postman collection](./docs/architecture/postman/))
    - [Integration strategy](./docs/architecture/integration-strategy.md) — how the four workspaces stay contract-compatible
  - [Frontend strategy](./docs/architecture/frontend-strategy.md) — page flow, stack, auth and sync
    - [UI style guide](./docs/design/ui-style-guide.md) — one visual language across web and mobile
  - [System architecture map](./docs/architecture/system-architecture-map.md) — file-level map of the running system

**Operations — running and shipping it**

- [Docker local](./docs/ops/docker-local.md) — the full stack locally; the supported way to run Tablé today
- [Deployment guide](./docs/ops/deployment-guide.md) — branch flow (`feature/* → integrate → develop → main`) and CI/CD
  - [Cloud deployments](./cloud_deployments/README.md) — Terraform per provider (none currently live)
  - [Rollback & recovery runbook](./docs/ops/rollback-recovery-runbook.md) — what to do after a bad deploy
- [Performance testing](./docs/ops/performance-testing.md) — load/latency SLOs and results

**Project record** — [Risk register](./RISK_REGISTER.md) · [Business plan](./docs/academic/business-plan/Team%202%20Business%20Plan_v4.docx) · [IEEE paper](./docs/academic/final-paper/table-ieee-paper-updated.tex)

---

## Team Roles

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Yuhao Xu** | Product & UX Lead | Owns product logic and specs (`docs/product-spec.md`), UX design walkthroughs, and business value alignment; drives QA and product research — integration tests, API contract validation, accessibility testing, internal & external usability rounds, user interviews, feedback synthesis, and the final paper outline. |
| **Chukwuemeka Nwoke** | Integration Lead / Scrum Master | Runs sprint ceremonies and retrospectives (`docs/sprints/`); owns the CI/CD pipeline — `ci.yml`, `deploy-staging.yml`, branch protection rules — and the `feature/* → integrate → develop → main` branch flow; maintains `RISK_REGISTER.md` and GitHub compliance reviews. |
| **Andrew Mitchell** | Web Frontend Lead | Leads `frontend/web-app` architecture and responsive UI implementation — form validation, accessibility audits, the shared component library, merchant sign-up flow, JWT auth wiring, and usability/accessibility fixes. |
| **Milo Dennehy** | Mobile App Lead | Leads `frontend/mobile-app` cross-platform development — map/discovery components, push notifications, Redux state management, bookings & settings UI, mobile JWT auth, and mobile accessibility fixes. |
| **Yang Liu** | Backend Lead | Leads `backend/api-gateway` and the database schema — auth, bookings, restaurants, offers, campaigns, and ETA endpoints; booking-lifecycle hardening, rate-limiter fixes, and the database backup & recovery plan. |
| **Rui Xu** *(Jack)* | Data & ML Lead | Leads `ml-pipeline/` — busyness prediction model, user-restaurant matching algorithm, and the FastAPI inference endpoint; model evaluation/tuning, RevPASH-informed retraining, drift monitoring, and the ML section of the final paper. |

---

## Getting Started

The whole platform runs in Docker. Docker is the only prerequisite — no Node,
Python, PostgreSQL, or Expo install needed.

```bash
git clone https://github.com/chukwuemekanwoke-jpg/comp47360-team2.git
cd comp47360-team2

cp .env.example .env          # defaults work as-is; Google Maps keys are optional
npm run docker:up  # first run ~5 min, mostly the ML image
```

| Service | Where | Notes |
| :--- | :--- | :--- |
| Web app | <http://localhost:5173> | Log in as `manager@demo.com` / `password123` |
| API gateway | <http://localhost:3001> | `/health`, `/api/v1/...` |
| ML service | <http://localhost:8000> | `/health`, `/docs` |
| Postgres | `localhost:5432` | Schema and demo data seeded automatically |

Add the mobile app when you need it. The Expo dev server runs in a container
too, and serves the app both to a browser and to a phone over an ngrok tunnel:

**Note: for demo purposes the JWT authentication token system is disabled,
when you open a tunnel that is an attack surface, even though the application runs
in a container we recommend closing this container when you are done testing!**
This only applies to the mobile app, as it has to expose some external entrypoint for
phone connection.
```bash
npm run docker:mobile
```

| Target | Where | Notes |
| :--- | :--- | :--- |
| Mobile app (browser) | <http://localhost:8081> | Expo web — click through the app with no phone or emulator |
| Mobile app (phone) | The tunnel URL printed above | Open it in Expo Go or a dev build |

`docker:mobile` waits for the ngrok tunnel and prints its URL, so starting the
server also tells you how to reach it (`npm run docker:mobile:url` reprints it).
The QR code in the logs points at the same tunnel, but it is drawn with block
characters that `docker compose logs` mangles — the printed URL is the reliable
way in.

### Common commands

```bash
npm run docker:down     # stop everything
```

| Command | Does |
| :--- | :--- |
| `npm run docker:up` | Start (or rebuild) the stack |
| `npm run docker:down` | **Stop everything, keeping the database** |
| `npm run docker:mobile` | Start the Expo dev server and print its tunnel URL |
| `npm run docker:mobile:url` | Reprint the tunnel URL for a phone |
| `npm run docker:mobile:logs` | Follow Expo logs / show the QR code |
| `npm run docker:logs` | Follow all logs |
| `npm run docker:ps` | Show what's running |
| `npm run docker:reset` | Wipe the database and start fresh |

> Use `npm run docker:down` rather than a bare `docker compose down` — the
> latter skips the mobile container and fails with
> `Network table_table-network Resource is still in use`.

**Full guide — API keys, seeding, hot-reload workflows, troubleshooting:
[`docs/ops/docker-local.md`](./docs/ops/docker-local.md)**

> *To run a sub-module natively instead (nodemon, Vite HMR, Expo CLI on the host),
> see the `README.md` in its directory, or the hybrid workflow section of the
> Docker guide.*

### Cloud Deployment Status

Nothing in `cloud_deployments/` currently points at a live cloud environment — the app runs locally via Docker as shown above. The GCP staging/prod projects were decommissioned (deleted, billing closed) on **2026-08-01**; the `gcp/` Terraform is kept as a historical record only. The `aws/` and `azure/` configs are greenfield designs, never applied. See [`cloud_deployments/README.md`](cloud_deployments/README.md) for the full picture, including how to build and run the `api-gateway` and `ml-service` containers directly with Docker.

