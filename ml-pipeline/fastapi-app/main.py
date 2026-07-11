from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import random

from area_factor import get_area_factor

app = FastAPI(
    title="Tablé Algorithm Inference API",
    description="Machine Learning & recommendation inference API for Manhattan dining availability and lull-mitigation deals.",
    version="1.0.0"
)

class InferenceRequest(BaseModel):
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of the week (0-6, where 0 is Monday)")
    latitude: Optional[float] = Field(
        None, ge=-90.0, le=90.0,
        description="Restaurant latitude — when given (with longitude), taxi_dropoffs_1h and an "
                     "area busyness factor are computed automatically from real NYC taxi + pedestrian "
                     "data instead of relying on the caller to supply taxi_dropoffs_1h directly.",
    )
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Restaurant longitude")
    taxi_dropoffs_1h: Optional[int] = Field(
        None, ge=0,
        description="Taxi dropoffs near restaurant in last 1 hour. Auto-computed from "
                     "latitude/longitude when omitted and coordinates are provided.",
    )
    rolling_busyness_7d: Optional[float] = Field(None, ge=0.0, le=1.0, description="Rolling average busyness score for past 7 days")
    neighborhood: Optional[str] = Field(None, description="Neighborhood name")
    cuisine: Optional[str] = Field(None, description="Cuisine type")
    distance_meters: Optional[float] = Field(None, ge=0.0, description="Distance from user to restaurant in meters")

class InferenceResponse(BaseModel):
    restaurant_id: str
    busyness_score: float = Field(..., ge=0.0, le=1.0, description="Predicted busyness score (0 = quiet, 1 = extremely busy)")
    available_table_count: int = Field(..., ge=0, description="Simulated/predicted available table count")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model prediction confidence score")
    taxi_dropoffs_1h: Optional[float] = Field(None, description="Taxi dropoffs used for this prediction (supplied or auto-computed)")
    area_busyness_factor: Optional[float] = Field(None, ge=0.0, le=1.0, description="Combined real-data area signal (taxi + foot traffic), when coordinates were provided")

class MatchCandidate(BaseModel):
    userId: str
    budgetTier: Optional[str] = None
    dietaryTags: List[str] = Field(default_factory=list)
    distanceMeters: float = Field(..., ge=0.0)

class MatchRequest(BaseModel):
    campaignId: str
    restaurantId: str
    candidateLimit: int = Field(..., ge=1, le=50)
    candidates: List[MatchCandidate] = Field(default_factory=list)

class MatchResponse(BaseModel):
    matchedUserIds: List[str]
    scores: List[float]

def score_candidate(candidate: MatchCandidate) -> float:
    """Heuristic ranker — replace with trained model in Sprint 3+."""
    distance_factor = max(0.0, 1.0 - min(candidate.distanceMeters / 1500.0, 1.0))
    score = distance_factor * 0.6

    if candidate.budgetTier:
        score += 0.2

    if candidate.dietaryTags:
        score += 0.1

    score += random.uniform(0.0, 0.05)
    return min(1.0, max(0.0, round(score, 4)))

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Tablé ML Inference API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict_busyness": "/predict/busyness",
            "match": "/api/v1/match",
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/v1/match", response_model=MatchResponse)
def match_users(request: MatchRequest):
    """
    Rank nearby diner candidates for a flash-deal campaign.
    Gateway supplies pre-filtered candidates; returns top candidateLimit user ids.
    """
    try:
        if not request.candidates:
            return MatchResponse(matchedUserIds=[], scores=[])

        ranked = sorted(
            ((c.userId, score_candidate(c)) for c in request.candidates),
            key=lambda item: item[1],
            reverse=True,
        )
        top = ranked[: request.candidateLimit]

        return MatchResponse(
            matchedUserIds=[user_id for user_id, _ in top],
            scores=[score for _, score in top],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/busyness", response_model=InferenceResponse)
def predict_busyness(restaurant_id: str, request: InferenceRequest):
    """
    Predicts the busyness score and available tables for a given restaurant.
    Currently uses a heuristic-based simulation model as a fallback, blended
    with a real area-busyness signal (NYC taxi dropoffs + NYC DOT pedestrian
    counts, see area_factor.py) whenever latitude/longitude are supplied.
    """
    try:
        hour = request.hour_of_day
        is_peak = (12 <= hour <= 14) or (18 <= hour <= 21)
        is_weekend = request.day_of_week in [4, 5, 6]

        base_score = 0.6 if is_peak else 0.2
        if is_weekend:
            base_score += 0.2

        predicted_score = min(1.0, max(0.0, base_score + random.uniform(-0.1, 0.1)))

        taxi_dropoffs_1h = request.taxi_dropoffs_1h
        area_busyness_factor = None
        confidence = 0.75

        if request.latitude is not None and request.longitude is not None:
            try:
                area = get_area_factor(
                    request.latitude, request.longitude,
                    weekday=request.day_of_week, hour=request.hour_of_day,
                )
                area_busyness_factor = area.area_busyness_factor
                if taxi_dropoffs_1h is None:
                    taxi_dropoffs_1h = area.taxi_dropoffs_1h

                # Blend the real signal in, weighted by how much of it (taxi
                # + foot traffic) actually had coverage at this location.
                predicted_score = min(1.0, max(0.0,
                    predicted_score * (1 - 0.5 * area.confidence)
                    + area.area_busyness_factor * (0.5 * area.confidence)
                ))
                confidence = 0.6 + 0.35 * area.confidence
            except FileNotFoundError:
                # Area data unavailable in this environment — degrade to the
                # manual taxi_dropoffs_1h path below instead of erroring.
                pass

        if area_busyness_factor is None and taxi_dropoffs_1h is not None:
            density_boost = min(0.2, taxi_dropoffs_1h / 250.0)
            predicted_score = min(1.0, predicted_score + density_boost)
            confidence = 0.95

        base_tables = 8
        available_tables = max(0, round(base_tables * (1.0 - predicted_score)))

        return InferenceResponse(
            restaurant_id=restaurant_id,
            busyness_score=round(predicted_score, 4),
            available_table_count=available_tables,
            confidence=round(confidence, 4),
            taxi_dropoffs_1h=taxi_dropoffs_1h,
            area_busyness_factor=area_busyness_factor,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
