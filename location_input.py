"""
location_input.py

Buyer-friendly plot location input (plan Phase 1.1):
- Parsing coordinates out of Google Maps, WhatsApp, Apple Maps, and geo: links
- Plain decimal and DMS coordinate strings
- Landmark lookup via Nominatim for Uganda and Kenya
- Plot geometry (Point and metric-accurate Polygon footprint)
"""

import re
import geopandas as gpd
import requests
from shapely.geometry import Point, box
from geo_utils import estimate_utm_crs_for

INPUT_METHODS = [
    ("🔍 Search Landmark / Town", "search"),
    ("🔗 Paste Link / Coordinates", "link"),
    ("🗺️ Interactive Map / Pin", "map"),
]

# Regex patterns for various link and coordinate formats
_PATTERNS = [
    # Google Maps /place/.../data=!3d0.3476!4d32.5825
    re.compile(r"!3d(-?\d+(?:\.\d+)?)(?:[^\d\-]*)!4d(-?\d+(?:\.\d+)?)"),
    # Google Maps @lat,lon
    re.compile(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
    # ?q=loc:lat,lon or ?q=lat,lon or ?ll=lat,lon
    re.compile(r"[?&](?:q(?:=loc:|=)?|ll=)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
    # geo:lat,lon
    re.compile(r"geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
    # Plain lat, lon or lat;lon with boundary checks
    re.compile(r"(?:^|[^\d\.-])(-?\d{1,3}(?:\.\d+)?)[,\s;]+(-?\d{1,3}(?:\.\d+)?)(?:[^\d\.-]|$)"),
]

_DMS_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*([NSEWnsew])\s+"
    r"(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*([NSEWnsew])"
)


def parse_dms(text):
    """Parse degrees, minutes, seconds string into (lat, lon)."""
    if not text or not isinstance(text, str):
        return None
    match = _DMS_PATTERN.search(text.strip())
    if not match:
        return None

    d1, m1, s1, h1, d2, m2, s2, h2 = match.groups()
    val1 = float(d1) + float(m1) / 60.0 + float(s1) / 3600.0
    val2 = float(d2) + float(m2) / 60.0 + float(s2) / 3600.0

    h1 = h1.upper()
    h2 = h2.upper()

    lat = -val1 if h1 == "S" else val1
    lon = -val2 if h2 == "W" else val2

    # If first hemisphere was E/W and second was N/S, swap
    if h1 in ("E", "W") and h2 in ("N", "S"):
        lat, lon = -val2 if h2 == "S" else val2, -val1 if h1 == "W" else val1

    if -90 <= lat <= 90 and -180 <= lon <= 180:
        return lat, lon
    return None


def parse_coordinates_from_text(text):
    """Extract (lat, lon) from Google Maps / WhatsApp / Apple Maps links or plain strings.

    Returns:
        (lat, lon) tuple of floats, or None if no valid coordinates found.
    """
    if not text or not isinstance(text, str):
        return None

    cleaned = text.strip()
    if not cleaned:
        return None

    # Check DMS first
    dms_result = parse_dms(cleaned)
    if dms_result:
        return dms_result

    for pattern in _PATTERNS:
        match = pattern.search(cleaned)
        if match:
            try:
                lat = float(match.group(1))
                lon = float(match.group(2))
                if -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0:
                    return lat, lon
            except (ValueError, IndexError):
                continue

    return None


def lookup_place(query, session=None):
    """Search for a landmark or town using Nominatim geocoding (Uganda & Kenya focus).

    Returns:
        dict with keys 'lat', 'lon', 'display_name' or None.
    """
    if not query or not isinstance(query, str) or not query.strip():
        return None

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query.strip(),
        "format": "json",
        "limit": 1,
        "countrycodes": "ug,ke",
    }
    headers = {"User-Agent": "NEMA-Compliance-Checker/2.0 (real estate due-diligence)"}

    try:
        req = session or requests
        resp = req.get(url, params=params, headers=headers, timeout=10)
        if resp.status_code == 200:
            results = resp.json()
            if results and isinstance(results, list):
                top = results[0]
                return {
                    "lat": float(top["lat"]),
                    "lon": float(top["lon"]),
                    "display_name": top.get("display_name", query.strip()),
                }
    except Exception:
        pass

    return None


def point_gdf(lat, lon, name="Site Pin"):
    """Create a GeoDataFrame with a single WGS84 Point geometry."""
    return gpd.GeoDataFrame(
        {"name": [name]},
        geometry=[Point(lon, lat)],
        crs="EPSG:4326",
    )


def plot_polygon_from_point(lat, lon, width_m=30, length_m=30, name="Plot Footprint"):
    """Create a rectangular parcel footprint around a point with width and length in meters."""
    pt_gdf = point_gdf(lat, lon, name=name)
    utm_crs = estimate_utm_crs_for(pt_gdf)
    pt_proj = pt_gdf.to_crs(utm_crs)
    center = pt_proj.geometry.iloc[0]

    half_w = width_m / 2.0
    half_l = length_m / 2.0
    poly = box(center.x - half_w, center.y - half_l, center.x + half_w, center.y + half_l)

    poly_gdf = gpd.GeoDataFrame({"name": [name]}, geometry=[poly], crs=utm_crs)
    return poly_gdf.to_crs("EPSG:4326")