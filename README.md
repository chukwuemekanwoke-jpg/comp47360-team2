<div align="center">

# Tablé

**Manhattan Busyness Analytics Platform** *UCD COMP47360 Research Practicum (Team 2) Core Academic Deliverable*

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
├── docker-compose.yml   # Full local stack (see docs/docker-local.md)
├── docs/                # Core documents (Business Plan, MVP ACs, API contract, ADR)
│   └── adr/             # Architecture Decision Records (ADR-001.md)
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

**Product — what we're building**

- [Product spec](./docs/product-spec.md) — the MVP in one page
  - [User stories](./docs/user-stories/) — acceptance criteria per journey

**Architecture — start here for engineering**

- [ADR-001](./docs/adr/ADR-001.md) — the binding architecture decisions (A–J); everything below implements one of them
  - [Data strategy](./docs/data-strategy.md) — datasets, busyness representation, simulated live updates
    - [Database schema](./database/schema.md) — tables, migrations, seeds
  - [API contract v0](./docs/api-contract-v0.md) — routes, payloads, errors ([openapi-v0.yaml](./docs/openapi-v0.yaml) · [Postman collection](./docs/postman/))
    - [Integration strategy](./docs/integration-strategy.md) — how the four workspaces stay contract-compatible
  - [Frontend strategy](./docs/frontend-strategy.md) — page flow, stack, auth and sync
    - [UI style guide](./docs/ui-style-guide.md) — one visual language across web and mobile
  - [System architecture map](./docs/system-architecture-map.md) — file-level map of the running system

**Operations — running and shipping it**

- [Docker local](./docs/docker-local.md) — the full stack locally; the supported way to run Tablé today
- [Deployment guide](./docs/deployment-guide.md) — branch flow (`feature/* → integrate → develop → main`) and CI/CD
  - [Cloud deployments](./cloud_deployments/README.md) — Terraform per provider (none currently live)
  - [Rollback & recovery runbook](./docs/rollback-recovery-runbook.md) — what to do after a bad deploy
- [Performance testing](./docs/performance-testing.md) — load/latency SLOs and results

**Project record** — [Risk register](./RISK_REGISTER.md) · [Business plan](./docs/business-plan/Team%202%20Business%20Plan_v4.docx) · [IEEE paper](./docs/final-paper/table-ieee-paper-updated.tex)

---

## Team Roles

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Yuhao Xu** | Product & UX Lead | Oversees product logic (`docs/`), UX design walkthroughs, and business value alignment. |
| **Chukwuemeka Nwoke** | Scrum Master | Drives agile iterations, CI/CD pipeline integration, and GitHub compliance reviews. |
| **Andrew Mitchell** | Web Frontend Lead | Leads `frontend/web-app` architecture and responsive UI implementation. |
| **Milo Dennehy** | Mobile App Lead | Leads `frontend/mobile-app` cross-platform development and map component integration. |
| **Yang Liu** | Backend Lead | Leads `backend/api-gateway`, database schema, and core API implementation. |
| **Rui Xu** | Data & ML Lead | Leads `ml-pipeline/` recommendation algorithm modeling, data cleaning, and FastAPI deployment. |

---

## Getting Started

The whole platform runs in Docker. Docker is the only prerequisite — no Node,
Python, PostgreSQL, or Expo install needed.

```bash
git clone https://github.com/chukwuemekanwoke-jpg/comp47360-team2/
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
[`docs/docker-local.md`](./docs/docker-local.md)**

> *To run a sub-module natively instead (nodemon, Vite HMR, Expo CLI on the host),
> see the `README.md` in its directory, or the hybrid workflow section of the
> Docker guide.*
