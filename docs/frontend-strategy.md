# Tablé Frontend Strategy (FE-1)

**Status:** Sprint 1 · **Owners:** Frontend Lead + Mobile Lead  
**Related:** [ADR-001](./adr/ADR-001.md) · [User Stories](./user-stories)

---

## 1. Purpose

This document outlines the frontend implementation plan for the Tablé application interface.
It satisfies COMP47360 Sprint 1 requirements and Architecture Decisions outlined in [ADDR-001-I] to:

1. Outline a **page flow** for implementing all acceptance criteria outlined in the user stories.
2. Create **mockups** of user flow for both mobile and web platforms.
2. Explore relevant technologies.
3. Outline the initial **tech stack** used by both Web and Mobile Frontend platforms.
4. Create initial **demos** using mocked API endpoints.
5. Outline a **communication protocol** between Frontend + Mobile Leads.


---

## 2.  View Architecture & Detailed Page Flow

To support both mobile and web deployment, the application uses shared page flow design.    

![Page Flow](./assets/page-flow.png)


### 2.1 Authentication Gate
*   **Login/Registration View:** The absolute point of entry where users must either sign in or complete the account creation workflow to initialize a valid session token. Unauthenticated incoming traffic is blocked from accessing application assets.
> **Authentication Strategy:** Authentication is implemented using O-AUTH 2.0 framework and JSON Web Tokens, which are stateless and supported by both iOS, Android, and Web Clients. For biometric authentication (Mobile specific) Android and iOS this is a proposed addition but would require a platform dependent approach (Sprint 2 consideration).


### 2.2 Index / Landing Dashboard 

#### Shared components
*   **Preference Queries:** Features options to toggle allowed travel methods (e.g., walking, driving, transit) or culinary preferences (e.g. Italian, Indian, Vietnamese). Changing these travel parameters updates the arrival ETA and refreshes the predictive availability calculations, while user preferences filter the available results.
*   **Layout Structure:** Users can toggle from the map interface into an organized, card-based list layout displaying search results **(retains query state)**
> **Design Architecture Principle:** The search input fields, preference panels, and advanced filtering logic live within a parent container state that maps directly onto both the **Map View** and the **Card List View**.


```text
                  [ Shared Filter State Updated ]
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
[ Map View Update ]                            [ List View Update ]
- Repositions pins within boundaries            - Sorts cards by chosen metric
- Adjusts routing overlay markers              - Renders details based on state
- Updates predictive wait time badges          - Highlights flash deals instantly
```


#### Map View
*   **Spatial Visualisation:** The resulting restaurants based on availability and preference criteria are displayed.
*   **Spatial Discovery:** Once authenticated, users land directly on a primary map view displaying available Manhattan restaurants in real-time.
> **[User Story 2](./user-stories/02-discovery.md):** To satisfy the acceptance criteria: User is prompted to and manually allowed to input a location if location services are disabled.
> **Location Services Updates:** are handled by the client side application polling the user device and sending an updated location to server side when a users given location changes by more than a given threshold (client side responsibility, minimizing post requests to server). For Mobile both platform (iOS & Android) updates are handled by expo-location package.

#### Card List View
*   **Card Visualisation:** Card view provides a more detailed overview of the available restaraunts, including images of food (if available).
*   **Sorting Parameters:** The list results view contains a sorting menu allowing users to prioritize results by criteria such as relevance, distance, or price tier.

### 2.3 Business Demand Management Dashboard
>   **Conditional Rendering:** the business-side demand management dashboard, which manages 1-1 flash deals from the business owner is conditionally rendered depending on the status of the user (isBusiness).


---

## 3. Application Mockups

Based on the central shared page flow application mockups for both Mobile and Web UI:

<details>
<summary><b>Step 1: Login & Authentication (Click to expand)</b></summary>

![Login Screen](./assets/login.png)
</details>

<details>
<summary><b>Step 1.2: Preference Setup - Customer </b></summary>

![Prefence Selection](./assets/preferences.png)
</details>

<details>
<summary><b>Step 2: Interactive Map View</b></summary>

![Map View](./assets/map-view.png)
</details>

---

## 4. Tech Stack & File Organisation

### Mobile Stack
<img src="./assets/mobile-stack.png" alt="Mobile Stack" width="50%">    

    
*   **Mobile Engine:** **React Native** managed through **Expo** for clean multi-platform compilation.
*   **Styling Consistency:** **NativeWind** (Tailwind CSS for React Native), ensuring that layouts, components, and search modules look identical and share styling code across both map and list layouts.
*   **Network Layer:** Core data lifecycle queries call standard **REST APIs**, while push notifications and changing room availability update via **WebSockets** [ADDR-001-G]  

### Project organisation
```text
.\frontend/mobile/Table/
├── src/
│   ├── app/
│   │   ├── _layout.tsx (shared route views - nav bar)
│   │   ├── index.tsx (dashboard hub)
│   │   ├── map-view.tsx (map view)
│   │   ├── card-list-view.tsx (card list view)
│   │   └── business-dashboard.tsx (business dashboard)
│   ├── screens/ (backup versions)
│   │   ├── map-view.tsx
│   │   ├── card-list-view.tsx
│   │   ├── business-dashboard.tsx
│   │   └── login.tsx
│   └── components/
│       └── preference-filters.tsx (shared preference filter elements)
└── UI.md (documentation for all elements of the frontend)
```

### Web Stack

---

## 5. Network Sync & State Management

| Protocol | Use Case | Details |
|----------|----------|---------| 
| **REST Requests** | User modifications, authentication handshakes, structural search parameters | When a user filters by cuisine or travel type, a clean REST query pulls the prioritized data batch. |
| **WebSocket Infrastructure** | Real-time updates to restaurant density and flash deals | Handles ongoing changes to local restaurant density values (busyness_score) and incoming flash deal distributions. If an operational simulation tick updates table data while a user is looking at a map, the UI alters the marker colors in real-time without requiring a page pull. |

## 6. Collaboration Protocol

### Frontend & Mobile Lead Sync
The Frontend Lead and Mobile Lead operate on **independent development cycles** with major checkpoints aligned weekly. Asynchronous communication occurs through **Discord** for real-time updates and changes. There is a weekly meeting for checkpoints:

**Weekly Standup:**
- **When:** Wednesday, 15 minutes
- **Purpose:** Review incremental progress, discuss technical blockers, and synchronize styling across platforms
- **Key Outcome:** Styling homogenization, alld color palettes, and layout patterns are validated and standardized during these sessions to ensure design consistency across mobile and web implementations.

## 7. Other:

### Push Notification Strategy
Push notifications (for Mobile) are managed platform independtly - with the exception of a few bespoke considerations - the client generates a push token using 'expo-notifications' which it sends to the server side to be used in any post requests to the expo client. 
> Handling these notifications is done by wiring a listener to the main page of the application.
