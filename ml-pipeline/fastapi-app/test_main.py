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
        hour,
        weekday,
        month=None,
        taxi_dropoffs_override=None,
        restaurant_id=None,
        features=None,
    ):
        self.last_prediction_request = {
            "restaurant_id": restaurant_id,
            "hour": hour,
            "weekday": weekday,
            "month": month,
            "taxi_dropoffs_override": (
                taxi_dropoffs_override
            ),
            "features": features,
        }

        dropoffs = (
            float(taxi_dropoffs_override)
            if taxi_dropoffs_override is not None
            else 125.0
        )

        # An id absent from the local feature table is no longer an error —
        # it just means nothing was resolved from that table.
        is_unknown = restaurant_id == "unknown-restaurant"

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
            taxi_dropoffs_1h=None if is_unknown else dropoffs,
            taxi_zone_id=None if is_unknown else "161",
            capacity=10,
            taxi_zone_source=(
                "unresolved" if is_unknown else "feature_table"
            ),
            feature_source=(
                "imputed" if is_unknown else "feature_table"
            ),
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
        "taxi_zone_source": "feature_table",
        "feature_source": "feature_table",
        "observed_occupancy": None,
        "booking_weight": None,
    }

    request = fake_model_service.last_prediction_request

    assert request["restaurant_id"] == "restaurant-123"
    assert request["hour"] == 19
    assert request["weekday"] == 4
    assert request["month"] == 7
    assert request["taxi_dropoffs_override"] is None


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


def test_predict_busyness_serves_restaurant_absent_from_feature_table(
    client,
):
    """
    An id the local Parquet export has never seen must still predict. The
    caller's database is the source of truth for restaurants; this table is
    only a fallback for features the caller did not supply.
    """
    response = client.post(
        "/predict/busyness"
        "?restaurant_id=unknown-restaurant",
        json={
            "hour_of_day": 19,
            "day_of_week": 4,
            "month": 7,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["restaurant_id"] == "unknown-restaurant"
    assert body["busyness_score"] == 0.65
    assert body["taxi_zone_id"] is None
    assert body["taxi_dropoffs_1h"] is None

    # The response says so rather than passing an imputed guess off as a
    # fully-resolved prediction.
    assert body["taxi_zone_source"] == "unresolved"
    assert body["feature_source"] == "imputed"


def test_predict_busyness_forwards_restaurant_features(
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
            "latitude": 40.7128,
            "longitude": -74.0060,
            "taxi_zone_id": 161,
            "typical_time_mid": 75.0,
            "rating": 4.4,
            "reviews": 1280,
            "estimated_area_sqft": 2400.0,
            "takeaway_ratio": 0.35,
            "capacity": 42,
        },
    )

    assert response.status_code == 200

    features = fake_model_service.last_prediction_request["features"]

    assert features.latitude == 40.7128
    assert features.longitude == -74.0060
    assert features.taxi_zone_id == 161
    assert features.typical_time_mid == 75.0
    assert features.rating == 4.4
    assert features.reviews == 1280
    assert features.estimated_area_sqft == 2400.0
    assert features.takeaway_ratio == 0.35
    assert features.capacity == 42


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


def test_match_users_excludes_unmet_accessibility_requirements(
    client,
):
    response = client.post(
        "/api/v1/match",
        json={
            "campaignId": "campaign-1",
            "restaurantId": "restaurant-1",
            "restaurant": {
                "id": "restaurant-1",
                "isWheelchairAccessible": True,
                "sensoryFriendly": False,
            },
            "candidateLimit": 3,
            "candidates": [
                {
                    "userId": "sensory-user",
                    "requiresSensoryFriendly": True,
                    "distanceMeters": 10,
                },
                {
                    "userId": "wheelchair-user",
                    "requiresWheelchairAccess": True,
                    "distanceMeters": 100,
                },
                {
                    "userId": "no-access-needs-user",
                    "distanceMeters": 200,
                },
            ],
        },
    )

    assert response.status_code == 200
    assert response.json()["matchedUserIds"] == [
        "wheelchair-user",
        "no-access-needs-user",
    ]


def test_match_users_does_not_assume_missing_venue_accessibility(
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
                    "userId": "wheelchair-user",
                    "requiresWheelchairAccess": True,
                    "distanceMeters": 10,
                },
                {
                    "userId": "no-access-needs-user",
                    "distanceMeters": 100,
                },
            ],
        },
    )

    assert response.status_code == 200
    assert response.json()["matchedUserIds"] == [
        "no-access-needs-user",
    ]


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
