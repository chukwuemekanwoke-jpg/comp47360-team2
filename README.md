<div align="center">
  
# 🍽️ Tablé

**Manhattan Busyness Analytics Platform** *UCD COMP47360 Research Practicum (Team 2) Core Academic Deliverable*

![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?style=flat-square&logo=next.js)
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
  Integrates the Google Distance Matrix API to dynamically calculate Estimated Time of Arrival (ETA). It ensures users can physically arrive before the restaurant's reservation hold window expires, effectively mitigating "no-shows".
- ⚡ **Lull-Mitigation Trigger (Flash Deals)**
  A B-suite dashboard feature allowing restaurant managers to convert empty tables into exclusive 1-to-1 flash deals with a single click. These offers are pushed secretly to the most compatible nearby diners via our recommendation algorithms, avoiding public mass discounting.

---

## 📁 Monorepo Structure

This repository follows a Monorepo architecture to ensure high-efficiency collaboration across frontend, backend, and data engineering teams:

```text
Table-Workspace/
├── docs/                # 📄 Core documents (Business Plan, MVP ACs, API contract v0)
├── frontend/            # 💻 Frontend Ecosystem
│   ├── web-app/         # Responsive Web App (React/Next.js)
│   └── mobile-app/      # Cross-platform Mobile App (React Native/Expo)
├── backend/             # ⚙️ Backend Microservices
│   ├── api-gateway/     # Core API Gateway & Business Logic (Node.js/Express)
│   └── realtime/        # State streaming and polling services
├── ml-pipeline/         # 🧠 Machine Learning & Data Engine
│   ├── fastapi-app/     # Algorithm Inference API (Python/FastAPI)
│   └── notebooks/       # Data exploration & feature engineering workflows
└── database/            # 🗄️ Database Infrastructure (PostgreSQL scripts & Mock data)
```

## 👥 Team Roles

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Yuhao Xu** | Product & UX Lead | Oversees product logic (`docs/`), UX design walkthroughs, and business value alignment. |
| **Chukwuemeka Nwoke** | Scrum Master | Drives agile iterations, CI/CD pipeline integration, and GitHub compliance reviews. |
| **Andrew Mitchell** | Web Frontend Lead | Leads `frontend/web-app` architecture and responsive UI implementation. |
| **Milo Dennehy** | Mobile App Lead | Leads `frontend/mobile-app` cross-platform development and map component integration. |
| **Yang Liu** | Backend Lead | Leads `backend/` microservices design, routing gateway, and core database interactions. |
| **Rui Xu** | Data & ML Lead | Leads `ml-pipeline/` recommendation algorithm modeling, data cleaning, and FastAPI deployment. |

---

## 🚀 Getting Started

> *For detailed setup instructions regarding specific sub-modules, please refer to the `README.md` located within their respective directories.*

**1. Clone the Repository**
```bash
git clone [https://github.com/YourOrganization/comp47360-team2.git](https://github.com/YourOrganization/comp47360-team2.git)
cd comp47360-team2
```

