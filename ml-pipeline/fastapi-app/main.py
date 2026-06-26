from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import random

app = FastAPI(
    title="Tablé Algorithm Inference API",
    description="Machine Learning & recommendation inference API for Manhattan dining availability and lull-mitigation deals.",
    version="1.0.0"
)

class InferenceRequest(BaseModel):
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of the week (0-6, where 0 is Monday)")
    taxi_dropoffs_1h: Optional[int] = Field(None, ge=0, description="Taxi dropoffs near restaurant in last 1 hour")
    rolling_busyness_7d: Optional[float] = Field(None, ge=0.0, le=1.0, description="Rolling average busyness score for past 7 days")
    neighborhood: Optional[str] = Field(None, description="Neighborhood name")
    cuisine: Optional[str] = Field(None, description="Cuisine type")
    distance_meters: Optional[float] = Field(None, ge=0.0, description="Distance from user to restaurant in meters")

class InferenceResponse(BaseModel):
    restaurant_id: str
    busyness_score: float = Field(..., ge=0.0, le=1.0, description="Predicted busyness score (0 = quiet, 1 = extremely busy)")
    available_table_count: int = Field(..., ge=0, description="Simulated/predicted available table count")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model prediction confidence score")

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
    Currently uses a heuristic-based simulation model as a fallback.
    """
    try:
        hour = request.hour_of_day
        is_peak = (12 <= hour <= 14) or (18 <= hour <= 21)
        is_weekend = request.day_of_week in [4, 5, 6]

        base_score = 0.6 if is_peak else 0.2
        if is_weekend:
            base_score += 0.2

        predicted_score = min(1.0, max(0.0, base_score + random.uniform(-0.1, 0.1)))

        if request.taxi_dropoffs_1h is not None:
            density_boost = min(0.2, request.taxi_dropoffs_1h / 250.0)
            predicted_score = min(1.0, predicted_score + density_boost)

        base_tables = 8
        available_tables = max(0, round(base_tables * (1.0 - predicted_score)))

        return InferenceResponse(
            restaurant_id=restaurant_id,
            busyness_score=round(predicted_score, 4),
            available_table_count=available_tables,
            confidence=0.95 if request.taxi_dropoffs_1h is not None else 0.75
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
