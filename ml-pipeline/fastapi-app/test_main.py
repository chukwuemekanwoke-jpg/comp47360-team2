from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_root_describes_service_endpoints():
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "online"
    assert body["endpoints"]["health"] == "/health"
    assert body["endpoints"]["predict_busyness"] == "/predict/busyness"
    assert body["endpoints"]["match"] == "/api/v1/match"


def test_health_check_is_healthy():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_predict_busyness_returns_stable_prediction(monkeypatch):
    monkeypatch.setattr(main.random, "uniform", lambda _low, _high: 0.0)

    response = client.post(
        "/predict/busyness?restaurant_id=mercer-room",
        json={
            "hour_of_day": 19,
            "day_of_week": 5,
            "taxi_dropoffs_1h": 25,
            "rolling_busyness_7d": 0.4,
            "neighborhood": "Manhattan",
            "cuisine": "Omakase",
            "distance_meters": 450,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "restaurant_id": "mercer-room",
        "busyness_score": 0.9,
        "available_table_count": 1,
        "confidence": 0.95,
        "taxi_dropoffs_1h": 25.0,
        "area_busyness_factor": None,
    }


def test_predict_busyness_uses_area_factor_when_coordinates_given(monkeypatch):
    monkeypatch.setattr(main.random, "uniform", lambda _low, _high: 0.0)

    # Times Square coordinates — real taxi zone + pedestrian-count data
    # should resolve here, exercising the full area_factor path.
    response = client.post(
        "/predict/busyness?restaurant_id=times-square-spot",
        json={
            "hour_of_day": 19,
            "day_of_week": 4,
            "latitude": 40.758948773339,
            "longitude": -73.984774441289,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["restaurant_id"] == "times-square-spot"
    assert 0.0 <= body["busyness_score"] <= 1.0
    assert body["taxi_dropoffs_1h"] is not None and body["taxi_dropoffs_1h"] > 0
    assert body["area_busyness_factor"] is not None
    assert 0.0 <= body["area_busyness_factor"] <= 1.0
    assert body["confidence"] > 0.75  # both taxi + pedestrian signals available here


def test_match_users_orders_candidates_by_score(monkeypatch):
    monkeypatch.setattr(main.random, "uniform", lambda _low, _high: 0.0)

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
    assert body["matchedUserIds"] == ["near-vegan", "mid-user"]
    assert body["scores"][0] > body["scores"][1]


def test_match_users_returns_empty_result_without_candidates():
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
    assert response.json() == {"matchedUserIds": [], "scores": []}


def test_request_validation_rejects_invalid_shapes():
    response = client.post(
        "/predict/busyness?restaurant_id=bad-room",
        json={
            "hour_of_day": 26,
            "day_of_week": 9,
            "distance_meters": -1,
        },
    )

    assert response.status_code == 422
    error_fields = {tuple(error["loc"]) for error in response.json()["detail"]}
    assert ("body", "hour_of_day") in error_fields
    assert ("body", "day_of_week") in error_fields
    assert ("body", "distance_meters") in error_fields
