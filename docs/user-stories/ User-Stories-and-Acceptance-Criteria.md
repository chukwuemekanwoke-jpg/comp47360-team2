# Tablé Product User Stories and Acceptance Criteria

**Document status:** Final current-state product specification
**Application baseline:** `origin/integrate` at `2bb26a4` (7 August 2026)
**Product scope:** Consumer mobile application, merchant web dashboard, gateway API, prediction, and diner matching
**Source material:** Sprint 2 user stories and flows, the 27 July implementation review, usability findings, and the final integrated application

## 1. Purpose

This document is the canonical set of product user stories and acceptance criteria for Tablé. 

The Sprint 2 specification provided the starting user goals. During development, the team changed several technical choices and expanded the product from restaurant discovery into an immediate-dining loop:

1. a diner discovers a reachable restaurant with a table available now;
2. the diner books directly or claims a private flash deal;
3. the merchant manages tables, campaigns, offers, and reservations; and
4. platform services protect the transaction with ETA, availability, prediction, and matching rules.

The identifiers in this document (`C-*`, `M-*`, and `P-*`) are requirement identifiers for traceability. They are not Jira issue keys and do not replace the original `TABL-*` records.

## 2. Product Goal and Scope

### 2.1 Product goal

Tablé reduces uncertainty for diners looking for a table now and helps restaurants turn unused capacity into revenue. The consumer application combines live table availability with travel-time validation. The merchant application exposes the same operating state and allows a manager to release a limited, time-bound flash-deal campaign to selected nearby diners.

### 2.2 Actors

| Actor | Main need |
|---|---|
| Diner | Find a suitable restaurant with a table that can still be reached within its hold window. |
| Restaurant manager | Monitor current capacity and fill unused tables without overbooking. |
| Platform | Keep bookings, offers, campaign counters, prediction, and availability consistent and secure. |

### 2.3 Release boundaries

The final assessed release supports immediate bookings in the seeded Manhattan demonstration area. It does not claim support for future-date reservations, native push delivery, production-scale restaurant onboarding, or an administrator-triggered model-training service. These items are listed as deferred scope in Section 9.

## 3. Priority and Acceptance Status

| Term | Meaning |
|---|---|
| **Must** | Required for the end-to-end MVP or for safe operation. |
| **Should** | Important to usability or decision quality, but the core loop can operate without its full version. |
| **Implemented** | All acceptance criteria for the assessed scope are met. |
| **Partial** | The main outcome exists, but at least one stated acceptance criterion remains open. |
| **Met** | Verified in the current integrated application. |
| **Open** | Required behaviour is not yet fully implemented or verified. |
| **Constraint** | Met within an explicitly limited demonstration scope. |
| **Deferred** | Deliberately excluded from the assessed release. |

An implementation status is evidence about the baseline named above, not a change to the priority of the requirement.

## 4. Story Summary

| ID | Actor | Outcome | Priority | Baseline status |
|---|---|---|---|---|
| C-01 | Diner | Account access, guest discovery, and preference onboarding | Must | Partial |
| C-02 | Diner | Location-aware map discovery | Must | Implemented |
| C-03 | Diner | Search, filter, sort, and personalised discovery | Must | Implemented |
| C-04 | Diner | ETA-validated immediate booking | Must | Implemented |
| C-05 | Diner | Booking history and cancellation | Should | Implemented |
| C-06 | Diner | Preference and access-needs management | Should | Partial |
| C-07 | Diner | Private flash-deal inbox and claim | Must | Implemented |
| M-01 | Restaurant manager | Account access and restaurant setup | Must | Implemented |
| M-02 | Restaurant manager | Operational overview of capacity and revenue | Must | Implemented |
| M-03 | Restaurant manager | Safe flash-deal campaign lifecycle | Must | Implemented |
| M-04 | Restaurant manager | Live offer tracking and campaign history | Must | Partial |
| M-05 | Restaurant manager | Reservation and table operations | Must | Implemented |
| M-06 | Restaurant manager | Accessible dashboard settings | Should | Partial |
| P-01 | Platform | Secure, versioned, resilient API contracts | Must | Implemented |
| P-02 | Platform | Deterministic busyness prediction with historical inputs | Must | Implemented |
| P-03 | Platform | Relevant and safe diner matching | Should | Partial |

## 5. Consumer Stories

### C-01 — Account Access, Guest Discovery, and Preference Onboarding

**Priority:** Must
**Baseline status:** Partial

**As a** diner,
**I want** to explore the product before signing in and create an account when I am ready to book,
**so that** I can understand the value of Tablé and receive results suited to my needs.

#### AC C-01.1 — Guest and authenticated access — Met

- **Given** a person has not signed in,
- **When** they continue as a guest,
- **Then** they can browse map, discovery, and restaurant information,
- **And** booking, inbox, and profile actions ask them to register or sign in.

#### AC C-01.2 — Secure account session — Met

- **Given** a person submits valid registration or sign-in details,
- **When** authentication succeeds,
- **Then** the application stores the authenticated session and uses its JWT for protected requests,
- **And** invalid credentials produce a clear error without creating a session.

#### AC C-01.3 — Preference onboarding — Met

- **Given** a newly registered diner starts onboarding,
- **When** they select cuisines, price tiers, dining style, and access needs and finish the flow,
- **Then** the selections are saved to their user preferences,
- **And** those preferences are available to later discovery and matching requests.

#### AC C-01.4 — First-use explanation — Open

- **Given** a person sees Tablé for the first time,
- **When** the authentication screen is shown,
- **Then** the screen should explain that Tablé finds restaurants with tables available now and checks whether the diner can arrive in time.

#### AC C-01.5 — Controlled cuisine selection — Open

- **Given** a diner is selecting preferred cuisines during onboarding,
- **When** the configured maximum number of choices has been reached,
- **Then** the application should prevent additional choices and explain the limit.

### C-02 — Live Location and Map Discovery

**Priority:** Must
**Baseline status:** Implemented

**As a** diner looking for food now,
**I want** to see restaurants with available tables near my current position,
**so that** I do not waste time travelling to an unavailable venue.

#### AC C-02.1 — Permission and nearby results — Met

- **Given** location permission is available,
- **When** the diner opens or recentres the map,
- **Then** the application uses the current coordinates to request restaurants within 1.5 km,
- **And** the result distinguishes current table availability and busyness.

#### AC C-02.2 — Location-unavailable recovery — Constraint

- **Given** location permission is denied or the device cannot provide coordinates,
- **When** discovery loads,
- **Then** the application remains usable with a clear location state and a Manhattan demonstration origin or neighbourhood selection,
- **And** it does not claim that the fallback is the diner's live position.

#### AC C-02.3 — Refresh and result states — Met

- **Given** the map or restaurant list is visible,
- **When** the diner refreshes or their effective location changes,
- **Then** nearby results are requested again,
- **And** loading, empty, and failure states are shown without displaying stale results as current.

### C-03 — Restaurant Discovery, Search, Filter, and Sort

**Priority:** Must
**Baseline status:** Implemented

**As a** diner,
**I want** to compare nearby restaurants using information relevant to an immediate visit,
**so that** I can choose an option quickly and with confidence.

#### AC C-03.1 — Search and filtering — Met

- **Given** nearby restaurants have loaded,
- **When** the diner searches or applies available cuisine, busyness, distance, or travel filters,
- **Then** the displayed set reflects the active criteria,
- **And** the interface makes the active filter state visible and removable.

#### AC C-03.2 — Useful ordering — Met

- **Given** more than one restaurant matches,
- **When** the diner changes the sort option,
- **Then** the list can be ordered by supported measures such as relevance, quietness, distance, or availability,
- **And** the chosen order is applied consistently to the visible results.

#### AC C-03.3 — Decision information — Met

- **Given** a restaurant appears in discovery,
- **When** its card or map marker is displayed,
- **Then** the diner can identify the restaurant, cuisine, distance, busyness, and current table availability,
- **And** can open the immediate-booking flow from that result.

#### AC C-03.4 — Preference-informed discovery — Met

- **Given** an authenticated diner has saved cuisine preferences,
- **When** they open the Discover tab,
- **Then** a “For you” section prioritises matching cuisines,
- **And** general sections such as top picks and quiet restaurants remain available.

### C-04 — ETA-Validated Immediate Booking

**Priority:** Must
**Baseline status:** Implemented

**As a** diner,
**I want** Tablé to compare my travel time with the restaurant's hold window before I book,
**so that** I know whether I can reach the table before it is released.

#### AC C-04.1 — Explicit immediate-booking intent — Met

- **Given** a diner opens checkout from a restaurant,
- **When** the booking sheet appears,
- **Then** it states that the booking is for now rather than for a future date,
- **And** shows the restaurant's configured hold window.

#### AC C-04.2 — Travel-mode ETA — Met

- **Given** the diner and restaurant locations are known,
- **When** the diner selects walking, driving, public transport, or cycling,
- **Then** the service returns an ETA for that mode,
- **And** the interface shows whether the ETA fits within the hold window.

#### AC C-04.3 — Reachability gate — Met

- **Given** the calculated ETA exceeds the hold window,
- **When** checkout is evaluated,
- **Then** confirmation is disabled and the reason is explained,
- **And** the diner can choose another travel mode or restaurant.

#### AC C-04.4 — Atomic booking outcome — Met

- **Given** the diner is authenticated, reachable, has no other active booking, and a table is available,
- **When** they confirm,
- **Then** one immediate booking is created and availability is reduced once,
- **And** success details are shown; otherwise no partial booking is left behind.

### C-05 — Booking History and Cancellation

**Priority:** Should
**Baseline status:** Implemented

**As a** diner,
**I want** to review and cancel my bookings,
**so that** I can manage a change of plans without leaving a table unavailable to others.

#### AC C-05.1 — Recent booking history — Met

- **Given** an authenticated diner has booking records,
- **When** they open their profile,
- **Then** the most recent booking records are displayed with restaurant, status, time, and relevant price or discount information,
- **And** the retained history follows the platform's five-record limit.

#### AC C-05.2 — Confirmed cancellation — Met

- **Given** a booking is eligible for cancellation,
- **When** the diner confirms the cancellation action,
- **Then** the booking changes to cancelled,
- **And** restaurant availability and related campaign or offer counters are updated consistently.

#### AC C-05.3 — Expired hold handling — Met

- **Given** an immediate booking passes its hold expiry without completion,
- **When** booking state is next evaluated,
- **Then** the expired hold is lapsed according to the service rules,
- **And** its table is made available again.

### C-06 — Preference and Access-Needs Management

**Priority:** Should
**Baseline status:** Partial

**As a** returning diner,
**I want** to update my cuisine, dietary, price, dining-style, and access preferences,
**so that** future discovery and offers remain relevant as my needs change.

#### AC C-06.1 — Edit and persist preferences — Met

- **Given** an authenticated diner already has saved preferences,
- **When** they open the preference editor,
- **Then** current values are preselected,
- **And** saved changes remain after the application is reopened.

#### AC C-06.2 — Access-needs choices — Met

- **Given** the diner edits access needs,
- **When** they select wheelchair access or a low-sensory environment,
- **Then** those values are stored as structured preferences,
- **And** they are passed to relevant discovery or matching services.

#### AC C-06.3 — Dietary-restriction editing — Open

- **Given** the diner needs a dietary restriction such as vegetarian, vegan, or halal food,
- **When** they edit their preferences,
- **Then** the consumer interface should allow the restriction to be selected and saved in the existing structured dietary-preference field,
- **And** later matching should compare it only with an equivalent restaurant attribute.

#### AC C-06.4 — Price guidance — Open

- **Given** the diner is choosing one or more price tiers,
- **When** the tier control is displayed,
- **Then** the interface should explain what each euro tier means.

#### AC C-06.5 — Save confirmation — Open

- **Given** a preference update succeeds,
- **When** the save operation completes,
- **Then** the interface should provide a clear positive confirmation rather than only closing the editor.

### C-07 — Personalised Flash-Deal Inbox and Claim

**Priority:** Must
**Baseline status:** Implemented

**As a** matched diner,
**I want** to receive and claim a limited private restaurant offer,
**so that** I can save money on a table I can reach now.

#### AC C-07.1 — Actionable private offer — Met

- **Given** a campaign has selected the diner and their offer is still pending,
- **When** the diner opens the inbox,
- **Then** the offer shows the restaurant, discount, expiry countdown, and claim action,
- **And** expired, revoked, or already accepted offers cannot be claimed as new.

#### AC C-07.2 — Claim confirmation and ETA — Met

- **Given** the diner chooses a pending offer,
- **When** the claim confirmation opens,
- **Then** it explains that claiming also books a table for now,
- **And** checks the selected travel mode against the restaurant hold window before enabling “Claim & Book”.

#### AC C-07.3 — Transactional claim — Met

- **Given** the offer is valid, the diner is reachable, and campaign quota remains,
- **When** the diner confirms the claim,
- **Then** the offer is accepted and a discounted booking is created as one consistent transaction,
- **And** quota, inventory, booking, and tracking views reflect the result without double counting.

#### AC C-07.4 — Delivery refresh — Constraint

- **Given** the diner leaves the inbox open,
- **When** a new offer is created or an existing offer changes,
- **Then** the inbox refreshes through periodic API polling,
- **And** native push notification delivery remains deferred for this release.

## 6. Merchant Stories

### M-01 — Merchant Account and Restaurant Setup

**Priority:** Must
**Baseline status:** Implemented

**As a** restaurant manager,
**I want** to create a protected merchant account and configure my restaurant,
**so that** only authorised staff can operate its tables and campaigns.

#### AC M-01.1 — Merchant authentication — Met

- **Given** a manager submits valid account details,
- **When** registration or sign-in succeeds,
- **Then** a merchant JWT session is created,
- **And** protected restaurant routes reject absent, invalid, or unauthorised credentials.

#### AC M-01.2 — Restaurant profile setup — Met

- **Given** an authenticated manager has no completed restaurant profile,
- **When** they provide required venue and capacity information,
- **Then** invalid or incomplete values are rejected with field-level guidance,
- **And** valid data creates the restaurant profile owned by that manager.

#### AC M-01.3 — Reliable location capture — Met

- **Given** map services are available during setup,
- **When** the manager selects the venue location,
- **Then** the map selection supplies the coordinates used by discovery and ETA,
- **And** manual address or coordinate input is exposed only as a recovery path when map services are unavailable.

### M-02 — Operational Overview: Busyness and RevPASH

**Priority:** Must
**Baseline status:** Implemented

**As a** restaurant manager,
**I want** one view of current capacity, predicted busyness, and revenue performance,
**so that** I can decide whether unused tables justify a flash deal.

#### AC M-02.1 — Capacity state — Met

- **Given** the manager opens the overview,
- **When** restaurant data loads,
- **Then** the dashboard shows current occupancy or available-table measures,
- **And** the values are based on the same booking inventory used by consumer availability.

#### AC M-02.2 — Busyness signal — Met

- **Given** a prediction is available for the restaurant,
- **When** the dashboard loads,
- **Then** it presents a human-readable busyness state and supporting score or context,
- **And** it does not present a failed fresh prediction as newly calculated data.

#### AC M-02.3 — Revenue metric — Met

- **Given** revenue and seated-capacity inputs exist,
- **When** the manager reviews performance,
- **Then** the dashboard displays RevPASH or related period metrics,
- **And** communicates the time basis of the figure so it can support a campaign decision.

### M-03 — Flash-Deal Campaign Lifecycle

**Priority:** Must
**Baseline status:** Implemented

**As a** restaurant manager,
**I want** to release a controlled, time-bound discount for unused tables,
**so that** I can stimulate demand without overbooking or discounting more seats than intended.

#### AC M-03.1 — Safe campaign parameters — Met

- **Given** a manager opens campaign creation,
- **When** they enter a table quota, discount, and duration,
- **Then** quota must be positive and no greater than available capacity, discount must be 10–50%, and duration must be 10–60 minutes,
- **And** invalid input is rejected before campaign creation.

#### AC M-03.2 — Single active campaign — Met

- **Given** the restaurant already has an active campaign,
- **When** the manager attempts to create another,
- **Then** the request is rejected,
- **And** the existing active campaign remains unchanged.

#### AC M-03.3 — Limited private distribution — Met

- **Given** valid campaign parameters and eligible nearby diners,
- **When** the manager launches the campaign,
- **Then** no more pending private offers are issued than the campaign quota,
- **And** the created offers share the campaign's expiry window.

#### AC M-03.4 — Terminal states — Met

- **Given** a campaign is active,
- **When** its accepted quota is filled, its time window expires, or the manager cancels it,
- **Then** the campaign enters the corresponding terminal state,
- **And** unclaimable pending offers are expired or revoked while already accepted bookings are preserved.

### M-04 — Live Offer Tracking and Campaign History

**Priority:** Must
**Baseline status:** Partial

**As a** restaurant manager,
**I want** to monitor a live campaign and review past results,
**so that** I can understand uptake and make the next operating decision.

#### AC M-04.1 — Active campaign summary — Met

- **Given** a campaign is active,
- **When** the manager views its summary,
- **Then** quota, accepted count, remaining time, and campaign state are visible,
- **And** the summary refreshes periodically without requiring page navigation.

#### AC M-04.2 — Offer-level tracker — Met

- **Given** offers have been issued for the active campaign,
- **When** the manager opens the live tracker,
- **Then** each anonymised offer state can be distinguished as pending, accepted, expired, or revoked,
- **And** the tracker refreshes often enough for the demo workflow.

#### AC M-04.3 — Consistent campaign history — Open

- **Given** a live offer or campaign counter changes,
- **When** the corresponding completed or historical record is visible,
- **Then** campaign history should refresh or invalidate automatically so its claimed count and status agree with the active and live-tracker views.

### M-05 — Reservation and Table Operations

**Priority:** Must
**Baseline status:** Implemented

**As a** restaurant manager,
**I want** to see current reservations and move them through valid service states,
**so that** the digital table inventory matches restaurant operations.

#### AC M-05.1 — Live reservation list — Met

- **Given** reservations exist for the restaurant,
- **When** the manager opens reservation operations,
- **Then** current records and their states are displayed,
- **And** the view refreshes periodically during operation.

#### AC M-05.2 — Valid state transition — Met

- **Given** a reservation is in a state with an allowed next action,
- **When** the manager confirms that action,
- **Then** it moves to the requested state such as confirmed, completed, cancelled, or no-show,
- **And** the updated state appears in consumer and merchant views where relevant.

#### AC M-05.3 — Inventory integrity — Met

- **Given** a reservation transition releases or consumes a table,
- **When** the transition commits,
- **Then** table availability and related offer or campaign counts update once,
- **And** invalid transitions are rejected without partial side effects.

### M-06 — Accessible Dashboard Settings

**Priority:** Should
**Baseline status:** Partial

**As a** restaurant manager,
**I want** to record accessibility features and use accessible dashboard controls,
**so that** diners can make informed choices and staff can operate the product with assistive technology.

#### AC M-06.1 — Structured accessibility data — Met

- **Given** the manager opens restaurant settings,
- **When** they update supported access features,
- **Then** the values are saved as structured restaurant attributes,
- **And** consumer discovery can display or use them.

#### AC M-06.2 — Accessible controls and persistence — Met

- **Given** a manager uses keyboard or assistive technology,
- **When** they navigate supported settings controls,
- **Then** labels, roles, focus behaviour, and switch states communicate each action,
- **And** saved settings remain after reload.

#### AC M-06.3 — Positive save feedback — Open

- **Given** an accessibility setting update succeeds,
- **When** the save operation completes,
- **Then** the dashboard should provide a visible and assistive-technology-readable success confirmation.

## 7. Platform Stories

### P-01 — API Contract, Security, and Resilience

**Priority:** Must
**Baseline status:** Implemented

**As the** platform team,
**I want** consumer and merchant clients to use secure and testable service contracts,
**so that** the two-sided transaction behaves consistently under normal and failure conditions.

#### AC P-01.1 — Versioned protected API — Met

- **Given** a client calls a protected `/api/v1` resource,
- **When** authentication or authorisation is absent or invalid,
- **Then** the request is rejected with the documented error shape,
- **And** valid requests are limited to resources allowed for that user or manager.

#### AC P-01.2 — Input and abuse protection — Met

- **Given** a client submits malformed, out-of-range, or excessive requests,
- **When** gateway validation or rate limiting evaluates them,
- **Then** the request is rejected before unsafe state is written,
- **And** the response does not expose credentials or sensitive internal detail.

#### AC P-01.3 — Contract verification — Met

- **Given** the API implementation or OpenAPI description changes,
- **When** the automated contract and drift checks run,
- **Then** incompatible paths, methods, schemas, or responses fail the check,
- **And** critical booking, campaign, offer, and lifecycle behaviour remains covered by automated tests.

#### AC P-01.4 — Dependency failure — Met

- **Given** a downstream route, prediction, or map dependency fails,
- **When** the failure reaches a client-facing flow,
- **Then** the platform returns an explicit error or documented fallback,
- **And** does not commit a partial booking, offer claim, or campaign update.

### P-02 — Busyness Prediction and Historical Demand Inputs

**Priority:** Must
**Baseline status:** Implemented

**As a** restaurant manager,
**I want** busyness estimates to use a trained and reproducible inference path,
**so that** campaign decisions are based on a consistent demand signal rather than a random value.

#### AC P-02.1 — Trained-model inference — Met

- **Given** valid restaurant, time, and demand features,
- **When** the prediction service evaluates them,
- **Then** it loads the deployed XGBoost pipeline and uses model probabilities to calculate a three-level busyness result,
- **And** repeated inference for the same inputs is deterministic.

#### AC P-02.2 — Historical proxy features — Met

- **Given** a required live signal such as taxi demand is unavailable,
- **When** the feature set is assembled,
- **Then** the platform uses the matching historical time-and-location input together with restaurant and mature booking statistics,
- **And** the source and simulated operational fields remain documented.

#### AC P-02.3 — Stale-data refresh — Met

- **Given** a stored restaurant prediction is older than the configured freshness period,
- **When** an eligible restaurant request detects it,
- **Then** a bounded background refresh is triggered and a new snapshot is persisted,
- **And** repeated failures observe a cooldown rather than creating an unbounded retry loop.

#### AC P-02.4 — Safe prediction fallback — Met

- **Given** the model service cannot return a fresh prediction,
- **When** the gateway prepares the restaurant response,
- **Then** it uses the last stored restaurant busyness value where available,
- **And** it does not replace the result with an undocumented random score.

### P-03 — Diner Matching and Recommendation Quality

**Priority:** Should
**Baseline status:** Partial

**As a** diner and restaurant manager,
**I want** private offers and recommended restaurants to respect distance, access needs, and stated preferences,
**so that** offers are useful to diners and campaign quota is not wasted.

#### AC P-03.1 — Geographic and access eligibility — Met

- **Given** a campaign or discovery request requires candidate selection,
- **When** matching runs,
- **Then** candidates outside the 1.5 km service radius are excluded,
- **And** declared wheelchair or sensory requirements act as hard eligibility constraints where restaurant attributes are available.

#### AC P-03.2 — Current relevance scoring — Met

- **Given** more than one eligible candidate remains,
- **When** candidates are ranked,
- **Then** shorter distance has the strongest score contribution and cuisine matches receive an additional boost,
- **And** no more users receive pending offers than the campaign quota permits.

#### AC P-03.3 — Resilient fallback — Met

- **Given** the matching service is unavailable,
- **When** the gateway must complete candidate selection,
- **Then** it uses a deterministic distance-based fallback,
- **And** still enforces radius, eligibility, and quota rules.

#### AC P-03.4 — Full preference comparison — Open

- **Given** the diner has saved price, dietary, and dining-style preferences and restaurants expose comparable structured attributes,
- **When** recommendations or private-offer candidates are scored,
- **Then** the score should compare each preference with the corresponding restaurant attribute rather than awarding points merely because a preference exists,
- **And** the quality of the resulting ranking should be evaluated with a documented relevance measure or user study.

## 8. End-to-End Acceptance Flows

### 8.1 Immediate booking flow

1. The diner grants location access or selects the demonstration area.
2. Tablé returns nearby restaurants with current availability and busyness.
3. The diner searches or filters and opens a restaurant.
4. Checkout states that the booking is for now and calculates ETA for the selected travel mode.
5. The service confirms the ETA fits the restaurant hold window and atomically creates the booking.
6. Consumer history, merchant reservations, and available-table counts show the same outcome.

### 8.2 Flash-deal flow

1. The merchant reviews occupancy, predicted busyness, and RevPASH.
2. The merchant creates a valid campaign with a limited table quota, discount, and lifetime.
3. Matching selects eligible nearby diners and creates no more offers than the quota.
4. A selected diner sees the offer, confirms reachability, and chooses “Claim & Book”.
5. The platform atomically accepts the offer and creates the discounted booking.
6. The campaign, offer tracker, reservation list, inventory, and consumer booking reflect one consistent transaction.

## 9. Deferred and Out-of-Scope Requirements

The following requirements were considered but are not represented as completed features in this release:

- scheduled bookings for a future date or time;
- native push notification delivery for flash deals;
- production onboarding and validation with restaurant operators;
- an administrator endpoint for starting model training and monitoring training jobs;
- a fully automated scheduled prediction job independent of application requests;
- a full standalone SEO-oriented restaurant detail page with ratings and opening hours;
- complete budget, dietary, and dining-style ranking until comparable restaurant attributes exist; and
- service coverage outside the seeded Manhattan demonstration environment.

## 10. Traceability

### 10.1 Sprint 2 to final requirements

| Sprint 2 source | Final requirement coverage | Treatment in this specification |
|---|---|---|
| TABL-005 — Backend scaffold | P-01 | Preserved as an operational, secure, and testable service outcome rather than a folder-layout requirement. |
| TABL-006 — OAuth2 and JWT | C-01, M-01, P-01 | User authentication is preserved; the implemented email/password and JWT design replaces the proposed OAuth2 client-credentials flow. |
| TABL-007 — Core API endpoints | P-01 and all transactional stories | Reframed around the final versioned restaurant, booking, campaign, offer, ETA, and merchant resources. |
| TABL-008 — Model-training endpoint | P-02; Section 9 | Trained-model inference is required; administrator-triggered training orchestration is explicitly deferred. |
| TABL-105 — Web scaffold | M-01–M-06 | The manager outcome is preserved in the final React/Vite web dashboard instead of the proposed Next.js scaffold. |
| TABL-106 — Web discovery | C-02, C-03 | Delivered through the universal Expo consumer application rather than a separate consumer web product. |
| TABL-107 — Restaurant detail | C-03, C-04; Section 9 | Decision and checkout information is preserved; a standalone SEO detail page is deferred. |
| TABL-304 — Mobile scaffold | C-01–C-07 | Expanded into the complete consumer journey using Expo Router and shared API state. |
| TABL-305 — Mobile geolocation | C-02 | Preserved with an explicit Manhattan demo fallback instead of manual address entry as the normal path. |
| TABL-306 — Mobile discovery | C-02, C-03, C-04 | Preserved and extended with ETA validation and immediate booking. |
| TABL-205 — Data cleaning | P-02 | Represented through model inputs, provenance, and serving compatibility; detailed analytical workflow remains documented under `ml-pipeline`. |
| TABL-206 — Feature engineering | P-02 | Represented through the deployed temporal, restaurant, taxi-demand, and booking-maturity feature path. |
| TABL-207 — Recommendation model | P-03 | Preserved as eligibility and ranking; incomplete price, dietary, and dining-style comparisons remain Open. |

### 10.2 Research and product-decision traceability

| Evidence or product need | Stories |
|---|---|
| Early interviews: uncertainty about whether a restaurant has space now | C-02, C-03, C-04 |
| Early interviews: time and distance affect willingness to try an immediate table | C-02, C-04, P-03 |
| Early interviews: price and food preference affect relevance | C-01, C-06, C-07, P-03 |
| Product review: consumer and merchant experiences must be separated | C-01–C-07, M-01–M-06 |
| Usability finding: first screen did not explain the product clearly | C-01.4 |
| Usability finding: offer claim must clearly create a booking | C-07.2, C-07.3 |
| Usability finding: campaign and offer counters must agree | M-04.3, P-01.3 |
| Merchant need: release capacity without overbooking | M-02, M-03, M-04, M-05 |
| Technical need: predictable and testable cross-client behaviour | P-01, P-02, P-03 |

### 10.3 Implementation locations

Implementation evidence is primarily located in `frontend/mobile-app`, `frontend/web-app`, `backend/api-gateway`, `ml-pipeline/fastapi-app`, `database`, and the repository's testing documentation and suites.

## 11. Definition of Done

A story can be changed to **Implemented** only when:

1. every acceptance criterion in its assessed scope is marked **Met** or an explicitly agreed **Constraint**;
2. affected API contracts and error states are documented;
3. relevant unit, integration, contract, or end-to-end tests pass;
4. security, privacy, accessibility, loading, empty, and failure states have been considered where applicable;
5. the behaviour is available from the integrated branch and can be demonstrated through the intended client; and
6. this document is updated so that open work is not presented as completed work.
