"""
flood_risk.py

Topography & Flood Risk Modeling (plan Phase 3.3):
- Samples the Copernicus GLO-90 Digital Elevation Model via the free
  Open-Meteo Elevation API (no API key required)
- Computes plot elevation, slope, and depression depth from a ring of
  surrounding sample points
- Derives a 0-100 Flood Susceptibility Index and a traffic-light band that
  complements the wetland proximity risk score

Design:
- Degrades gracefully to {"status": "unavailable", ...} when the elevation
  service is unreachable, so wetland screening never blocks on this
- All HTTP goes through a thin wrapper that tests can monkeypatch
- Results are cached in-process per rounded coordinate to keep the API snappy
"""

import math
import threading
from typing import Any, Dict, List, Optional, Tuple

import requests

ELEVATION_API_URL = "https://api.open-meteo.com/v1/elevation"
HTTP_TIMEOUT = 10  # seconds

METERS_PER_DEG_LAT = 111_320.0

# Index weights (must sum to 100)
W_SLOPE = 40          # steep land sheds water -> lower flood susceptibility
W_DEPRESSION = 40     # sunken land collects runoff -> higher susceptibility
W_VARIABILITY = 20    # flat, uneven terrain pools water

# Index -> band mapping (mirrors the risk scorecard traffic-light semantics)
BANDS = (
    (20, "Low"),
    (45, "Moderate"),
    (70, "Elevated"),
    (101, "High"),
)

_cache: Dict[Tuple[float, float], Dict[str, Any]] = {}
_cache_lock = threading.Lock()
_CACHE_MAX = 512


def _http_get_json(url: str) -> Dict[str, Any]:
    resp = requests.get(url, timeout=HTTP_TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def _cache_get(key: Tuple[float, float]) -> Optional[Dict[str, Any]]:
    with _cache_lock:
        return _cache.get(key)


def _cache_put(key: Tuple[float, float], value: Dict[str, Any]) -> None:
    with _cache_lock:
        if len(_cache) >= _CACHE_MAX:
            _cache.pop(next(iter(_cache)))
        _cache[key] = value


def _offset(lat: float, lon: float, dy_m: float, dx_m: float) -> Tuple[float, float]:
    """Shift a coordinate by metric offsets (small-distance equirectangular)."""
    new_lat = lat + dy_m / METERS_PER_DEG_LAT
    cos_lat = max(math.cos(math.radians(lat)), 0.01)
    new_lon = lon + dx_m / (METERS_PER_DEG_LAT * cos_lat)
    return round(new_lat, 6), round(new_lon, 6)


def _sample_points(lat: float, lon: float, half_width: float, half_length: float) -> List[Tuple[float, float]]:
    """
    Build a sampling grid: plot centre, the four plot corners, and an outer
    ring ~100 m beyond the plot for slope/depression context.
    """
    points: List[Tuple[float, float]] = [(round(lat, 6), round(lon, 6))]

    # Plot corners
    for sy in (-1, 1):
        for sx in (-1, 1):
            points.append(_offset(lat, lon, sy * half_length, sx * half_width))

    # Outer context ring ~100 m beyond the plot edges
    oy = half_length + 100
    ox = half_width + 100
    points.append(_offset(lat, lon, oy, 0))
    points.append(_offset(lat, lon, -oy, 0))
    points.append(_offset(lat, lon, 0, ox))
    points.append(_offset(lat, lon, 0, -ox))
    points.append(_offset(lat, lon, oy * 0.7, ox * 0.7))
    points.append(_offset(lat, lon, -oy * 0.7, -ox * 0.7))

    return points


def fetch_elevations(points: List[Tuple[float, float]]) -> Optional[List[float]]:
    """
    Query the Open-Meteo elevation API for a list of coordinates.

    Returns elevations in metres, or None when the service is unavailable.
    """
    lat_q = ",".join(str(p[0]) for p in points)
    lon_q = ",".join(str(p[1]) for p in points)
    try:
        data = _http_get_json(f"{ELEVATION_API_URL}?latitude={lat_q}&longitude={lon_q}")
    except Exception:
        return None

    elevations = data.get("elevation")
    if not isinstance(elevations, list) or len(elevations) != len(points):
        return None
    return [float(e) for e in elevations]

def _classify(index: float) -> str:
    for threshold, band in BANDS:
        if index < threshold:
            return band
    return "High"


def compute_flood_index(
    plot_elevations: List[float],
    context_elevations: List[float],
    sample_spacing_m: float,
) -> Dict[str, Any]:
    """
    Compute the Flood Susceptibility Index from plot and surrounding elevations.

    plot_elevations    : centre + corner samples (inside the plot)
    context_elevations : outer ring samples (up to ~150 m away)
    sample_spacing_m   : typical horizontal distance between samples
    """
    plot_mean = sum(plot_elevations) / len(plot_elevations)
    context_mean = sum(context_elevations) / len(context_elevations)
    # The context ring sits ~100 m beyond the plot edges; water must travel
    # roughly this far to reach the lowest surrounding sample.
    ring_distance = max(sample_spacing_m + 100.0, 1.0)

    # 1. Drainage component: how steeply can water descend from the plot to the
    #    lowest surrounding sample? A >=10 degree escape route means the plot
    #    sheds water; no descent at all means it pools (flat plain / pit).
    descent_m = max(max(plot_mean - e, 0.0) for e in context_elevations)
    descent_deg = math.degrees(math.atan2(descent_m, ring_distance))
    slope_component = 100.0 * (1.0 - min(descent_deg, 10.0) / 10.0)

    # 2. Depression component: how far the plot sits below its surroundings.
    depression_m = context_mean - plot_mean
    if depression_m <= 0:
        depression_component = 0.0
    else:
        # 5 m below surroundings ~= maximum susceptibility contribution
        depression_component = 100.0 * min(depression_m, 5.0) / 5.0

    # 3. Variability component: uneven plots pool water in local hollows.
    elevation_range = max(plot_elevations) - min(plot_elevations)
    variability_component = 100.0 * min(elevation_range, 10.0) / 10.0

    index = round(
        (W_SLOPE / 100.0) * slope_component
        + (W_DEPRESSION / 100.0) * depression_component
        + (W_VARIABILITY / 100.0) * variability_component
    )
    index = max(0, min(100, index))

    return {
        "elevation_m": round(plot_mean, 1),
        "surrounding_elevation_m": round(context_mean, 1),
        "max_slope_deg": round(descent_deg, 2),
        "depression_depth_m": round(max(depression_m, 0.0), 2),
        "elevation_range_m": round(elevation_range, 2),
        "susceptibility_index": index,
        "band": _classify(index),
        "components": {
            "slope": round(slope_component, 1),
            "depression": round(depression_component, 1),
            "variability": round(variability_component, 1),
        },
    }


def flood_risk_assessment(
    lat: float,
    lon: float,
    width_m: float = 30.0,
    length_m: float = 30.0,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """
    Full flood susceptibility assessment for a plot (plan Phase 3.3).

    Returns a dict with status "available" or "unavailable"; never raises.
    """
    try:
        lat_f, lon_f = float(lat), float(lon)
    except (TypeError, ValueError):
        return {"status": "unavailable", "reason": "invalid_coordinates"}

    if not (-90 <= lat_f <= 90 and -180 <= lon_f <= 180):
        return {"status": "unavailable", "reason": "invalid_coordinates"}

    key = (round(lat_f, 4), round(lon_f, 4), round(width_m), round(length_m))
    if use_cache:
        cached = _cache_get(key)
        if cached is not None:
            return dict(cached, cached=True)

    points = _sample_points(lat_f, lon_f, width_m / 2.0, length_m / 2.0)
    elevations = fetch_elevations(points)
    if elevations is None:
        result = {
            "status": "unavailable",
            "reason": "elevation_service_unreachable",
            "message": (
                "Flood modeling skipped: the Copernicus DEM elevation service "
                "could not be reached. Wetland screening is unaffected."
            ),
        }
        _cache_put(key, result)
        return result

    # Centre + 4 corners are inside the plot (indices 0-4); the rest form the ring
    plot_elevations = elevations[:5]
    context_elevations = elevations[5:]

    # Typical horizontal spacing between centre and corners
    spacing = math.hypot(width_m / 2.0, length_m / 2.0)

    core = compute_flood_index(plot_elevations, context_elevations, spacing)
    result = {
        "status": "available",
        "method": "Copernicus GLO-90 DEM via Open-Meteo Elevation API",
        "samples": len(points),
        **core,
    }
    _cache_put(key, result)
    return result
