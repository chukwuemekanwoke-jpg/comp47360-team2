FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer-free logs.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

# Install dependencies first so Docker can reuse this layer
# when only application code changes.
COPY requirements.txt ./

RUN pip install \
    --no-cache-dir \
    --upgrade pip \
    && pip install \
    --no-cache-dir \
    -r requirements.txt

# FastAPI application and ML services.
COPY main.py ./
COPY model_service.py ./
COPY area_factor.py ./
COPY booking_maturity.py ./

# Trained XGBoost pipeline.
COPY busyness_xgboost_pipeline.joblib ./

# Restaurant, taxi, pedestrian and taxi-zone feature data.
COPY data/ ./data/

# Run as a non-root user.
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup appuser \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# Verifies that the API process is responding.
HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=40s \
    --retries=3 \
    CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://127.0.0.1:'\"${PORT}\"'/health', timeout=3)" \
    || exit 1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
