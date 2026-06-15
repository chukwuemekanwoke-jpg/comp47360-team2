erDiagram

    USER ||--o{ USER_LOCATION : records
    USER ||--o{ USER_PREFERENCE : has
    USER ||--o{ USER_DIETARY_RESTRICTION : has
    USER ||--|| USER_BUDGET : has
    USER ||--o{ RESERVATION : makes
    USER ||--o{ USER_OFFER : receives
    USER ||--o{ DINING_HISTORY : has
    USER ||--o{ USER_EVENT_LOG : generates
    USER ||--o{ RECOMMENDATION_SCORE : receives

    RESTAURANT ||--o{ RESTAURANT_CUISINE : serves
    RESTAURANT ||--o{ RESTAURANT_OPENING_HOURS : has
    RESTAURANT ||--o{ RESTAURANT_TABLE : owns
    RESTAURANT ||--o{ RESERVATION : receives
    RESTAURANT ||--o{ FLASH_DEAL : creates
    RESTAURANT ||--o{ LULL_REQUEST : submits
    RESTAURANT ||--o{ DINING_HISTORY : appears_in
    RESTAURANT ||--o{ USER_EVENT_LOG : appears_in
    RESTAURANT ||--o{ RECOMMENDATION_SCORE : scored_for

    RESTAURANT_TABLE ||--|| TABLE_STATUS : has
    RESTAURANT_TABLE ||--o{ RESERVATION : assigned_to

    RESERVATION ||--o{ ETA_CHECK : validated_by

    FLASH_DEAL ||--|| USER_OFFER : sent_as
    FLASH_DEAL ||--o{ USER_EVENT_LOG : tracked_by

    LULL_REQUEST ||--o{ MATCH_CANDIDATE : generates
    USER ||--o{ MATCH_CANDIDATE : candidate_for


    USER {
        bigint user_id PK
        varchar name
        varchar email UK
        varchar phone UK
        varchar status
        timestamp created_at
    }

    USER_LOCATION {
        bigint location_id PK
        bigint user_id FK
        decimal latitude
        decimal longitude
        int accuracy_meters
        timestamp recorded_at
    }

    USER_PREFERENCE {
        bigint preference_id PK
        bigint user_id FK
        varchar cuisine_type
        decimal preference_score
        timestamp created_at
    }

    USER_DIETARY_RESTRICTION {
        bigint user_id PK, FK
        varchar restriction_type PK
    }

    USER_BUDGET {
        bigint user_id PK, FK
        decimal min_budget
        decimal max_budget
        char currency
    }

    RESTAURANT {
        bigint restaurant_id PK
        varchar name
        text address
        decimal latitude
        decimal longitude
        varchar phone
        int price_tier
        varchar status
        timestamp created_at
    }

    RESTAURANT_CUISINE {
        bigint restaurant_id PK, FK
        varchar cuisine_type PK
    }

    RESTAURANT_OPENING_HOURS {
        bigint opening_id PK
        bigint restaurant_id FK
        int day_of_week
        time open_time
        time close_time
    }

    RESTAURANT_TABLE {
        bigint table_id PK
        bigint restaurant_id FK
        varchar table_number
        int min_party_size
        int max_party_size
        varchar status
    }

    TABLE_STATUS {
        bigint table_id PK, FK
        varchar current_status
        timestamp updated_at
    }

    RESERVATION {
        bigint reservation_id PK
        bigint user_id FK
        bigint restaurant_id FK
        bigint table_id FK
        int party_size
        timestamp reservation_start
        timestamp reservation_end
        int booking_window_minutes
        varchar transport_mode
        int eta_minutes
        varchar status
        timestamp created_at
    }

    ETA_CHECK {
        bigint eta_check_id PK
        bigint reservation_id FK
        decimal origin_latitude
        decimal origin_longitude
        decimal destination_latitude
        decimal destination_longitude
        varchar transport_mode
        int eta_minutes
        int distance_meters
        boolean is_reachable
        timestamp checked_at
    }

    FLASH_DEAL {
        bigint deal_id PK
        bigint restaurant_id FK
        varchar title
        text description
        varchar discount_type
        decimal discount_value
        timestamp valid_from
        timestamp valid_until
        varchar status
        timestamp created_at
    }

    USER_OFFER {
        bigint offer_id PK
        bigint deal_id FK, UK
        bigint user_id FK
        bigint restaurant_id FK
        decimal match_score
        varchar offer_status
        timestamp sent_at
        timestamp expires_at
    }

    LULL_REQUEST {
        bigint lull_request_id PK
        bigint restaurant_id FK
        int requested_party_size
        timestamp target_time
        decimal max_discount
        varchar status
        timestamp created_at
    }

    MATCH_CANDIDATE {
        bigint candidate_id PK
        bigint lull_request_id FK
        bigint user_id FK
        int eta_minutes
        decimal preference_score
        decimal conversion_score
        decimal fatigue_score
        decimal final_match_score
        int ranked_position
    }

    DINING_HISTORY {
        bigint history_id PK
        bigint user_id FK
        bigint restaurant_id FK
        varchar cuisine_type
        decimal spend_per_person
        int party_size
        timestamp visit_time
        decimal rating
    }

    USER_EVENT_LOG {
        bigint event_id PK
        bigint user_id FK
        bigint restaurant_id FK
        bigint deal_id FK
        varchar event_type
        timestamp event_time
        json metadata
    }

    RECOMMENDATION_SCORE {
        bigint score_id PK
        bigint user_id FK
        bigint restaurant_id FK
        decimal preference_score
        decimal distance_score
        decimal budget_score
        decimal conversion_score
        decimal final_score
        varchar model_version
        timestamp calculated_at
    }