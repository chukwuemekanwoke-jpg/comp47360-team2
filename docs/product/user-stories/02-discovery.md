# Feature: Geospatial Search & Availability 

## Story 1: Nearby Available Restaurants Map Search
### User Story
**As a** busy executive (Spontaneous Executive),
**I want to** instantly see nearby restaurants with immediate seating availability upon opening the app,
**so that** I can grab a quality meal without waiting in line during my tight schedule.

### Acceptance Criteria 
* **Scenario 2.1: Default Radius and Availability Filtering** <font color="#c00000">(Must-Have)</font>
    * **Given** the user has granted GPS location permissions and opened Tablé
    * **When** the home map interface renders
    * **Then** the system populates the map with restaurants located strictly within a `1.5 km` radius
    * **And** only restaurants with an `available_table_count > 0` at the exact time of query are displayed.

---

## Story 2: Manual Search Fallback on GPS Denial
### User Story
**As a** privacy-conscious user or a user in a poor signal area,
**I want to** manually type in my neighborhood when GPS is unavailable,
**so that** I can still explore restaurant availability manually.

### Acceptance Criteria 
* **Scenario 2.2: Basic GPS Denial Handling** <font color="#245bdb">(Nice-to-Have)</font>
    * **Given** the user denies GPS permissions upon app launch
    * **When** the home map interface attempts to render
    * **Then** the system displays a modal stating "Location required"
    * **And** provides a manual text-input field for the user to type a neighborhood (e.g., "Manhattan").