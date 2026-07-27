import math

import pytest
from fastapi.testclient import TestClient

import main
from model_service import BusynessPrediction


# =========================================================
# Fake model service
# =========================================================

class FakeModelService:
    restaurant_count = 2815
    model_classes = [0, 1, 2]

    def __init__(self):
        self.last_prediction_request = None

    def predict(
        self,
        restaurant_id,
        hour,
        weekday,
        month=None,
        taxi_dropoffs_override=None,
    ):
        self.last_prediction_request = {
            "restaurant_id": restaurant_id,
            "hour": hour,
            "weekday": weekday,
            "month": month,
            "taxi_dropoffs_override": (
                taxi_dropoffs_override
            ),
        }

        if restaurant_id == "unknown-restaurant":
            raise KeyError(
                f"Unknown restaurant_id: {restaurant_id}"
            )

        dropoffs = (
            float(taxi_dropoffs_override)
            if taxi_dropoffs_override is not None
            else 125.0
        )

        return BusynessPrediction(
            restaurant_id=str(restaurant_id),
            busyness_level=1,
            busyness_label="Queue Required",
            busyness_score=0.65,
            confidence=0.80,
            class_probabilities={
                "no_wait": 0.10,
                "queue_required": 0.50,
                "severe_queue": 0.40,
            },
            taxi_dropoffs_1h=dropoffs,
            taxi_zone_id="161",
            capacity=10,
        )


# =========================================================
# Fixtures
# =========================================================

@pytest.fixture
def fake_model_service():
    return FakeModelService()


@pytest.fixture
def client(monkeypatch, fake_model_service):
    """
    Replace the real startup model loader so unit tests do not
    depend on local model and Parquet files.
    """
    monkeypatch.setattr(
        main,
        "get_model_service",
        lambda: fake_model_service,
    )

    # Using TestClient as a context manager executes the
    # FastAPI lifespan startup and shutdown functions.
    with TestClient(main.app) as test_client:
        yield test_client


# =========================================================
# Root and health tests
# =========================================================

def test_root_describes_service_endpoints(client):
    response = client.get("/")

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "online"
    assert body["service"] == (
        "Tablé ML Inference API"
    )
    assert body["version"] == "2.0.0"

    assert body["endpoints"] == {
        "health": "/health",
        "predict_busyness": (
            "/predict/busyness"
        ),
        "match": "/api/v1/match",
    }


def test_health_check_reports_loaded_model(client):
    response = client.get("/health")

    assert response.status_code == 200

    assert response.json() == {
        "status": "healthy",
        "model_loaded": True,
        "restaurant_count": 2815,
        "model_classes": [0, 1, 2],
    }


# =========================================================
# XGBoost prediction endpoint tests
# =========================================================

def test_predict_busyness_uses_model_service(
    client,
    fake_model_service,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-123",
        json={
            "hour_of_day": 19,
            "day_of_week": 4,
            "month": 7,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body == {
        "restaurant_id": "restaurant-123",
        "busyness_level": 1,
        "busyness_label": "Queue Required",
        "busyness_score": 0.65,
        "class_probabilities": {
            "no_wait": 0.10,
            "queue_required": 0.50,
            "severe_queue": 0.40,
        },
        "available_table_count": 4,
        "confidence": 0.80,
        "taxi_dropoffs_1h": 125.0,
        "taxi_zone_id": "161",
        "observed_occupancy": None,
        "booking_weight": None,
    }

    assert (
        fake_model_service.last_prediction_request
        == {
            "restaurant_id": "restaurant-123",
            "hour": 19,
            "weekday": 4,
            "month": 7,
            "taxi_dropoffs_override": None,
        }
    )


def test_predict_busyness_passes_taxi_override(
    client,
    fake_model_service,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-123",
        json={
            "hour_of_day": 12,
            "day_of_week": 1,
            "month": 4,
            "taxi_dropoffs_1h": 250,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["taxi_dropoffs_1h"] == 250.0

    assert (
        fake_model_service
        .last_prediction_request[
            "taxi_dropoffs_override"
        ]
        == 250
    )


def test_predict_busyness_probabilities_sum_to_one(
    client,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-123",
        json={
            "hour_of_day": 18,
            "day_of_week": 5,
            "month": 8,
        },
    )

    assert response.status_code == 200

    probabilities = response.json()[
        "class_probabilities"
    ]

    total_probability = sum(
        probabilities.values()
    )

    assert math.isclose(
        total_probability,
        1.0,
        abs_tol=1e-6,
    )


def test_predict_busyness_returns_404_for_unknown_restaurant(
    client,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=unknown-restaurant",
        json={
            "hour_of_day": 19,
            "day_of_week": 4,
            "month": 7,
        },
    )

    assert response.status_code == 404
    assert "Unknown restaurant_id" in (
        response.json()["detail"]
    )


def test_predict_busyness_rejects_invalid_time_values(
    client,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-123",
        json={
            "hour_of_day": 25,
            "day_of_week": 7,
            "month": 13,
        },
    )

    assert response.status_code == 422

    error_fields = {
        tuple(error["loc"])
        for error in response.json()["detail"]
    }

    assert (
        "body",
        "hour_of_day",
    ) in error_fields

    assert (
        "body",
        "day_of_week",
    ) in error_fields

    assert (
        "body",
        "month",
    ) in error_fields


def test_predict_busyness_rejects_negative_taxi_override(
    client,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-123",
        json={
            "hour_of_day": 10,
            "day_of_week": 2,
            "taxi_dropoffs_1h": -1,
        },
    )

    assert response.status_code == 422


# =========================================================
# Booking maturity tests
# =========================================================

def test_new_restaurant_keeps_pure_model_prediction(
    client,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-new",
        json={
            "hour_of_day": 19,
            "day_of_week": 4,
            "month": 7,
            "days_since_onboarding": 0,
            "recent_bookings_total_30d": 0,
            "recent_bookings_same_bucket_30d": 0,
            "capacity": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["booking_weight"] == 0.0
    assert body["observed_occupancy"] == 0.0
    assert body["busyness_score"] == 0.65
    assert body["available_table_count"] == 4


def test_mature_restaurant_blends_toward_observed_occupancy(
    client,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-mature",
        json={
            "hour_of_day": 19,
            "day_of_week": 4,
            "month": 7,
            "days_since_onboarding": 30,
            "recent_bookings_total_30d": 120,
            "recent_bookings_same_bucket_30d": 40,
            "capacity": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    # Four approximate occurrences of the selected weekday
    # over 30 days, with ten tables:
    # 40 / (4 * 10) = 1.0.
    assert body["observed_occupancy"] == 1.0

    # 0.6 * 1.0 * 120 / (120 + 20)
    assert body["booking_weight"] == 0.5143

    expected_score = (
        0.65 * (1.0 - body["booking_weight"])
        + 1.0 * body["booking_weight"]
    )

    assert math.isclose(
        body["busyness_score"],
        round(expected_score, 4),
        abs_tol=1e-4,
    )

    assert (
        body["busyness_score"] > 0.65
    )

    assert body["confidence"] == 1.0


def test_sparse_booking_history_has_small_effect(
    client,
):
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=restaurant-sparse",
        json={
            "hour_of_day": 19,
            "day_of_week": 4,
            "month": 7,
            "days_since_onboarding": 30,
            "recent_bookings_total_30d": 2,
            "recent_bookings_same_bucket_30d": 2,
            "capacity": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["booking_weight"] < 0.06
    assert (
        abs(body["busyness_score"] - 0.65)
        < 0.05
    )


# =========================================================
# Flash-deal matching tests
# =========================================================

def test_match_users_orders_candidates_by_score(
    client,
):
    response = client.post(
        "/api/v1/match",
        json={
            "campaignId": "campaign-1",
            "restaurantId": "restaurant-1",
            "candidateLimit": 2,
            "candidates": [
                {
                    "userId": "near-vegan",
                    "budgetTier": "TIER_2",
                    "dietaryTags": ["vegan"],
                    "distanceMeters": 100,
                },
                {
                    "userId": "far-user",
                    "budgetTier": None,
                    "dietaryTags": [],
                    "distanceMeters": 1400,
                },
                {
                    "userId": "mid-user",
                    "budgetTier": "TIER_1",
                    "dietaryTags": [],
                    "distanceMeters": 500,
                },
            ],
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["matchedUserIds"] == [
        "near-vegan",
        "mid-user",
    ]

    assert (
        body["scores"][0]
        > body["scores"][1]
    )


def test_match_users_returns_empty_result(
    client,
):
    response = client.post(
        "/api/v1/match",
        json={
            "campaignId": "campaign-1",
            "restaurantId": "restaurant-1",
            "candidateLimit": 3,
            "candidates": [],
        },
    )

    assert response.status_code == 200

    assert response.json() == {
        "matchedUserIds": [],
        "scores": [],
    }


def test_match_candidate_score_is_deterministic(
    client,
):
    payload = {
        "campaignId": "campaign-1",
        "restaurantId": "restaurant-1",
        "candidateLimit": 1,
        "candidates": [
            {
                "userId": "user-1",
                "budgetTier": "TIER_2",
                "dietaryTags": ["vegan"],
                "distanceMeters": 300,
            }
        ],
    }

    first_response = client.post(
        "/api/v1/match",
        json=payload,
    )

    second_response = client.post(
        "/api/v1/match",
        json=payload,
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200

    assert (
        first_response.json()
        == second_response.json()
    )
