"""
Unit tests for the feature-resolution layer.

These use a stub estimator rather than the real joblib pipeline so they run
without xgboost, and cover the behaviour that matters operationally: a
prediction must not depend on the restaurant existing in the local Parquet
export.
"""

import numpy as np
import pandas as pd
import pytest

import model_service
from model_service import (
    MODEL_COLUMNS,
    UNRESOLVED_TAXI_ZONE,
    BusynessModelService,
    RestaurantFeatures,
    parse_typical_time,
)


# =========================================================
# Stub estimator
# =========================================================

class StubPipeline:
    """Records the frame it was asked to score and returns fixed probabilities."""

    classes_ = np.array([0, 1, 2])

    def __init__(self):
        self.last_frame = None

    def predict_proba(self, frame):
        self.last_frame = frame.copy()
        return np.array([[0.10, 0.50, 0.40]])


@pytest.fixture
def service(tmp_path, monkeypatch):
    """A service with a stub model and no feature tables on disk."""
    model_path = tmp_path / "model.joblib"
    model_path.write_bytes(b"stub")

    stub = StubPipeline()
    monkeypatch.setattr(model_service.joblib, "load", lambda _: stub)

    built = BusynessModelService(
        model_path=model_path,
        restaurant_features_path=tmp_path / "missing_restaurants.parquet",
        taxi_features_path=tmp_path / "missing_taxi.parquet",
    )
    built.stub = stub
    return built


# =========================================================
# typical_time_mid parsing
# =========================================================

@pytest.mark.parametrize(
    "text,expected",
    [
        ("People typically spend 15 min to 1 hr here", 37.5),
        ("People typically spend 45 min to 2 hr here", 82.5),
        ("People typically spend 30 min here", 30.0),
        ("People typically spend 2 hours here", 120.0),
    ],
)
def test_parse_typical_time_matches_training_behaviour(text, expected):
    assert parse_typical_time(text) == expected


@pytest.mark.parametrize("text", [None, "", "no duration mentioned", np.nan])
def test_parse_typical_time_returns_nan_when_unmatched(text):
    assert np.isnan(parse_typical_time(text))


@pytest.mark.parametrize(
    "text",
    [
        # Hyphenated ranges and "up to" — the training regex misses both,
        # which is why 687 of 1741 rows carry no typical_time_mid. Pinned
        # here so a future regex widening is a deliberate, visible change
        # that gets paired with a retrain.
        "People typically spend 1.5-4 hours here",
        "People typically spend 10-45 min here",
        "People typically spend up to 2.5 hours here",
        # A unit is required after the first number.
        "People typically spend 1 to 1.5 hours here",
    ],
)
def test_parse_typical_time_known_training_gaps(text):
    assert np.isnan(parse_typical_time(text))


# =========================================================
# Booting without feature tables
# =========================================================

def test_service_boots_without_feature_tables(service):
    """Missing optional Parquet files must not stop the service starting."""
    assert service.restaurant_features is None
    assert service.taxi_features is None
    assert service.restaurant_count == 0


def test_missing_model_file_still_raises(tmp_path):
    """The model itself is the one genuinely load-bearing artifact."""
    with pytest.raises(FileNotFoundError):
        BusynessModelService(
            model_path=tmp_path / "absent.joblib",
            restaurant_features_path=tmp_path / "absent_r.parquet",
            taxi_features_path=tmp_path / "absent_t.parquet",
        )


# =========================================================
# Prediction without a feature-table join
# =========================================================

def test_unknown_restaurant_id_still_predicts(service):
    """The old KeyError -> HTTP 404 path is gone."""
    prediction = service.predict(
        hour=19,
        weekday=4,
        restaurant_id="a-postgres-uuid-absent-from-the-parquet",
    )

    assert prediction.busyness_level == 1
    assert prediction.taxi_zone_id is None
    assert prediction.taxi_zone_source == "unresolved"
    assert prediction.feature_source == "imputed"


def test_prediction_works_with_no_restaurant_id_at_all(service):
    prediction = service.predict(hour=12, weekday=2)

    assert 0.0 <= prediction.busyness_score <= 1.0
    assert prediction.restaurant_id == ""


def test_unresolved_zone_uses_sentinel_category(service):
    """
    OneHotEncoder(handle_unknown="ignore") turns the sentinel into an
    all-zero vector, i.e. no zone fixed effect, rather than a wrong zone.
    """
    service.predict(hour=19, weekday=4, restaurant_id="absent")

    frame = service.stub.last_frame

    assert list(frame.columns) == MODEL_COLUMNS
    assert frame["taxi_zone_id"].iloc[0] == UNRESOLVED_TAXI_ZONE
    assert np.isnan(frame["ln_dropoff"].iloc[0])


# =========================================================
# Caller-supplied features
# =========================================================

def test_request_features_reach_the_model(service):
    service.predict(
        hour=19,
        weekday=4,
        restaurant_id="absent",
        features=RestaurantFeatures(
            typical_time_mid=75.0,
            rating=4.4,
            reviews=1280,
            estimated_area_sqft=2400.0,
            takeaway_ratio=0.35,
            taxi_zone_id=161,
            capacity=42,
        ),
    )

    row = service.stub.last_frame.iloc[0]

    assert row["typical_time_mid"] == 75.0
    assert row["rating"] == 4.4
    assert row["takeaway_ratio"] == 0.35
    assert row["taxi_zone_id"] == "161"
    assert row["ln_reviews"] == pytest.approx(np.log1p(1280))
    assert row["ln_area"] == pytest.approx(np.log(2400.0))


def test_capacity_comes_from_the_request(service):
    prediction = service.predict(
        hour=19,
        weekday=4,
        features=RestaurantFeatures(capacity=42),
    )

    assert prediction.capacity == 42


def test_partial_features_leave_the_rest_for_imputation(service):
    service.predict(
        hour=19,
        weekday=4,
        features=RestaurantFeatures(rating=4.4),
    )

    row = service.stub.last_frame.iloc[0]

    assert row["rating"] == 4.4
    assert np.isnan(row["typical_time_mid"])
    assert np.isnan(row["ln_area"])


def test_time_features_are_derived_from_hour_and_weekday(service):
    service.predict(hour=6, weekday=5)

    row = service.stub.last_frame.iloc[0]

    assert row["hour_sin"] == pytest.approx(np.sin(2 * np.pi * 6 / 24))
    assert row["hour_cos"] == pytest.approx(np.cos(2 * np.pi * 6 / 24))
    assert row["friday"] == 0
    assert row["saturday"] == 1
    assert row["sunday"] == 0


# =========================================================
# Resolution precedence
# =========================================================

def _restaurant_table():
    return pd.DataFrame(
        [
            {
                "restaurant_id": "in-table",
                "typical_time_mid": 30.0,
                "rating": 3.0,
                "reviews": 10.0,
                "estimated_area_sqft": 500.0,
                "takeaway_ratio": 0.9,
                "taxi_zone_id": 90.0,
                "capacity": 8.0,
            }
        ]
    ).set_index("restaurant_id", drop=False)


def test_request_values_win_over_the_feature_table(service):
    service.restaurant_features = _restaurant_table()

    service.predict(
        hour=19,
        weekday=4,
        restaurant_id="in-table",
        features=RestaurantFeatures(rating=4.9, taxi_zone_id=161),
    )

    row = service.stub.last_frame.iloc[0]

    assert row["rating"] == 4.9          # request
    assert row["taxi_zone_id"] == "161"  # request
    assert row["typical_time_mid"] == 30.0  # fell back to the table


def test_feature_table_fills_gaps_when_request_is_silent(service):
    service.restaurant_features = _restaurant_table()

    prediction = service.predict(
        hour=19,
        weekday=4,
        restaurant_id="in-table",
    )

    row = service.stub.last_frame.iloc[0]

    assert row["rating"] == 3.0
    assert row["taxi_zone_id"] == "90"
    assert prediction.taxi_zone_source == "feature_table"
    assert prediction.feature_source == "feature_table"
    assert prediction.capacity == 8


def test_taxi_dropoffs_override_bypasses_lookup(service):
    prediction = service.predict(
        hour=19,
        weekday=4,
        taxi_dropoffs_override=250.0,
        features=RestaurantFeatures(taxi_zone_id=161),
    )

    row = service.stub.last_frame.iloc[0]

    assert prediction.taxi_dropoffs_1h == 250.0
    assert row["ln_dropoff"] == pytest.approx(np.log1p(250.0))


def test_negative_taxi_override_is_rejected(service):
    with pytest.raises(ValueError):
        service.predict(hour=19, weekday=4, taxi_dropoffs_override=-1.0)


@pytest.mark.parametrize("hour,weekday", [(24, 0), (-1, 0), (0, 7), (0, -1)])
def test_out_of_range_time_is_rejected(service, hour, weekday):
    with pytest.raises(ValueError):
        service.predict(hour=hour, weekday=weekday)


# =========================================================
# Taxi zone resolution from coordinates
# =========================================================

def test_coordinates_resolve_the_zone_when_not_supplied(service, monkeypatch):
    monkeypatch.setattr(
        BusynessModelService,
        "_resolve_zone_from_coordinates",
        staticmethod(lambda lat, lng: 161),
    )

    prediction = service.predict(
        hour=19,
        weekday=4,
        restaurant_id="absent",
        features=RestaurantFeatures(latitude=40.7614, longitude=-73.9776),
    )

    assert prediction.taxi_zone_id == "161"
    assert prediction.taxi_zone_source == "coordinates"


def test_spatial_lookup_failure_degrades_instead_of_raising(service, monkeypatch):
    """pyshp/pyproj or taxi_zones.zip being unavailable must not 500."""
    def explode(lat, lng):
        raise RuntimeError("shapefile unavailable")

    monkeypatch.setattr(model_service, "logger", model_service.logger)
    monkeypatch.setitem(
        __import__("sys").modules,
        "area_factor",
        type("m", (), {"resolve_taxi_zone": staticmethod(explode)}),
    )

    prediction = service.predict(
        hour=19,
        weekday=4,
        features=RestaurantFeatures(latitude=40.7614, longitude=-73.9776),
    )

    assert prediction.taxi_zone_source == "unresolved"
    assert prediction.taxi_zone_id is None
