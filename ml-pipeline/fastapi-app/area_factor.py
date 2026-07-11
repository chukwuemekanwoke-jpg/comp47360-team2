"""
Area busyness factor — given a restaurant's (lat, lng) and a target
(weekday, hour), estimates how busy that *area* of Manhattan tends to be,
using only real open data:

  - NYC TLC taxi dropoff density (manhattan_hourly_demand.csv), resolved to
    a taxi zone via point-in-polygon against the official taxi_zones
    shapefile.
  - NYC DOT pedestrian volume counts (manhattan_pedestrian_counts_raw.csv),
    a sparse set of 114 fixed count locations — nearest-neighbor averaged
    within a radius, time-of-day matched (AM/PM/midday).

No paid or scraped data. "Phone presence" / mobile-location foot-traffic
data was explicitly excluded — see project chat 2026-07-10 — because it
isn't available as open data; it would require a commercial vendor
(SafeGraph/Placer.ai/Veraset), not a scraper.

This produces the `taxi_dropoffs_1h` input that
ml-pipeline/fastapi-app/main.py's /predict/busyness already accepts but
nothing currently supplies, plus a foot-traffic score and a combined
0-1 area_busyness_factor.
"""

from __future__ import annotations

import ast
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import pandas as pd
import shapefile
from pyproj import Transformer

# Self-contained data/ dir (sibling of this file) rather than reaching into
# ../notebooks/ — Cloud Run's continuous-deploy build uses this directory as
# the Docker build context, which can't COPY files from outside itself.
# Source of truth is still ml-pipeline/notebooks/; re-copy here if it's ever
# refreshed (taxi_zones.zip, manhattan_hourly_demand.csv,
# manhattan_pedestrian_counts_raw.csv).
DATA_DIR = Path(__file__).resolve().parent / "data"
TAXI_ZONES_ZIP = DATA_DIR / "taxi_zones.zip"
HOURLY_DEMAND_CSV = DATA_DIR / "manhattan_hourly_demand.csv"
PEDESTRIAN_CSV = DATA_DIR / "manhattan_pedestrian_counts_raw.csv"

_WGS84_TO_STATEPLANE = Transformer.from_crs("EPSG:4326", "EPSG:2263", always_xy=True)

# Pedestrian count columns look like "may_07_am", "sept_18_pm", "may_12_md".
_PEDESTRIAN_PERIOD_SUFFIX = {"am": "_am", "pm": "_pm", "md": "_md"}

# Nearest pedestrian-count location search radius (meters). NYC DOT counts
# are sparse (114 points citywide), so this is generous by design.
_PEDESTRIAN_SEARCH_RADIUS_M = 600.0


def _period_for_hour(hour: int) -> str:
    if hour < 11:
        return "am"
    if hour >= 16:
        return "pm"
    return "md"


def _point_in_ring(x: float, y: float, ring: list[tuple[float, float]]) -> bool:
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y):
            x_intersect = (xj - xi) * (y - yi) / (yj - yi) + xi
            if x < x_intersect:
                inside = not inside
        j = i
    return inside


@dataclass
class _TaxiZone:
    zone_id: int
    zone_name: str
    rings: list[list[tuple[float, float]]]  # each ring in State Plane feet
    bbox: tuple[float, float, float, float]


@lru_cache(maxsize=1)
def _load_taxi_zones() -> list[_TaxiZone]:
    if not TAXI_ZONES_ZIP.exists():
        raise FileNotFoundError(f"{TAXI_ZONES_ZIP} not found")
    # pyshp reads directly from a .zip containing a single shapefile set.
    sf = shapefile.Reader(str(TAXI_ZONES_ZIP))
    zones: list[_TaxiZone] = []
    for shape_rec in sf.shapeRecords():
        shape = shape_rec.shape
        rec = shape_rec.record
        parts = list(shape.parts) + [len(shape.points)]
        rings = [
            shape.points[parts[i]:parts[i + 1]] for i in range(len(parts) - 1)
        ]
        zones.append(
            _TaxiZone(
                zone_id=int(rec["LocationID"]),
                zone_name=str(rec["zone"]),
                rings=rings,
                bbox=tuple(shape.bbox),  # xmin, ymin, xmax, ymax
            )
        )
    return zones


def resolve_taxi_zone(lat: float, lng: float) -> tuple[int, str] | None:
    """Point-in-polygon lookup: WGS84 (lat, lng) -> (taxi_zone_id, zone_name)."""
    x, y = _WGS84_TO_STATEPLANE.transform(lng, lat)
    for zone in _load_taxi_zones():
        xmin, ymin, xmax, ymax = zone.bbox
        if not (xmin <= x <= xmax and ymin <= y <= ymax):
            continue
        for ring in zone.rings:
            if _point_in_ring(x, y, ring):
                return zone.zone_id, zone.zone_name
    return None


@lru_cache(maxsize=1)
def _load_zone_hour_profile() -> pd.DataFrame:
    """Mean dropoff_count per (taxi_zone_id, weekday, hour), averaged across
    all 12 months of source data — a stable weekly demand pattern rather
    than a single month's noise."""
    df = pd.read_csv(HOURLY_DEMAND_CSV)
    return (
        df.groupby(["taxi_zone_id", "weekday", "hour"])["dropoff_count"]
        .mean()
        .reset_index()
        .set_index(["taxi_zone_id", "weekday", "hour"])
    )


@lru_cache(maxsize=1)
def _zone_hour_stats() -> tuple[float, float]:
    """(min, max) dropoff_count across the whole profile, for 0-1 normalization."""
    profile = _load_zone_hour_profile()
    return float(profile["dropoff_count"].min()), float(profile["dropoff_count"].max())


def taxi_dropoffs_for(zone_id: int, weekday: int, hour: int) -> float | None:
    profile = _load_zone_hour_profile()
    key = (zone_id, weekday, hour)
    if key not in profile.index:
        return None
    return float(profile.loc[key, "dropoff_count"])


@dataclass
class _PedestrianPoint:
    lat: float
    lng: float
    street: str
    counts: dict[str, float]  # period ("am"/"pm"/"md") -> mean count across years


@lru_cache(maxsize=1)
def _load_pedestrian_points() -> list[_PedestrianPoint]:
    df = pd.read_csv(PEDESTRIAN_CSV)
    period_cols = {
        period: [c for c in df.columns if c.endswith(suffix)]
        for period, suffix in _PEDESTRIAN_PERIOD_SUFFIX.items()
    }

    points: list[_PedestrianPoint] = []
    for _, row in df.iterrows():
        geom = ast.literal_eval(row["the_geom"])  # {'type': 'Point', 'coordinates': [lng, lat]}
        lng, lat = geom["coordinates"]
        counts = {}
        for period, cols in period_cols.items():
            values = pd.to_numeric(row[cols], errors="coerce").dropna()
            if len(values):
                counts[period] = float(values.mean())
        points.append(_PedestrianPoint(lat=lat, lng=lng, street=str(row.get("street_nam", "")), counts=counts))
    return points


def _haversine_m(lat1, lng1, lat2, lng2) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@lru_cache(maxsize=1)
def _pedestrian_stats() -> tuple[float, float]:
    all_counts = [
        v for p in _load_pedestrian_points() for v in p.counts.values()
    ]
    return (min(all_counts), max(all_counts)) if all_counts else (0.0, 1.0)


def foot_traffic_for(lat: float, lng: float, hour: int) -> tuple[float | None, int]:
    """Returns (nearest-average count for this time period, sample count used).
    None if no pedestrian-count location falls within the search radius."""
    period = _period_for_hour(hour)
    nearby = []
    for p in _load_pedestrian_points():
        if period not in p.counts:
            continue
        d = _haversine_m(lat, lng, p.lat, p.lng)
        if d <= _PEDESTRIAN_SEARCH_RADIUS_M:
            nearby.append(p.counts[period])
    if not nearby:
        return None, 0
    return sum(nearby) / len(nearby), len(nearby)


def _normalize(value: float, lo: float, hi: float) -> float:
    if hi <= lo:
        return 0.5
    return max(0.0, min(1.0, (value - lo) / (hi - lo)))


@dataclass
class AreaFactor:
    taxi_zone_id: int | None
    taxi_zone_name: str | None
    taxi_dropoffs_1h: float | None
    foot_traffic_count: float | None
    foot_traffic_samples: int
    area_busyness_factor: float  # 0-1, combined signal
    confidence: float  # 0-1, based on how many real signals contributed


def get_area_factor(lat: float, lng: float, weekday: int, hour: int) -> AreaFactor:
    zone = resolve_taxi_zone(lat, lng)
    taxi_zone_id, taxi_zone_name = zone if zone else (None, None)

    dropoffs = taxi_dropoffs_for(taxi_zone_id, weekday, hour) if taxi_zone_id is not None else None
    foot_count, foot_samples = foot_traffic_for(lat, lng, hour)

    signals = []
    if dropoffs is not None:
        lo, hi = _zone_hour_stats()
        signals.append(_normalize(dropoffs, lo, hi))
    if foot_count is not None:
        lo, hi = _pedestrian_stats()
        signals.append(_normalize(foot_count, lo, hi))

    combined = sum(signals) / len(signals) if signals else 0.5
    confidence = len(signals) / 2.0

    return AreaFactor(
        taxi_zone_id=taxi_zone_id,
        taxi_zone_name=taxi_zone_name,
        taxi_dropoffs_1h=dropoffs,
        foot_traffic_count=foot_count,
        foot_traffic_samples=foot_samples,
        area_busyness_factor=round(combined, 4),
        confidence=round(confidence, 2),
    )
