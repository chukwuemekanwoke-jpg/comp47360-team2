# Round 3: Formative Usability Testing

## Purpose

This round evaluated whether users could understand and complete the principal diner and merchant workflows, and identified issues to prioritise before the final demonstration.

## Participants

Four people participated from 24 to 26 July 2026. P01 was an internal evaluator; P02--P04 were external student peers. These four people were distinct from E01--E03 in Round 1.

| ID | Relationship to project | Broad status | Perspective | Age, gender, nationality, accessibility needs, industry experience |
|---|---|---|---|---|
| P01 | Internal | Student team member | Diner and merchant workflow evaluator | Not recorded or suppressed |
| P02 | External peer | Student | Potential diner and merchant-dashboard evaluator | Not recorded; no operator role recorded |
| P03 | External peer | Student | Potential diner and merchant-dashboard evaluator | Not recorded; no operator role recorded |
| P04 | External peer | Student | Potential diner and merchant-dashboard evaluator | Not recorded; no operator role recorded |

No restaurant owner, manager, or other operator participated. P01's observations are useful for internal quality review but are not independent evidence.

## Environment and procedure

The diner interface was tested in desktop Chrome using a responsive mobile viewport. The merchant dashboard ran locally in Chrome. This round did not establish native iOS or Android usability.

Participants received outcome-based tasks rather than button-by-button instructions and were encouraged to describe their expectations, hesitation, and interpretation of system feedback. The facilitator observed task outcomes and consolidated repeated issues into a prioritised action list. Completion time was not measured.

### Task set

1. Identify the product purpose and main navigation.
2. Discover, search, filter, and compare restaurants.
3. Inspect availability, travel mode, ETA, and the table hold window.
4. Create and cancel a booking, then inspect Profile state.
5. Inspect preferences and the Flash Deal Inbox.
6. Create a merchant Flash Deal campaign.
7. Claim the deal on the diner side and verify its effect in merchant campaign, table, and reservation views.
8. Inspect merchant metrics and settings.

## Task outcome

All four participants completed the principal diner and merchant workflows in the test environment. This demonstrated that the prototype's main end-to-end loop was operable during the sessions. It does not establish broad usability, real-world route accuracy, demand, or commercial viability.

## Cross-participant findings

| Priority | Finding | Evidence | Product response at synthesis |
|---:|---|---:|---|
| 1 | Registration did not clearly explain that Tablé helps users find immediately available restaurant tables. | P01--P04, 4/4 | Add a direct value proposition; outstanding |
| 2 | Transparent, overlapping, or low-contrast mobile surfaces reduced readability, especially in dark mode. | P01--P04, 4/4 | Web-specific rendering cause identified and reported corrected |
| 3 | Booking confirmation and clearer immediate-booking wording were reported implemented before the final demonstration |
| 4 | Map results and post-claim states did not always provide a direct next action. | P01 and P03, 2/4 | Add shared detail route and persistent success state |
| 5 | Campaign History could contradict Active Campaign and Live Offer Tracker until refresh. | P01 and P04, 2/4 | Campaign-state synchronisation reported corrected |
| 6 | Saves and consequential actions lacked consistent confirmation. | P01, P03, and P04, 3/4 | Add save, claim, and cancellation feedback |
| 7 | Symbol-only budget levels required users to infer their meaning. | P01 and P04, 2/4 | Add labels or price ranges |

Items described as “reported corrected” were not followed by a documented independent regression round, so the report does not claim that the fixes were validated across devices.

## Participant-level observations

### P01 — internal evaluator

P01 completed the full cross-platform loop and verified booking creation, cancellation, inventory restoration, offer acceptance, and merchant-side reservation state. The strongest concern was overlay readability. P01 also questioned ETA trust, although the session evaluated its presentation and workflow rather than real-world route accuracy. A satisfaction rating of 4/5 and recommendation rating of 7--8/10 were recorded for P01 only and are not averaged across the sample.

### P02 — external student peer

P02 initially interpreted the product as related to furniture, then understood the dining concept after using the workflow. The participant highlighted low contrast, uncertainty about whether Book required immediate departure, and the limited usefulness of a current ETA for future dining plans. The merchant dashboard was considered clear, although its visual tone felt more technological than hospitality-focused.

### P03 — external student peer

P03 focused on continuity between Map results and restaurant details, and on the lack of a persistent success state after Claim Offer created a booking. Live merchant offer tracking was understandable, but the countdown required a clearer time-remaining label.

### P04 — external student peer

P04 focused on explicit preference labels, confirmation after saves, and confidence in merchant data. The participant understood booking and cancellation states but observed that live campaign values and Campaign History could disagree.

## Strengths observed

- Restaurant name, cuisine, availability, status, distance, and accessibility information supported comparison.
- Booking, cancellation, inventory restoration, offer acceptance, and merchant reservation state formed a coherent functional loop.
- The value of Flash Deals was understandable once the product context was established.
- Merchant metrics, table state, reservations, and recipient-level campaign status were generally understandable.

## Changes and remaining work

| Area | Change or decision | Status supported by retained evidence |
|---|---|---|
| Discovery | A Discover route addressed the lack of a browsing path for users without a selected restaurant. | Implemented in evaluated build |
| Visual rendering | Transparent/overlapping surfaces were investigated and reproduced as a web-specific issue. | Reported corrected |
| Campaign state | Live tracking and Campaign History inconsistency was addressed. | Reported corrected |
| First-use positioning | Add an explicit restaurant and immediate-availability value proposition. | Outstanding |
| Booking semantics | Reported implemented before the final demonstration. | Outstanding |
| Completion feedback | Add persistent success states and direct next actions after claims and saves. | Outstanding or not re-tested |
| Operator validation | Test campaign creation and monitoring with restaurant staff. | Not conducted |

## Limitations

- The sample was small, convenience-based, and predominantly external student peers.
- P01 was internal and therefore not independent.
- No restaurant operator participated.
- The mobile interface was evaluated in a responsive desktop-browser viewport, not on native mobile devices.
- No task timing, comparative benchmark, formal accessibility audit, or independently validated regression round was recorded.
- The evaluation did not validate real-world ETA accuracy, demand, pricing, revenue impact, willingness to pay, or long-term adoption.
