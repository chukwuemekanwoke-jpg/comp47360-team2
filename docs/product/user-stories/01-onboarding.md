# Feature: User Foundation & Preferences

## Story 1: Smart Preference Onboarding
### User Story
**As a** new consumer on Tablé,
**I want to** quickly select my budget tier and dietary preferences during my first login,
**so that** the app's algorithm can send me highly relevant flash deals in the future.

### Acceptance Criteria
* **Scenario 1.1: Capturing ML Parameters**  <font color="#c00000">(Must-Have)</font>
    * **Given** a new user opens the app for the first time
    * **When** they bypass the dummy login screen
    * **Then** the UI presents a single screen to select `Budget Tier`(€ , €€, €€€) and `Dietary Tags` (e.g., Vegan, Halal, None)
    * **And** saves these attributes to the PostgreSQL user table to feed the FastAPI ML pipeline.