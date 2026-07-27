from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


logger = logging.getLogger(__name__)


# =========================================================
# File paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

MODEL_PATH = BASE_DIR / "busyness_xgboost_pipeline.joblib"
RESTAURANT_FEATURES_PATH = DATA_DIR / "restaurant_features.parquet"
TAXI_FEATURES_PATH = DATA_DIR / "taxi_hourly_features.parquet"


# These names and their order must match the training pipeline's
# ColumnTransformer (numeric features first, then the categorical
# taxi_zone_id). scikit-learn validates feature names on transform.
MODEL_COLUMNS = [
    "hour_sin",
    "hour_cos",
    "friday",
    "saturday",
    "sunday",
    "typical_time_mid",
    "rating",
    "ln_reviews",
    "ln_area",
    "takeaway_ratio",
    "ln_dropoff",
    "taxi_zone_id",
]

# Restaurant-level features the caller may supply directly. Every one of
# these is imputed by the pipeline's SimpleImputer(strategy="median") when
# it arrives as NaN, so a partial payload degrades instead of failing.
RESTAURANT_FEATURE_FIELDS = (
    "typical_time_mid",
    "rating",
    "reviews",
    "estimated_area_sqft",
    "takeaway_ratio",
)

# Sentinel for a taxi zone we could not resolve. The training pipeline
# encodes taxi_zone_id with OneHotEncoder(handle_unknown="ignore"), so an
# unrecognised category becomes an all-zero vector — i.e. no zone fixed
# effect — rather than an error or a silently wrong zone.
UNRESOLVED_TAXI_ZONE = "unknown"

CLASS_LABELS = {
    0: "No Wait",
    1: "Queue Required",
    2: "Severe Queue",
}


# =========================================================
# Caller-supplied restaurant features
# =========================================================

@dataclass(frozen=True)
class RestaurantFeatures:
    """
    Restaurant attributes supplied by the calling service.

    The API gateway owns the restaurant record, so it is the authoritative
    source for these. Anything left as None falls back to the local feature
    table (when the restaurant happens to be in it) and then to the model
    pipeline's own median imputation.
    """

    typical_time_mid: float | None = None
    rating: float | None = None
    reviews: float | None = None
    estimated_area_sqft: float | None = None
    takeaway_ratio: float | None = None
    taxi_zone_id: int | None = None
    capacity: int | None = None
    latitude: float | None = None
    longitude: float | None = None


# =========================================================
# Prediction result
# =========================================================

@dataclass(frozen=True)
class BusynessPrediction:
    restaurant_id: str
    busyness_level: int
    busyness_label: str

    # Continuous compatibility score in the range 0–1.
    # Calculated from the expected ordinal class:
    # (P(class 1) + 2 * P(class 2)) / 2
    busyness_score: float

    confidence: float
    class_probabilities: dict[str, float]
    taxi_dropoffs_1h: float | None
    taxi_zone_id: str | None
    capacity: int | None

    # Provenance, so a caller can tell a real prediction apart from one
    # resting on imputed medians without turning on debug logging.
    taxi_zone_source: str = "unresolved"
    feature_source: str = "imputed"


# =========================================================
# typical_time_mid derivation
# =========================================================

_TYPICAL_TIME_PATTERN = re.compile(
    r"spend\s+(\d+(?:\.\d+)?)\s*"
    r"(min|mins|minute|minutes|hr|hrs|hour|hours)"
    r"(?:\s+to\s+(\d+(?:\.\d+)?)\s*"
    r"(min|mins|minute|minutes|hr|hrs|hour|hours))?"
)

_HOUR_UNITS = {"hr", "hrs", "hour", "hours"}
_MINUTE_UNITS = {"min", "mins", "minute", "minutes"}


def _to_minutes(value: float, unit: str) -> float:
    if unit in _HOUR_UNITS:
        return value * 60.0
    if unit in _MINUTE_UNITS:
        return value
    return float("nan")


def parse_typical_time(value: Any) -> float:
    """
    Convert Google's "People typically spend 1-1.5 hours here" prose into a
    midpoint in minutes.

    Ported verbatim in behaviour from the training notebook so inference
    derives typical_time_mid exactly the way training did. The exported
    restaurant_features.parquet ships the raw typical_time_spent text, so
    without this the column the model needs would not exist.

    Known limitation, deliberately preserved: the notebook's pattern matches
    "45 min to 2 hr" but not the hyphenated "1.5-4 hours", which leaves 687
    of the 1741 rows that have text unparsed. Those rows were dropped from
    training by the same regex, so widening it here alone would feed the
    model values it never saw at fit time. Fixing it means updating the
    notebook and retraining — worth doing, since it would lift usable
    training coverage from 1054 to 1741 restaurants.
    """
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return float("nan")

    match = _TYPICAL_TIME_PATTERN.search(str(value).lower().strip())

    if not match:
        return float("nan")

    low = _to_minutes(float(match.group(1)), match.group(2))

    if match.group(3) is None:
        return low

    high = _to_minutes(float(match.group(3)), match.group(4))

    return (low + high) / 2.0


# =========================================================
# Model service
# =========================================================

class BusynessModelService:
    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        restaurant_features_path: Path = RESTAURANT_FEATURES_PATH,
        taxi_features_path: Path = TAXI_FEATURES_PATH,
    ) -> None:
        self.model_path = model_path
        self.restaurant_features_path = restaurant_features_path
        self.taxi_features_path = taxi_features_path

        # Only the model itself is load-bearing. The Parquet tables are a
        # convenience fallback for callers that cannot supply features yet,
        # so a missing or malformed one degrades the prediction rather than
        # stopping the service from booting.
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Required ML model file is missing: {self.model_path}"
            )

        self.model = joblib.load(self.model_path)

        self.restaurant_features = self._safe_load(
            self._load_restaurant_features,
            self.restaurant_features_path,
            "restaurant features",
        )

        self.taxi_features = self._safe_load(
            self._load_taxi_features,
            self.taxi_features_path,
            "taxi hourly features",
        )

    # -----------------------------------------------------
    # Data loading
    # -----------------------------------------------------

    @staticmethod
    def _safe_load(loader, path: Path, description: str) -> pd.DataFrame | None:
        if not path.exists():
            logger.warning(
                "Optional %s table not found at %s — predictions will rely on "
                "caller-supplied features.",
                description,
                path,
            )
            return None

        try:
            return loader(path)
        except Exception as exc:
            logger.warning(
                "Optional %s table at %s could not be loaded (%s) — predictions "
                "will rely on caller-supplied features.",
                description,
                path,
                exc,
            )
            return None

    @staticmethod
    def _load_restaurant_features(path: Path) -> pd.DataFrame:
        df = pd.read_parquet(path).copy()

        if "restaurant_id" not in df.columns:
            raise ValueError(
                "restaurant_features.parquet is missing the restaurant_id column"
            )

        df["restaurant_id"] = df["restaurant_id"].astype(str)

        # The export ships the raw prose, not the numeric midpoint the model
        # was trained on. Derive it rather than requiring a re-export.
        if "typical_time_mid" not in df.columns:
            if "typical_time_spent" in df.columns:
                df["typical_time_mid"] = df["typical_time_spent"].apply(
                    parse_typical_time
                )
            else:
                df["typical_time_mid"] = np.nan

        # Absent optional columns become NaN so lookups stay uniform and the
        # pipeline's imputer handles them.
        for column in RESTAURANT_FEATURE_FIELDS + ("capacity", "taxi_zone_id"):
            if column not in df.columns:
                df[column] = np.nan

        df = df.drop_duplicates(subset="restaurant_id", keep="first")

        return df.set_index("restaurant_id", drop=False)

    @staticmethod
    def _load_taxi_features(path: Path) -> pd.DataFrame:
        df = pd.read_parquet(path).copy()

        required_columns = {
            "taxi_zone_id",
            "weekday",
            "hour",
            "dropoff_count",
        }

        missing_columns = sorted(required_columns - set(df.columns))

        if missing_columns:
            raise ValueError(
                "taxi_hourly_features.parquet is missing columns: "
                + ", ".join(missing_columns)
            )

        for column in ("taxi_zone_id", "weekday", "hour"):
            df[column] = pd.to_numeric(df[column], errors="raise").astype(int)

        df["dropoff_count"] = pd.to_numeric(df["dropoff_count"], errors="coerce")

        if "month" in df.columns:
            df["month"] = pd.to_numeric(df["month"], errors="raise").astype(int)

        return df.dropna(subset=["dropoff_count"])

    # -----------------------------------------------------
    # Public information
    # -----------------------------------------------------

    @property
    def restaurant_count(self) -> int:
        return 0 if self.restaurant_features is None else len(self.restaurant_features)

    @property
    def model_classes(self) -> list[int]:
        classes = getattr(self.model, "classes_", None)

        if classes is None:
            named_steps = getattr(self.model, "named_steps", {})
            estimator = named_steps.get("model")
            classes = getattr(estimator, "classes_", None)

        if classes is None:
            return [0, 1, 2]

        return [int(value) for value in classes]

    def has_restaurant(self, restaurant_id: str) -> bool:
        if self.restaurant_features is None:
            return False
        return str(restaurant_id) in self.restaurant_features.index

    # -----------------------------------------------------
    # Restaurant lookup
    # -----------------------------------------------------

    def lookup_restaurant(self, restaurant_id: str | None) -> pd.Series | None:
        """
        Best-effort lookup in the local feature table.

        Returns None for an unknown id instead of raising: the caller's own
        record is the source of truth, and this table only covers the
        restaurants that happened to be present when it was exported.
        """
        if restaurant_id is None or self.restaurant_features is None:
            return None

        key = str(restaurant_id)

        if key not in self.restaurant_features.index:
            return None

        return self.restaurant_features.loc[key]

    # -----------------------------------------------------
    # Taxi lookup
    # -----------------------------------------------------

    def get_taxi_dropoffs(
        self,
        taxi_zone_id: int,
        weekday: int,
        hour: int,
        month: int | None = None,
    ) -> float | None:
        if not 0 <= weekday <= 6:
            raise ValueError("weekday must be between 0 and 6")

        if not 0 <= hour <= 23:
            raise ValueError("hour must be between 0 and 23")

        if month is not None and not 1 <= month <= 12:
            raise ValueError("month must be between 1 and 12")

        taxi = self.taxi_features

        if taxi is None:
            return None

        mask = (
            (taxi["taxi_zone_id"] == int(taxi_zone_id))
            & (taxi["weekday"] == int(weekday))
            & (taxi["hour"] == int(hour))
        )

        # Use exact month when the Parquet file contains monthly data.
        if month is not None and "month" in taxi.columns:
            monthly_match = taxi.loc[
                mask & (taxi["month"] == int(month)),
                "dropoff_count",
            ]

            if not monthly_match.empty:
                return float(monthly_match.mean())

        # Fallback: average the matching weekday/hour across months.
        fallback_match = taxi.loc[mask, "dropoff_count"]

        if not fallback_match.empty:
            return float(fallback_match.mean())

        # Last fallback: average demand for that taxi zone.
        zone_match = taxi.loc[
            taxi["taxi_zone_id"] == int(taxi_zone_id),
            "dropoff_count",
        ]

        if not zone_match.empty:
            return float(zone_match.mean())

        # Unknown zone: use the Manhattan-wide median instead of failing.
        return float(taxi["dropoff_count"].median())

    # -----------------------------------------------------
    # Taxi zone resolution
    # -----------------------------------------------------

    @staticmethod
    def _resolve_zone_from_coordinates(
        latitude: float | None,
        longitude: float | None,
    ) -> int | None:
        """
        Point-in-polygon lookup against the official TLC taxi zone shapefile.

        Imported lazily and defensively: it pulls in pyshp/pyproj and reads
        taxi_zones.zip, and none of that should be able to take down an
        otherwise serviceable prediction.
        """
        if latitude is None or longitude is None:
            return None

        try:
            from area_factor import resolve_taxi_zone

            zone = resolve_taxi_zone(float(latitude), float(longitude))
        except Exception as exc:
            logger.warning("Spatial taxi-zone lookup unavailable: %s", exc)
            return None

        return None if zone is None else int(zone[0])

    def resolve_taxi_zone(
        self,
        features: RestaurantFeatures,
        restaurant_row: pd.Series | None,
    ) -> tuple[int | None, str]:
        """
        Resolve a taxi zone without depending on the restaurant being present
        in the local feature table. Returns (zone_id, source).
        """
        if features.taxi_zone_id is not None:
            return int(features.taxi_zone_id), "request"

        spatial_zone = self._resolve_zone_from_coordinates(
            features.latitude,
            features.longitude,
        )

        if spatial_zone is not None:
            return spatial_zone, "coordinates"

        if restaurant_row is not None:
            table_zone = pd.to_numeric(
                restaurant_row.get("taxi_zone_id"),
                errors="coerce",
            )

            if not pd.isna(table_zone):
                return int(table_zone), "feature_table"

        return None, "unresolved"

    # -----------------------------------------------------
    # Feature engineering
    # -----------------------------------------------------

    @staticmethod
    def _numeric(value: Any) -> float:
        """Coerce to float, mapping anything unusable to NaN."""
        if value is None:
            return float("nan")

        numeric_value = pd.to_numeric(value, errors="coerce")

        return float("nan") if pd.isna(numeric_value) else float(numeric_value)

    @classmethod
    def _safe_log(cls, value: Any) -> float:
        numeric_value = cls._numeric(value)

        if np.isnan(numeric_value) or numeric_value <= 0:
            return float("nan")

        return float(np.log(numeric_value))

    @classmethod
    def _safe_log1p(cls, value: Any) -> float:
        numeric_value = cls._numeric(value)

        if np.isnan(numeric_value) or numeric_value < 0:
            return float("nan")

        return float(np.log1p(numeric_value))

    def _resolve_restaurant_fields(
        self,
        features: RestaurantFeatures,
        restaurant_row: pd.Series | None,
    ) -> tuple[dict[str, float], str]:
        """
        Merge caller-supplied values over the local feature table, tracking
        where each one came from so the response can report it.
        """
        resolved: dict[str, float] = {}
        sources: set[str] = set()

        for field in RESTAURANT_FEATURE_FIELDS:
            requested = self._numeric(getattr(features, field))

            if not np.isnan(requested):
                resolved[field] = requested
                sources.add("request")
                continue

            from_table = (
                self._numeric(restaurant_row.get(field))
                if restaurant_row is not None
                else float("nan")
            )

            if not np.isnan(from_table):
                resolved[field] = from_table
                sources.add("feature_table")
                continue

            # Left as NaN — the pipeline's median imputer fills it in.
            resolved[field] = float("nan")
            sources.add("imputed")

        if sources == {"request"}:
            source = "request"
        elif sources == {"feature_table"}:
            source = "feature_table"
        elif sources == {"imputed"}:
            source = "imputed"
        else:
            source = "mixed"

        return resolved, source

    def build_features(
        self,
        hour: int,
        weekday: int,
        month: int | None = None,
        taxi_dropoffs_override: float | None = None,
        restaurant_id: str | None = None,
        features: RestaurantFeatures | None = None,
    ) -> tuple[pd.DataFrame, dict[str, Any]]:
        if not 0 <= hour <= 23:
            raise ValueError("hour must be between 0 and 23")

        if not 0 <= weekday <= 6:
            raise ValueError("weekday must be between 0 and 6")

        if taxi_dropoffs_override is not None and taxi_dropoffs_override < 0:
            raise ValueError("taxi_dropoffs_override cannot be negative")

        features = features or RestaurantFeatures()
        restaurant_row = self.lookup_restaurant(restaurant_id)

        taxi_zone_id, taxi_zone_source = self.resolve_taxi_zone(
            features,
            restaurant_row,
        )

        if taxi_dropoffs_override is not None:
            dropoff_count = float(taxi_dropoffs_override)
        elif taxi_zone_id is not None:
            dropoff_count = self.get_taxi_dropoffs(
                taxi_zone_id=taxi_zone_id,
                weekday=weekday,
                hour=hour,
                month=month,
            )
        else:
            dropoff_count = None

        restaurant_fields, feature_source = self._resolve_restaurant_fields(
            features,
            restaurant_row,
        )

        capacity = features.capacity

        if capacity is None and restaurant_row is not None:
            table_capacity = self._numeric(restaurant_row.get("capacity"))
            capacity = None if np.isnan(table_capacity) else int(table_capacity)

        feature_row = {
            "hour_sin": np.sin(2 * np.pi * hour / 24),
            "hour_cos": np.cos(2 * np.pi * hour / 24),

            # API convention:
            # Monday=0, Friday=4, Saturday=5, Sunday=6.
            "friday": int(weekday == 4),
            "saturday": int(weekday == 5),
            "sunday": int(weekday == 6),

            "typical_time_mid": restaurant_fields["typical_time_mid"],
            "rating": restaurant_fields["rating"],
            "ln_reviews": self._safe_log1p(restaurant_fields["reviews"]),
            "ln_area": self._safe_log(restaurant_fields["estimated_area_sqft"]),
            "takeaway_ratio": restaurant_fields["takeaway_ratio"],
            "ln_dropoff": self._safe_log1p(dropoff_count),

            # The training pipeline treats taxi_zone_id as categorical and
            # encodes unseen values as an all-zero vector.
            "taxi_zone_id": (
                UNRESOLVED_TAXI_ZONE
                if taxi_zone_id is None
                else str(taxi_zone_id)
            ),
        }

        frame = pd.DataFrame([feature_row], columns=MODEL_COLUMNS)

        context = {
            "dropoff_count": dropoff_count,
            "taxi_zone_id": taxi_zone_id,
            "taxi_zone_source": taxi_zone_source,
            "feature_source": feature_source,
            "capacity": capacity,
        }

        return frame, context

    # -----------------------------------------------------
    # Prediction
    # -----------------------------------------------------

    def predict(
        self,
        hour: int,
        weekday: int,
        month: int | None = None,
        taxi_dropoffs_override: float | None = None,
        restaurant_id: str | None = None,
        features: RestaurantFeatures | None = None,
    ) -> BusynessPrediction:
        frame, context = self.build_features(
            hour=hour,
            weekday=weekday,
            month=month,
            taxi_dropoffs_override=taxi_dropoffs_override,
            restaurant_id=restaurant_id,
            features=features,
        )

        probabilities = np.asarray(
            self.model.predict_proba(frame)[0],
            dtype=float,
        )

        classes = self.model_classes

        if len(classes) != len(probabilities):
            raise RuntimeError(
                "Model classes do not match predict_proba output"
            )

        probability_by_class = {
            int(class_id): float(probability)
            for class_id, probability in zip(
                classes,
                probabilities,
            )
        }

        # Ensure all three business classes are represented.
        p0 = probability_by_class.get(0, 0.0)
        p1 = probability_by_class.get(1, 0.0)
        p2 = probability_by_class.get(2, 0.0)

        predicted_level = max(
            probability_by_class,
            key=probability_by_class.get,
        )

        confidence = probability_by_class[predicted_level]

        # Converts the ordinal probability distribution to a 0–1 score.
        continuous_score = (p1 + 2.0 * p2) / 2.0

        dropoff_count = context["dropoff_count"]
        taxi_zone_id = context["taxi_zone_id"]

        return BusynessPrediction(
            restaurant_id=str(restaurant_id) if restaurant_id is not None else "",
            busyness_level=int(predicted_level),
            busyness_label=CLASS_LABELS.get(
                int(predicted_level),
                f"Class {predicted_level}",
            ),
            busyness_score=round(
                float(np.clip(continuous_score, 0.0, 1.0)),
                4,
            ),
            confidence=round(
                float(np.clip(confidence, 0.0, 1.0)),
                4,
            ),
            class_probabilities={
                "no_wait": round(p0, 4),
                "queue_required": round(p1, 4),
                "severe_queue": round(p2, 4),
            },
            taxi_dropoffs_1h=(
                round(dropoff_count, 4) if dropoff_count is not None else None
            ),
            taxi_zone_id=(
                str(taxi_zone_id) if taxi_zone_id is not None else None
            ),
            capacity=context["capacity"],
            taxi_zone_source=context["taxi_zone_source"],
            feature_source=context["feature_source"],
        )


# =========================================================
# Singleton accessor
# =========================================================

@lru_cache(maxsize=1)
def get_model_service() -> BusynessModelService:
    """
    Load the model and feature files once per API process.

    Keeping construction behind a cached function also makes unit tests
    able to replace or clear the service without reloading files for every
    request.
    """
    return BusynessModelService()
