from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


# =========================================================
# File paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

MODEL_PATH = BASE_DIR / "busyness_xgboost_pipeline.joblib"
RESTAURANT_FEATURES_PATH = DATA_DIR / "restaurant_features.parquet"
TAXI_FEATURES_PATH = DATA_DIR / "taxi_hourly_features.parquet"


# These names and their order must match the training notebook.
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

CLASS_LABELS = {
    0: "No Wait",
    1: "Queue Required",
    2: "Severe Queue",
}


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
    taxi_dropoffs_1h: float
    taxi_zone_id: str
    capacity: int | None


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

        self._validate_files()

        self.model = joblib.load(self.model_path)

        self.restaurant_features = self._load_restaurant_features(
            self.restaurant_features_path
        )

        self.taxi_features = self._load_taxi_features(
            self.taxi_features_path
        )

    # -----------------------------------------------------
    # File validation
    # -----------------------------------------------------

    def _validate_files(self) -> None:
        required_files = [
            self.model_path,
            self.restaurant_features_path,
            self.taxi_features_path,
        ]

        missing_files = [
            str(path)
            for path in required_files
            if not path.exists()
        ]

        if missing_files:
            raise FileNotFoundError(
                "Required ML inference files are missing: "
                + ", ".join(missing_files)
            )

    # -----------------------------------------------------
    # Data loading
    # -----------------------------------------------------

    @staticmethod
    def _load_restaurant_features(path: Path) -> pd.DataFrame:
        df = pd.read_parquet(path)

        required_columns = {
            "restaurant_id",
            "typical_time_mid",
            "rating",
            "reviews",
            "estimated_area_sqft",
            "takeaway_ratio",
            "taxi_zone_id",
        }

        missing_columns = sorted(required_columns - set(df.columns))

        if missing_columns:
            raise ValueError(
                "restaurant_features.parquet is missing columns: "
                + ", ".join(missing_columns)
            )

        df = df.copy()

        # Ensure IDs have a stable representation for API lookup.
        df["restaurant_id"] = df["restaurant_id"].astype(str)
        df["taxi_zone_id"] = df["taxi_zone_id"].astype("string")

        duplicate_ids = df["restaurant_id"].duplicated(keep=False)

        if duplicate_ids.any():
            duplicate_values = (
                df.loc[duplicate_ids, "restaurant_id"]
                .drop_duplicates()
                .head(10)
                .tolist()
            )

            raise ValueError(
                "restaurant_features.parquet must contain one row "
                "per restaurant_id. Duplicate examples: "
                f"{duplicate_values}"
            )

        return df.set_index("restaurant_id", drop=False)

    @staticmethod
    def _load_taxi_features(path: Path) -> pd.DataFrame:
        df = pd.read_parquet(path)

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

        df = df.copy()

        df["taxi_zone_id"] = pd.to_numeric(
            df["taxi_zone_id"],
            errors="raise",
        ).astype(int)

        df["weekday"] = pd.to_numeric(
            df["weekday"],
            errors="raise",
        ).astype(int)

        df["hour"] = pd.to_numeric(
            df["hour"],
            errors="raise",
        ).astype(int)

        df["dropoff_count"] = pd.to_numeric(
            df["dropoff_count"],
            errors="coerce",
        )

        if "month" in df.columns:
            df["month"] = pd.to_numeric(
                df["month"],
                errors="raise",
            ).astype(int)

        df = df.dropna(subset=["dropoff_count"])

        return df

    # -----------------------------------------------------
    # Public information
    # -----------------------------------------------------

    @property
    def restaurant_count(self) -> int:
        return len(self.restaurant_features)

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
        return str(restaurant_id) in self.restaurant_features.index

    # -----------------------------------------------------
    # Restaurant lookup
    # -----------------------------------------------------

    def get_restaurant(self, restaurant_id: str) -> pd.Series:
        restaurant_key = str(restaurant_id)

        if restaurant_key not in self.restaurant_features.index:
            raise KeyError(
                f"Unknown restaurant_id: {restaurant_key}"
            )

        return self.restaurant_features.loc[restaurant_key]

    # -----------------------------------------------------
    # Taxi lookup
    # -----------------------------------------------------

    def get_taxi_dropoffs(
        self,
        taxi_zone_id: int,
        weekday: int,
        hour: int,
        month: int | None = None,
    ) -> float:
        if not 0 <= weekday <= 6:
            raise ValueError("weekday must be between 0 and 6")

        if not 0 <= hour <= 23:
            raise ValueError("hour must be between 0 and 23")

        if month is not None and not 1 <= month <= 12:
            raise ValueError("month must be between 1 and 12")

        taxi = self.taxi_features

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
    # Feature engineering
    # -----------------------------------------------------

    @staticmethod
    def _safe_log(value: Any) -> float:
        numeric_value = pd.to_numeric(value, errors="coerce")

        if pd.isna(numeric_value) or numeric_value <= 0:
            return np.nan

        return float(np.log(numeric_value))

    @staticmethod
    def _safe_log1p(value: Any) -> float:
        numeric_value = pd.to_numeric(value, errors="coerce")

        if pd.isna(numeric_value) or numeric_value < 0:
            return np.nan

        return float(np.log1p(numeric_value))

    def build_features(
        self,
        restaurant_id: str,
        hour: int,
        weekday: int,
        month: int | None = None,
        taxi_dropoffs_override: float | None = None,
    ) -> tuple[pd.DataFrame, float, pd.Series]:
        if not 0 <= hour <= 23:
            raise ValueError("hour must be between 0 and 23")

        if not 0 <= weekday <= 6:
            raise ValueError("weekday must be between 0 and 6")

        restaurant = self.get_restaurant(restaurant_id)

        taxi_zone_value = pd.to_numeric(
            restaurant["taxi_zone_id"],
            errors="coerce",
        )

        if pd.isna(taxi_zone_value):
            raise ValueError(
                f"Restaurant {restaurant_id} has no valid taxi_zone_id"
            )

        taxi_zone_id = int(taxi_zone_value)

        if taxi_dropoffs_override is not None:
            if taxi_dropoffs_override < 0:
                raise ValueError(
                    "taxi_dropoffs_override cannot be negative"
                )

            dropoff_count = float(taxi_dropoffs_override)
        else:
            dropoff_count = self.get_taxi_dropoffs(
                taxi_zone_id=taxi_zone_id,
                weekday=weekday,
                hour=hour,
                month=month,
            )

        feature_row = {
            "hour_sin": np.sin(2 * np.pi * hour / 24),
            "hour_cos": np.cos(2 * np.pi * hour / 24),

            # API convention:
            # Monday=0, Friday=4, Saturday=5, Sunday=6.
            "friday": int(weekday == 4),
            "saturday": int(weekday == 5),
            "sunday": int(weekday == 6),

            "typical_time_mid": restaurant["typical_time_mid"],
            "rating": restaurant["rating"],
            "ln_reviews": self._safe_log1p(
                restaurant["reviews"]
            ),
            "ln_area": self._safe_log(
                restaurant["estimated_area_sqft"]
            ),
            "takeaway_ratio": restaurant["takeaway_ratio"],
            "ln_dropoff": self._safe_log1p(dropoff_count),

            # The training pipeline treats taxi_zone_id as categorical.
            "taxi_zone_id": str(taxi_zone_id),
        }

        features = pd.DataFrame(
            [feature_row],
            columns=MODEL_COLUMNS,
        )

        return features, dropoff_count, restaurant

    # -----------------------------------------------------
    # Prediction
    # -----------------------------------------------------

    def predict(
        self,
        restaurant_id: str,
        hour: int,
        weekday: int,
        month: int | None = None,
        taxi_dropoffs_override: float | None = None,
    ) -> BusynessPrediction:
        features, dropoff_count, restaurant = self.build_features(
            restaurant_id=restaurant_id,
            hour=hour,
            weekday=weekday,
            month=month,
            taxi_dropoffs_override=taxi_dropoffs_override,
        )

        probabilities = np.asarray(
            self.model.predict_proba(features)[0],
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

        capacity_value = pd.to_numeric(
            restaurant.get("capacity"),
            errors="coerce",
        )

        capacity = (
            int(capacity_value)
            if not pd.isna(capacity_value)
            else None
        )

        return BusynessPrediction(
            restaurant_id=str(restaurant_id),
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
            taxi_dropoffs_1h=round(dropoff_count, 4),
            taxi_zone_id=str(
                int(
                    pd.to_numeric(
                        restaurant["taxi_zone_id"],
                        errors="raise",
                    )
                )
            ),
            capacity=capacity,
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
