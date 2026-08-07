# Feature: B-Side Lull-Mitigation Dashboard

## Story 1: One-click Flash Deal Creation
### User Story
**As a** restaurant manager (Independent Restaurateur),
**I want to** quickly set a discount percentage within platform boundaries during a sudden slow period,
**so that** I can trigger a lull-mitigation campaign without complex configurations.

### Acceptance Criteria
* **Scenario 5.1: Discount Input Boundaries** <font color="#245bdb">(Nice-to-Have)</font>
    * **Given** the restaurant manager has opened the Lull-Mitigation creation modal on the B-side dashboard
    * **When** the manager attempts to submit a discount value of `< 10%` or `> 50%`
    * **Then** the frontend blocks the submission
    * **And** throws an inline validation error: "Discount must be between 10% and 50%".
    
---

## Story 2: Automatic Campaign Termination
### User Story
**As a** restaurant manager,
**I want** the flash deal campaign to close automatically once the released tables are filled,
**so that** I do not accidentally overbook my restaurant during a lull.

### Acceptance Criteria 
* **Scenario 5.2: Campaign Auto-Termination on Inventory Depletion** <font color="#c00000">(Must-Have)</font>
    * **Given** a manager triggers a Flash Deal specifically for `2` tables
    * **When** exactly `2` unique C-side users confirm the booking via the deal payload
    * **Then** the active campaign status in the database transitions from `Active` to `Completed`
    * **And** the deal immediately disappears from the inboxes of any other users who haven't accepted it yet.