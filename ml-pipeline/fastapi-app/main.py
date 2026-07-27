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

    # Retained for compatibility with existing clients.
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

    taxi_dropoffs_1h: float = Field(
        ...,
        ge=0,
    )

    taxi_zone_id: str

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

    distanceMeters: float = Field(
        ...,
        ge=0,
    )


class MatchRequest(BaseModel):
    campaignId: str
    restaurantId: str

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


def score_candidate(candidate: MatchCandidate) -> float:
    """
    Existing deterministic flash-deal candidate heuristic.

    This is separate from the restaurant busyness XGBoost model.
    """
    distance_factor = max(
        0.0,
        1.0 - min(
            candidate.distanceMeters / 1500.0,
            1.0,
        ),
    )

    score = distance_factor * 0.6

    if candidate.budgetTier:
        score += 0.2

    if candidate.dietaryTags:
        score += 0.1

    return round(
        min(1.0, max(0.0, score)),
        4,
    )


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

    try:
        model_prediction = service.predict(
            restaurant_id=restaurant_id,
            hour=payload.hour_of_day,
            weekday=payload.day_of_week,
            month=month,
            taxi_dropoffs_override=(
                payload.taxi_dropoffs_1h
            ),
        )

    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

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
        restaurant_id=model_prediction.restaurant_id,
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

    ranked = sorted(
        (
            (
                candidate.userId,
                score_candidate(candidate),
            )
            for candidate in payload.candidates
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
