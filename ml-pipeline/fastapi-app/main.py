from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

from booking_maturity import (
    BOOKING_WEIGHT_MAX,
    blend,
    booking_weight,
    observed_occupancy,
)
from model_service import (
    BusynessModelService,
    RestaurantFeatures,
    get_model_service,
)


# =========================================================
# Application lifecycle
# =========================================================

NEW_YORK_TIMEZONE = ZoneInfo("America/New_York")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the XGBoost pipeline and feature tables once when the
    FastAPI process starts.
    """
    app.state.model_service = get_model_service()
    yield


app = FastAPI(
    title="Tablé Algorithm Inference API",
    description=(
        "Machine-learning inference API for Manhattan restaurant "
        "busyness and lull-mitigation deal matching."
    ),
    version="2.0.0",
    lifespan=lifespan,
)


# =========================================================
# Busyness request and response models
# =========================================================

class InferenceRequest(BaseModel):
    hour_of_day: int = Field(
        ...,
        ge=0,
        le=23,
        description="Hour of day from 0 to 23.",
    )

    day_of_week: int = Field(
        ...,
        ge=0,
        le=6,
        description="Monday=0 through Sunday=6.",
    )

    month: Optional[int] = Field(
        None,
        ge=1,
        le=12,
        description=(
            "Calendar month from 1 to 12. "
            "Defaults to the current month in New York."
        ),
    )

    taxi_dropoffs_1h: Optional[float] = Field(
        None,
        ge=0,
        description=(
            "Optional manual Taxi drop-off override. "
            "When omitted, the value is looked up from the "
            "restaurant taxi zone, month, weekday and hour."
        ),
    )

    # Used to resolve the taxi zone by point-in-polygon against the official
    # TLC shapefile, so a prediction no longer depends on the restaurant
    # existing in the locally exported feature table.
    latitude: Optional[float] = Field(
        None,
        ge=-90,
        le=90,
    )

    longitude: Optional[float] = Field(
        None,
        ge=-180,
        le=180,
    )

    taxi_zone_id: Optional[int] = Field(
        None,
        ge=1,
        description=(
            "TLC taxi zone LocationID. Takes precedence over the "
            "coordinate lookup when the caller already knows it."
        ),
    )

    # -----------------------------------------------------
    # Restaurant attributes owned by the calling service.
    #
    # These are genuine model features. Supplying them makes the caller's
    # database authoritative; omitting one falls back to the local feature
    # table and then to the pipeline's median imputation.
    # -----------------------------------------------------

    typical_time_mid: Optional[float] = Field(
        None,
        ge=0,
        description=(
            "Typical visit length in minutes. Derived from Google's "
            "'People typically spend ...' text during training."
        ),
    )

    rating: Optional[float] = Field(
        None,
        ge=0,
        le=5,
    )

    reviews: Optional[float] = Field(
        None,
        ge=0,
    )

    estimated_area_sqft: Optional[float] = Field(
        None,
        gt=0,
    )

    takeaway_ratio: Optional[float] = Field(
        None,
        ge=0,
        le=1,
    )

    # Accepted for client compatibility but not model features: the trained
    # pipeline has no corresponding column, so these are neither used nor
    # silently blended into the score.
    rolling_busyness_7d: Optional[float] = Field(
        None,
        ge=0,
        le=1,
    )

    neighborhood: Optional[str] = None
    cuisine: Optional[str] = None

    distance_meters: Optional[float] = Field(
        None,
        ge=0,
    )

    # Optional booking-history features.
    days_since_onboarding: Optional[float] = Field(
        None,
        ge=0,
    )

    recent_bookings_total_30d: Optional[int] = Field(
        None,
        ge=0,
    )

    recent_bookings_same_bucket_30d: Optional[int] = Field(
        None,
        ge=0,
    )

    capacity: Optional[int] = Field(
        None,
        ge=1,
    )


class ClassProbabilities(BaseModel):
    no_wait: float = Field(..., ge=0, le=1)
    queue_required: float = Field(..., ge=0, le=1)
    severe_queue: float = Field(..., ge=0, le=1)


class InferenceResponse(BaseModel):
    restaurant_id: str

    busyness_level: int = Field(
        ...,
        ge=0,
        le=2,
        description=(
            "0=No Wait, 1=Queue Required, 2=Severe Queue."
        ),
    )

    busyness_label: str

    busyness_score: float = Field(
        ...,
        ge=0,
        le=1,
        description=(
            "Continuous ordinal busyness score derived from "
            "XGBoost class probabilities and optionally blended "
            "with observed booking history."
        ),
    )

    class_probabilities: ClassProbabilities

    available_table_count: int = Field(
        ...,
        ge=0,
    )

    confidence: float = Field(
        ...,
        ge=0,
        le=1,
    )

    taxi_dropoffs_1h: Optional[float] = Field(
        None,
        ge=0,
        description=(
            "Null when no taxi zone could be resolved and no override was "
            "supplied — the model then relies on its imputed median."
        ),
    )

    taxi_zone_id: Optional[str] = None

    taxi_zone_source: str = Field(
        "unresolved",
        description=(
            "Where taxi_zone_id came from: request, coordinates, "
            "feature_table, or unresolved."
        ),
    )

    feature_source: str = Field(
        "imputed",
        description=(
            "Where the restaurant-level features came from: request, "
            "feature_table, mixed, or imputed."
        ),
    )

    observed_occupancy: Optional[float] = Field(
        None,
        ge=0,
        le=1,
    )

    booking_weight: Optional[float] = Field(
        None,
        ge=0,
        le=1,
    )


# =========================================================
# Flash-deal matching request and response models
# =========================================================

class MatchCandidate(BaseModel):
    userId: str
    budgetTier: Optional[str] = None
    dietaryTags: List[str] = Field(default_factory=list)
    preferredCuisines: List[str] = Field(default_factory=list)
    diningStyles: List[str] = Field(default_factory=list)
    requiresWheelchairAccess: bool = False
    requiresSensoryFriendly: bool = False

    distanceMeters: float = Field(
        ...,
        ge=0,
    )


class MatchRestaurant(BaseModel):
    """
    Venue-side attributes scored against candidate preferences.

    Optional on the request so older gateway builds that send only
    restaurantId keep working. Candidates with declared accessibility needs
    are ineligible when the venue capability cannot be verified.
    """

    id: str
    cuisine: Optional[str] = None
    neighborhood: Optional[str] = None
    avgCheckPerCover: Optional[float] = None
    isWheelchairAccessible: bool = False
    sensoryFriendly: bool = False


class MatchRequest(BaseModel):
    campaignId: str
    restaurantId: str
    restaurant: Optional[MatchRestaurant] = None

    candidateLimit: int = Field(
        ...,
        ge=1,
        le=50,
    )

    candidates: List[MatchCandidate] = Field(
        default_factory=list
    )


class MatchResponse(BaseModel):
    matchedUserIds: List[str]
    scores: List[float]


# =========================================================
# Service helpers
# =========================================================

def get_service(request: Request) -> BusynessModelService:
    service = getattr(
        request.app.state,
        "model_service",
        None,
    )

    if service is None:
        raise HTTPException(
            status_code=503,
            detail="Busyness model service is not available.",
        )

    return service


def score_candidate(
        candidate: MatchCandidate,
        restaurant: MatchRestaurant | None,
    ) -> float:
    """
    Existing deterministic flash-deal candidate heuristic.

    This is separate from the restaurant busyness XGBoost model.
    """
    if not candidate_meets_accessibility_requirements(candidate, restaurant):
        return 0.0

    distance_factor = max(
        0.0,
        1.0 - min(
            candidate.distanceMeters / 1500.0,
            1.0,
        ),
    )

    score = distance_factor * 0.6

    if restaurant and (restaurant.cuisine in candidate.preferredCuisines):
        score += 0.2
    if restaurant and (restaurant.isWheelchairAccessible and candidate.requiresWheelchairAccess):
        score += 0.1
    if restaurant and (restaurant.sensoryFriendly and candidate.requiresSensoryFriendly):
        score += 0.1


    return round(
        min(1.0, max(0.0, score)),
        4,
    )


def candidate_meets_accessibility_requirements(
        candidate: MatchCandidate,
        restaurant: MatchRestaurant | None,
    ) -> bool:
    """Return whether the venue can satisfy the candidate's declared needs."""
    if candidate.requiresWheelchairAccess:
        if restaurant is None or not restaurant.isWheelchairAccessible:
            return False

    if candidate.requiresSensoryFriendly:
        if restaurant is None or not restaurant.sensoryFriendly:
            return False

    return True


# =========================================================
# Metadata and health endpoints
# =========================================================

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Tablé ML Inference API",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "predict_busyness": "/predict/busyness",
            "match": "/api/v1/match",
        },
    }


@app.get("/health")
def health_check(request: Request):
    service = getattr(
        request.app.state,
        "model_service",
        None,
    )

    if service is None:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "model_loaded": False,
            },
        )

    return {
        "status": "healthy",
        "model_loaded": True,
        "restaurant_count": service.restaurant_count,
        "model_classes": service.model_classes,
    }


# =========================================================
# XGBoost busyness prediction
# =========================================================

@app.post(
    "/predict/busyness",
    response_model=InferenceResponse,
)
def predict_busyness(
    restaurant_id: str,
    payload: InferenceRequest,
    request: Request,
):
    service = get_service(request)

    month = payload.month

    if month is None:
        month = datetime.now(
            NEW_YORK_TIMEZONE
        ).month

    # Everything the caller knows about the venue is forwarded. The service
    # treats these as authoritative and only falls back to its local feature
    # table for whatever is absent, so an id that isn't in that table is no
    # longer a failure.
    features = RestaurantFeatures(
        typical_time_mid=payload.typical_time_mid,
        rating=payload.rating,
        reviews=payload.reviews,
        estimated_area_sqft=payload.estimated_area_sqft,
        takeaway_ratio=payload.takeaway_ratio,
        taxi_zone_id=payload.taxi_zone_id,
        capacity=payload.capacity,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )

    try:
        model_prediction = service.predict(
            restaurant_id=restaurant_id,
            hour=payload.hour_of_day,
            weekday=payload.day_of_week,
            month=month,
            taxi_dropoffs_override=(
                payload.taxi_dropoffs_1h
            ),
            features=features,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Busyness model prediction failed: "
                f"{exc}"
            ),
        ) from exc

    final_score = model_prediction.busyness_score
    final_confidence = model_prediction.confidence

    occupancy = None
    weight = None

    # -----------------------------------------------------
    # Optional merchant booking-history maturation
    # -----------------------------------------------------

    if (
        payload.days_since_onboarding is not None
        and payload.recent_bookings_total_30d is not None
    ):
        effective_capacity = (
            payload.capacity
            or model_prediction.capacity
            or 8
        )

        occupancy = observed_occupancy(
            same_bucket_bookings=(
                payload.recent_bookings_same_bucket_30d
                or 0
            ),
            days_since_onboarding=(
                payload.days_since_onboarding
            ),
            capacity=effective_capacity,
        )

        weight = booking_weight(
            days_since_onboarding=(
                payload.days_since_onboarding
            ),
            total_bookings_30d=(
                payload.recent_bookings_total_30d
            ),
        )

        final_score = blend(
            location_prior=final_score,
            observed=occupancy,
            weight=weight,
        )

        # Booking evidence raises confidence according to the
        # fraction of the maximum booking weight being used.
        final_confidence = min(
            1.0,
            final_confidence
            + 0.25 * (
                weight / BOOKING_WEIGHT_MAX
            ),
        )

    # Prefer capacity supplied by the caller, then the static
    # restaurant feature table, then the previous default of 8.
    effective_capacity = (
        payload.capacity
        or model_prediction.capacity
        or 8
    )

    available_tables = max(
        0,
        round(
            effective_capacity
            * (1.0 - final_score)
        ),
    )

    return InferenceResponse(
        restaurant_id=restaurant_id,
        busyness_level=(
            model_prediction.busyness_level
        ),
        busyness_label=(
            model_prediction.busyness_label
        ),
        busyness_score=round(
            final_score,
            4,
        ),
        class_probabilities=(
            model_prediction.class_probabilities
        ),
        available_table_count=available_tables,
        confidence=round(
            final_confidence,
            4,
        ),
        taxi_dropoffs_1h=(
            model_prediction.taxi_dropoffs_1h
        ),
        taxi_zone_id=(
            model_prediction.taxi_zone_id
        ),
        taxi_zone_source=(
            model_prediction.taxi_zone_source
        ),
        feature_source=(
            model_prediction.feature_source
        ),
        observed_occupancy=(
            round(occupancy, 4)
            if occupancy is not None
            else None
        ),
        booking_weight=(
            round(weight, 4)
            if weight is not None
            else None
        ),
    )


# =========================================================
# Flash-deal candidate matching
# =========================================================

@app.post(
    "/api/v1/match",
    response_model=MatchResponse,
)
def match_users(payload: MatchRequest):
    if not payload.candidates:
        return MatchResponse(
            matchedUserIds=[],
            scores=[],
        )

    eligible_candidates = (
        candidate
        for candidate in payload.candidates
        if candidate_meets_accessibility_requirements(candidate, payload.restaurant)
    )

    ranked = sorted(
        (
            (
                candidate.userId,
                score_candidate(candidate, payload.restaurant),
            )
            for candidate in eligible_candidates
        ),
        key=lambda item: item[1],
        reverse=True,
    )

    top_candidates = ranked[
        : payload.candidateLimit
    ]

    return MatchResponse(
        matchedUserIds=[
            user_id
            for user_id, _ in top_candidates
        ],
        scores=[
            score
            for _, score in top_candidates
        ],
    )
