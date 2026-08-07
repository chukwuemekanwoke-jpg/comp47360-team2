# 🧠 Tablé ML Inference API

**Authors:** Chukwuemeka Nwoke — Integration Lead / Scrum Master · Yang Liu — Backend Lead

This subdirectory contains the Machine Learning and Recommendation inference service for the **Tablé** platform, built using Python and FastAPI.

The service provides real-time predictions of restaurant busyness and estimates immediate dining table availability.

## 🚀 Setup & Execution

### 1. Prerequisites
- Python 3.9 or higher

### 2. Create a Virtual Environment
Navigate to this directory and create a Python virtual environment:
```bash
cd ml-pipeline/fastapi-app
python -m venv venv
```

Activate the virtual environment:
- **Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Development Server
```bash
uvicorn main:app --reload --port 8000
```
The API documentation will be available interactively at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔌 API Endpoints

### `GET /`
Returns API metadata and a list of available endpoints.

### `GET /health`
Returns the operational status of the service: `{"status": "healthy"}`.

### `POST /predict/busyness`
Predicts the hourly busyness score and available tables for a restaurant.

**Request Schema:**
```json
{
  "hour_of_day": 19,
  "day_of_week": 4,
  "taxi_dropoffs_1h": 120,
  "rolling_busyness_7d": 0.65,
  "neighborhood": "East Village",
  "cuisine": "Italian",
  "distance_meters": 350.0
}
```

**Response Schema:**
```json
{
  "restaurant_id": "rest_123",
  "busyness_score": 0.824,
  "available_table_count": 1,
  "confidence": 0.95
}
```

### `POST /api/v1/match` (BE-14)

Ranks pre-filtered diner candidates for a flash-deal campaign. Called by the API gateway (not mobile/web).

**Request Schema:**
```json
{
  "campaignId": "550e8400-e29b-41d4-a716-446655440100",
  "restaurantId": "550e8400-e29b-41d4-a716-446655441001",
  "candidateLimit": 2,
  "candidates": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "budgetTier": "TIER_2",
      "dietaryTags": ["vegan"],
      "distanceMeters": 320
    }
  ]
}
```

**Response Schema:**
```json
{
  "matchedUserIds": ["550e8400-e29b-41d4-a716-446655440001"],
  "scores": [0.87]
}
```

The gateway supplies `candidates` after a spatial SQL query; this service scores and returns the top `candidateLimit` users. Replace `score_candidate()` with a trained model in later sprints.
