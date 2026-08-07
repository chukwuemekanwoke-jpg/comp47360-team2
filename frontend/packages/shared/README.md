**Author:** Milo Dennehy — Mobile App Lead

Read Me for tracking rationale behind the current implementation of Redux State Management

V 0.0.1: 
* Introduced the mono-repo design for the frontend - this allows both the mobile and web app implementations to share state via the Redux common functionality.
    - This functionality allows for the both frameworks to easily access API methods through a shared interface: including shared consistent output typing
    - Additionally implementing additional functionality like authentication within this shared state package allows to de-duplicate effort and 
    ensure common capatability with the backendd technology (to be introduced in V  0.1.0 )

* Implemented the basic API specification as detailed in version 0 of the API contract, this includes:
    - Functionality for CRUD operations with application users, restaraunts, offers, and bookings
    - Redux is a strong choice for this purpose as features such as tags allow for easy state management of resources ex.:
    A user updates their preferences, and in doing so invalidates any cached user or restaraunt info (some restaraunts may not fit changed preferences)
    using tags both "User" and "Restaraunt" become invalid.

Redux was outlined as a requirement through Jira action TABL-304C for mobile development - based on discussion with the backend lead.
