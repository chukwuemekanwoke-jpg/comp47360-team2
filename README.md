<div align="center">
  
# 🍽️ Tablé

**Manhattan Busyness Analytics Platform** *UCD COMP47360 Research Practicum (Team 2) Core Academic Deliverable*

![React + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-646CFF?style=flat-square&logo=vite)
![React Native](https://img.shields.io/badge/Mobile-Expo-02569B?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=nodedotjs)
![FastAPI](https://img.shields.io/badge/ML_Pipeline-FastAPI-009688?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)

</div>

---

## 📖 Introduction

**Tablé** is a Location-Based Service (LBS) data-driven platform designed for real-time dining and dynamic yield management. 

Operating as a two-sided marketplace, Tablé bridges the gap between spontaneous diners seeking immediate seating and restaurants experiencing unexpected operational lulls. By leveraging real-time geospatial search, transit-validated ETA guardrails, and Machine Learning-driven 1-to-1 flash deal matching, Tablé protects brand equity while efficiently filling empty seats and significantly reducing queue times for urban diners.

---

## 🌟 Core MVP Highlights

- 📍 **Geospatial Discovery**
  Acquires real-time user location to accurately display premium restaurants with immediate table availability within a strictly defined `1.5km` radius.
- ⏱️ **Transit-Validated Booking (ETA Guardrails)**
  Integrates the Google **Routes API** to calculate Estimated Time of Arrival (ETA). It ensures users can physically arrive before the restaurant's reservation hold window expires, effectively mitigating "no-shows".
- ⚡ **Lull-Mitigation Trigger (Flash Deals)**
  A B-suite dashboard feature allowing restaurant managers to convert empty tables into exclusive 1-to-1 flash deals with a single click. These offers are pushed secretly to the most compatible nearby diners via our recommendation algorithms, avoiding public mass discounting.

---

## 📁 Monorepo Structure

This repository follows a Monorepo architecture to ensure high-efficiency collaboration across frontend, backend, and data engineering teams:

```text
comp47360-team2/
├── docs/                # Core documents (Business Plan, MVP ACs, API contract, ADR, deployment guide)
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
├── database/            # PostgreSQL migrations, seeds, Docker Compose
├── cloud_deployments/   # Terraform IaC per cloud provider (gcp/, aws/, azure/) — see status note below
└── RISK_REGISTER.md     # Live project risk register, reviewed each sprint
```

## 👥 Team Roles

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Yuhao Xu** | Product & UX Lead | Owns product logic and specs (`docs/product-spec.md`), UX design walkthroughs, and business value alignment; drives QA and product research — integration tests, API contract validation, accessibility testing, internal & external usability rounds, user interviews, feedback synthesis, and the final paper outline. |
| **Chukwuemeka Nwoke** | Integration Lead / Scrum Master | Runs sprint ceremonies and retrospectives (`docs/sprints/`); owns the CI/CD pipeline — `ci.yml`, `deploy-staging.yml`, branch protection rules — and the `feature/* → integrate → develop → main` branch flow; maintains `RISK_REGISTER.md` and GitHub compliance reviews. |
| **Andrew Mitchell** | Web Frontend Lead | Leads `frontend/web-app` architecture and responsive UI implementation — form validation, accessibility audits, the shared component library, merchant sign-up flow, JWT auth wiring, and usability/accessibility fixes. |
| **Milo Dennehy** | Mobile App Lead | Leads `frontend/mobile-app` cross-platform development — map/discovery components, push notifications, Redux state management, bookings & settings UI, mobile JWT auth, and mobile accessibility fixes. |
| **Yang Liu** | Backend Lead | Leads `backend/api-gateway` and the database schema — auth, bookings, restaurants, offers, campaigns, and ETA endpoints; booking-lifecycle hardening, rate-limiter fixes, and the database backup & recovery plan. |
| **Rui Xu** *(Jack)* | Data & ML Lead | Leads `ml-pipeline/` — busyness prediction model, user-restaurant matching algorithm, and the FastAPI inference endpoint; model evaluation/tuning, RevPASH-informed retraining, drift monitoring, and the ML section of the final paper. |

---

## 🚀 Getting Started

> *For detailed setup instructions regarding specific sub-modules, please refer to the `README.md` located within their respective directories.*

**1. Clone the Repository**
```bash
git clone https://github.com/chukwuemekanwoke-jpg/comp47360-team2.git
cd comp47360-team2
```

**2. Install Dependencies**
```bash
npm install
```
This is an npm-workspaces monorepo — one install at the root wires up `database`, `backend/api-gateway`, `frontend/web-app`, `frontend/mobile-app`, and `frontend/packages/shared` together.

**3. Start the Database**
```bash
npm run db:up      # docker compose up -d — Postgres on :5432
npm run migrate
npm run seed        # optional demo data
```

**4. Run the App**
```bash
npm run dev          # backend (api-gateway) + web app together
npm run dev:mobile   # backend + Expo mobile app (tunnel mode)
```

### ☁️ Cloud Deployment Status

Nothing in `cloud_deployments/` currently points at a live cloud environment — the app runs locally via Docker as shown above. The GCP staging/prod projects were decommissioned (deleted, billing closed) on **2026-08-01**; the `gcp/` Terraform is kept as a historical record only. The `aws/` and `azure/` configs are greenfield designs, never applied. See [`cloud_deployments/README.md`](cloud_deployments/README.md) for the full picture, including how to build and run the `api-gateway` and `ml-service` containers directly with Docker.

