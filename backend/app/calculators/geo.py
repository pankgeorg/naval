"""Geographic calculation utilities."""
import math
from dataclasses import dataclass


@dataclass
class LegClassification:
    leg_type: str
    eu_ets_coverage: float
    fueleu_coverage: float


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in nautical miles between two coordinates."""
    R_NM = 3440.065  # Earth radius in nautical miles
    lat1_r, lon1_r = math.radians(lat1), math.radians(lon1)
    lat2_r, lon2_r = math.radians(lat2), math.radians(lon2)

    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R_NM * c


def track_distance_nm(points: list[dict]) -> float:
    """Sum of haversine segments along an ordered track.
    Each point must have 'latitude' and 'longitude' keys.
    """
    total = 0.0
    for i in range(len(points) - 1):
        total += haversine(
            points[i]["latitude"], points[i]["longitude"],
            points[i + 1]["latitude"], points[i + 1]["longitude"],
        )
    return total


def great_circle_distance_nm(port_a: dict, port_b: dict) -> float:
    """Fallback when no track exists."""
    return haversine(
        port_a["latitude"], port_a["longitude"],
        port_b["latitude"], port_b["longitude"],
    )


def classify_leg(from_port: dict, to_port: dict) -> LegClassification:
    """Classify a voyage leg for EU ETS and FuelEU coverage.

    Args:
        from_port: dict with at least 'is_eu_eea' and 'is_outermost_region' keys
        to_port: dict with at least 'is_eu_eea' and 'is_outermost_region' keys
    """
    both_eu = from_port["is_eu_eea"] and to_port["is_eu_eea"]
    one_eu = from_port["is_eu_eea"] or to_port["is_eu_eea"]

    if both_eu:
        if from_port.get("is_outermost_region") or to_port.get("is_outermost_region"):
            return LegClassification("intra_eu_outermost", 0.5, 0.5)
        return LegClassification("intra_eu", 1.0, 1.0)
    elif one_eu:
        return LegClassification("extra_eu", 0.5, 0.5)
    else:
        return LegClassification("non_eu", 0.0, 0.0)
