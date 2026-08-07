# Feature: Exclusive Offer Inbox & Redemption

## Story 1: Time-sensitive Flash Deal Claiming
### User Story
**As a** budget-conscious food enthusiast (Deal-Hunting Foodie),
**I want to** see an active countdown timer on my received flash deals,
**so that** I know exactly how much time I have left before the exclusive discount expires.

### Acceptance Criteria 
* **Scenario 4.1: Deal Expiration and UI Revocation** <font color="#c00000">(Must-Have)</font>
    * **Given** an active Flash Deal in the user's inbox has a strictly defined `900-second` (15-minute) Time-To-Live (TTL)
    * **When** the frontend countdown timer hits `00:00`
    * **Then** the "Accept Deal" button immediately transitions to a `disabled` state
    * **And** the text overlay updates to "Offer Expired".

---

## Story 2: Post-acceptance Booking Cancellation
### User Story
**As a** consumer who accepted a flash deal but had a change of plans,
**I want to** cancel my accepted deal through the app,
**so that** the table can be instantly released back to other diners and the restaurant.

### Acceptance Criteria 
* **Scenario 4.2: User Cancellation Post-Acceptance** <font color="#245bdb">(Nice-to-Have)</font>
    * **Given** User D has tapped "Accept Deal" for a Flash Deal
    * **When** User D taps "Cancel Booking" before arriving at the restaurant
    * **Then** the system removes the QR code from the user interface
    * **And** decrements the claimed deal count in the PostgreSQL database back to `0`.