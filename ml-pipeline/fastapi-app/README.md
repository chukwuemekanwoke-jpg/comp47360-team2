# 🧠 Tablé ML Inference API

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
