# Feature: Transit-Validated Booking 

**Authors:** Yuhao Xu — Product & UX Lead · Yang Liu — Backend Lead

## Story 1: Pre-booking Travel Time Validation
### User Story
**As a** transit-dependent urban explorer,
**I want** the system to validate my estimated time of arrival (ETA) based on my transport mode before confirming a booking,
**so that** I can ensure I physically reach the restaurant before the reservation hold expires.

### Acceptance Criteria
* **Scenario 3.1: Valid ETA Booking Enablement** <font color="#c00000">(Must-Have)</font>
    * **Given** a restaurant has a hard-coded reservation hold window of `15 minutes`
    * **When** the Google Routes API is called once upon opening the restaurant page, returning an ETA of `12 minutes`
    * **Then** the "Confirm Booking" button is set to `enabled`
    * **And** the UI displays "ETA: 12 mins (Within 15 min hold window)" in green text.

* **Scenario 3.2: Invalid ETA Booking Prevention** <font color="#c00000">(Must-Have)</font>
    * **Given** a restaurant has a hard-coded reservation hold window of `15 minutes`
    * **When** the Google Routes API returns an ETA of `25 minutes`
    * **Then** the "Confirm Booking" button is set to `disabled`
    * **And** the UI displays a warning text: "You are too far to guarantee this table."
