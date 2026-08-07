# Product Specification: Tablé

**Authors:** Yuhao Xu — Product & UX Lead · Yang Liu — Backend Lead

## 1. Project Overview

**Tablé** is a dynamic, B2B2C location-based marketplace designed to bridge the gap between spontaneous diners and restaurants with real-time seating availability. Functioning as an advanced yield-management platform, Tablé empowers restaurants to mitigate unexpected operational lulls by pushing highly targeted, 1-to-1 "flash deals" to nearby consumers.

By integrating real-time geolocation, transit-validated routing, and machine learning-driven preference matching, Tablé eliminates scheduling friction, drastically reduces no-show rates for restaurants, and minimizes wait times for consumers.

## 2. Core Functional Requirements

### 2.1 Consumer-Facing Features (C-Suite)

- **Geospatial Discovery Engine:** A dynamic map interface that locates and displays nearby restaurants offering immediate, confirmed table availability based on the user's live GPS coordinates.
    
- **Transit-Validated Booking (ETA Guardrails):** Calculates hyper-accurate travel times based on the user’s selected transit mode (walking, driving, public transit). The system employs "reachable range" logic to block or warn users if their calculated ETA exceeds the restaurant's reservation hold window.
    
- **Smart Preference Onboarding:** Captures and stores user culinary affinities, dietary restrictions, and budget tiers to train the recommendation and matching algorithms.
    
- **Exclusive Offer Inbox (Anti-Fatigue Model):** A dedicated, zero-spam portal where users receive personalized, 1-to-1 flash deals from nearby restaurants. The anti-fatigue algorithm ensures users only receive high-relevance offers, preventing notification burnout.
    

### 2.2 Restaurant-Facing Features (B-Suite)

- **Real-Time Inventory Dashboard:** An intuitive control center for hosts and managers to monitor upcoming bookings, assess current floor capacity, and instantly toggle table statuses (Open/Occupied).
    
- **Lull-Mitigation Engine:** An on-demand query feature allowing operators to flag unexpected slow periods (e.g., a Sunday 3:00 PM drop-off) and request the algorithm to source high-probability local diners.
    
- **1-to-1 Flash Deal Creator:** Empowers restaurants to generate time-sensitive, private promotions routed directly to a single matched user's device. This protects the restaurant's brand equity by avoiding public, mass-market discounting.
    

### 2.3 Backend & Predictive Analytics Architecture

- **Predictive Matching Pipeline:** A machine learning model that cross-references real-time location telemetry, historical dining behavior, and user profiles to pair a restaurant's flash deal with the most viable consumer.
    
- **Dynamic Routing Calculator:** Integrates with the Google **Routes API** (`computeRouteMatrix`) when the user opens a restaurant or confirms a booking, with haversine fallback. Results drive strict ETA guardrails before a hold is granted.
    

## 3. Target User Personas

#### Persona 1: The Spontaneous Executive (Consumer)

- **Profile:** A busy professional working unpredictable hours, traveling frequently, and rarely booking meals days in advance.
    
- **Ecosystem Role:** Utilizes Tablé to bypass physical queues and instantly secure guaranteed seating at premium restaurants near their office or hotel. Focuses on convenience over price.
    

#### Persona 2: The Deal-Hunting Foodie (Consumer)

- **Profile:** A price-sensitive but highly enthusiastic diner (e.g., a graduate student or young professional) operating on a strict budget but craving high-quality culinary experiences.
    
- **Ecosystem Role:** Maintains active location permissions to capture heavily discounted, 1-to-1 flash deals from mid-to-high-tier restaurants during off-peak hours.
    

#### Persona 3: The Independent Restaurateur (Business)

- **Profile:** An independent restaurant owner or general manager battling unpredictable foot traffic, perishable inventory (empty tables), and high fixed overhead costs.
    
- **Ecosystem Role:** Triggers the platform's Lull-Mitigation API during slow shifts to quietly and efficiently fill empty seats with local diners, maximizing revenue without cheapening the brand image.
    

#### Persona 4: The Urban Explorer (Consumer)

- **Profile:** A tourist, digital nomad, or eco-conscious resident who relies exclusively on public transit, cycling, or walking.
    
- **Ecosystem Role:** Heavily relies on Tablé’s _Transit-Validated Booking_ guardrails to confidently secure reservations, knowing the system guarantees the destination is physically reachable via their chosen transport mode before the table is released.