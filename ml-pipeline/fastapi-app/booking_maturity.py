"""
Merchant maturation — blends the location-based busyness prior with the
restaurant's own observed booking history.

A newly onboarded merchant has no booking history, so its busyness score is
driven entirely by its location: the area prior (NYC taxi dropoffs + DOT
pedestrian counts, see area_factor.py) resolves from day 0 with nothing but
coordinates. Over the merchant's first MATURATION_DAYS on the platform the
model progressively shifts weight onto the venue's own confirmed bookings,
but only as fast as real evidence accumulates — the time ramp is damped by
a booking-volume shrinkage term so a 30-day-old venue with two bookings
doesn't swing to its own noisy history.

At full maturity the blend settles at BOOKING_WEIGHT_MAX on observed
bookings; the mapping signals (taxi + foot traffic) permanently retain the
remainder, so the area evidence is never fully discarded.
"""

from __future__ import annotations

MATURATION_DAYS = 30.0
# Bookings in the trailing window needed to earn half the evidence weight.
EVIDENCE_PSEUDO_COUNT = 20.0
# Mature equilibrium: 60% own-booking signal, 40% location/area signal.
BOOKING_WEIGHT_MAX = 0.6


def weekday_occurrences(days_since_onboarding: float) -> int:
    """How many times a given weekday occurred in the observed window —
    the trailing MATURATION_DAYS, clipped to the merchant's actual age."""
    window_days = max(1.0, min(days_since_onboarding, MATURATION_DAYS))
    return max(1, round(window_days / 7.0))


def observed_occupancy(
    same_bucket_bookings: int, days_since_onboarding: float, capacity: int
) -> float:
    """Occupancy proxy for one (weekday, hour) bucket: bookings landed in
    that bucket over the window, per weekday occurrence, per table."""
    slots = weekday_occurrences(days_since_onboarding) * max(1, capacity)
    return max(0.0, min(1.0, same_bucket_bookings / slots))


def booking_weight(days_since_onboarding: float, total_bookings_30d: int) -> float:
    """Weight given to the venue's own bookings vs the location prior.
    Ramps linearly over MATURATION_DAYS, damped by evidence volume, and
    capped at BOOKING_WEIGHT_MAX."""
    maturity = max(0.0, min(1.0, days_since_onboarding / MATURATION_DAYS))
    evidence = total_bookings_30d / (total_bookings_30d + EVIDENCE_PSEUDO_COUNT)
    return BOOKING_WEIGHT_MAX * maturity * evidence


def blend(location_prior: float, observed: float, weight: float) -> float:
    return max(0.0, min(1.0, (1.0 - weight) * location_prior + weight * observed))
