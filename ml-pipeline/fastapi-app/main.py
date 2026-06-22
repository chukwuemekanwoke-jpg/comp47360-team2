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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Tablé ML Inference API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict_busyness": "/predict/busyness"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict/busyness", response_model=InferenceResponse)
def predict_busyness(restaurant_id: str, request: InferenceRequest):
    """
    Predicts the busyness score and available tables for a given restaurant.
    Currently uses a heuristic-based simulation model as a fallback.
    """
    try:
        # Heuristic simulation: base busyness on hour of day and day of week
        # Peak hours: 12-14 (lunch) and 18-21 (dinner)
        hour = request.hour_of_day
        is_peak = (12 <= hour <= 14) or (18 <= hour <= 21)
        
        # Weekend multiplier
        is_weekend = request.day_of_week in [4, 5, 6] # Friday, Saturday, Sunday
        
        # Base busyness score calculation
        base_score = 0.6 if is_peak else 0.2
        if is_weekend:
            base_score += 0.2
            
        # Add slight randomness to mimic live signals
        predicted_score = min(1.0, max(0.0, base_score + random.uniform(-0.1, 0.1)))
        
        # If taxi dropoff signal exists, incorporate it
        if request.taxi_dropoffs_1h is not None:
            # Assume > 50 dropoffs indicates high local density
            density_boost = min(0.2, request.taxi_dropoffs_1h / 250.0)
            predicted_score = min(1.0, predicted_score + density_boost)
            
        # Available tables calculation (heuristic from docs/data-strategy.md)
        base_tables = 8  # seed constant per restaurant
        # available_tables = base_tables * (1 - busyness)
        available_tables = max(0, round(base_tables * (1.0 - predicted_score)))
        
        return InferenceResponse(
            restaurant_id=restaurant_id,
            busyness_score=round(predicted_score, 4),
            available_table_count=available_tables,
            confidence=0.95 if request.taxi_dropoffs_1h is not None else 0.75
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
