"""
osm_data.py

Fetch wetland / water features directly from OpenStreetMap via the Overpass
API so that users (e.g. real-estate buyers, agents and developers) never
need to prepare or upload shapefiles.

Features fetched around a plot:
- natural=wetland            -> classified as "wetland"
- natural=water, landuse=reservoir|basin -> classified as "water_body"
- waterway=river|stream|canal|riverbank|ditch -> classified as "waterway"

Dependencies: requests, geopandas, shapely
"""

import json

import geopandas as gpd
import requests
from shapely.geometry import (
    LineString,
    MultiLineString,
    MultiPolygon,
    Polygon,
)
from shapely.ops import unary_union

# Public Overpass instances; we fail over in order if one is down.
DEFAULT_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

_USER_AGENT = "NEMA-Wetland-Checker/1.0 (property due-diligence tool)"


def build_overpass_query(lat, lon, radius_m, timeout=90):
    """Build an Overpass QL query for wetlands/water around a coordinate."""
    return (
        f"[out:json][timeout:{timeout}];\n"
        "(\n"
        f'  way["natural"="wetland"](around:{radius_m},{lat:.6f},{lon:.6f});\n'
        f'  relation["natural"="wetland"](around:{radius_m},{lat:.6f},{lon:.6f});\n'
        f'  way["natural"="water"](around:{radius_m},{lat:.6f},{lon:.6f});\n'
        f'  relation["natural"="water"](around:{radius_m},{lat:.6f},{lon:.6f});\n'
        f'  way["waterway"~"^(river|stream|canal|riverbank|ditch)$"](around:{radius_m},{lat:.6f},{lon:.6f});\n'
        f'  way["landuse"~"^(reservoir|basin)$"](around:{radius_m},{lat:.6f},{lon:.6f});\n'
        ");\n"
        "out body geom;"
    )


def _is_closed_ring(coords, tol=1e-9):
    """True when an Overpass way geometry forms a closed ring."""
    return (
        len(coords) >= 4
        and abs(coords[0]["lat"] - coords[-1]["lat"]) < tol
        and abs(coords[0]["lon"] - coords[-1]["lon"]) < tol
    )


def _ring_polygon(coords):
    """Build a (possibly auto-closed) Polygon from Overpass coordinates."""
    ring = [(c["lon"], c["lat"]) for c in coords]
    if _is_closed_ring(coords) and (ring[-1][0] != ring[0][0] or ring[-1][1] != ring[0][1]):
        ring.append(ring[0])  # close the ring explicitly
    if len(ring) < 4:
        return None
    poly = Polygon(ring)
    if not poly.is_valid:
        poly = poly.buffer(0)
    return poly if (not poly.is_empty and poly.area > 0) else None


def _classify(tags):
    if tags.get("natural") == "wetland":
        return "wetland"
    if tags.get("natural") == "water" or tags.get("landuse") in ("reservoir", "basin"):
        return "water_body"
    if "waterway" in tags:
        return "waterway"
    return "water"


def gdf_from_overpass_response(data):
    """Build a wetlands GeoDataFrame from a parsed Overpass JSON response.

    Returns None when the response contains no usable features.
    """
    features = []
    for element in data.get("elements", []):
        osm_type = element.get("type")
        osm_id = element.get("id")
        tags = element.get("tags") or {}
        name = tags.get("name") or tags.get("name:en") or "Unnamed"
        kind = _classify(tags)

        geoms = []
        if osm_type == "way" and element.get("geometry"):
            coords = element["geometry"]
            if _is_closed_ring(coords):
                poly = _ring_polygon(coords)
                if poly is not None:
                    geoms.append(poly)
            elif len(coords) >= 2:
                geoms.append(LineString([(c["lon"], c["lat"]) for c in coords]))
        elif osm_type == "relation":
            member_polys, member_lines = [], []
            for member in element.get("members", []):
                mgeom = member.get("geometry")
                if not mgeom or len(mgeom) < 2:
                    continue
                if _is_closed_ring(mgeom):
                    poly = _ring_polygon(mgeom)
                    if poly is not None:
                        member_polys.append(poly)
                else:
                    member_lines.append(LineString([(c["lon"], c["lat"]) for c in mgeom]))
            if member_polys:
                try:
                    geoms.append(unary_union(member_polys))
                except Exception:
                    geoms.append(MultiPolygon(member_polys))
            elif member_lines:
                geoms.append(MultiLineString(member_lines))

        for geom in geoms:
            features.append(
                {
                    "osm_type": osm_type,
                    "osm_id": osm_id,
                    "name": name,
                    "feature_kind": kind,
                    "geometry": geom,
                }
            )

    if not features:
        return None
    return gpd.GeoDataFrame(features, geometry="geometry", crs="EPSG:4326")


def fetch_osm_wetlands(lat, lon, radius_m=5000, timeout=90, endpoints=None, session=None):
    """Query Overpass for wetlands/water features around (lat, lon).

    Returns:
        GeoDataFrame in EPSG:4326, or None when the area has no mapped
        wetland/water features.

    Raises:
        RuntimeError: when every Overpass endpoint fails (network/API issues).
    """
    query = build_overpass_query(lat, lon, radius_m, timeout=max(10, timeout - 5))
    endpoints = endpoints or DEFAULT_ENDPOINTS
    last_error = None

    for endpoint in endpoints:
        try:
            # (connect, read) tuple: cap connect so a hung DNS/proxy fails over
            # quickly instead of stalling for the full read timeout.
            resp = (session or requests).post(
                endpoint,
                data={"data": query},
                timeout=(min(15, timeout), timeout),
                headers={"User-Agent": _USER_AGENT},
            )
            if resp.status_code == 200:
                data = resp.json()
                gdf = gdf_from_overpass_response(data)
                if gdf is not None and not gdf.empty:
                    return gdf
                return None  # clean 200 with no features -> nothing mapped nearby
            last_error = f"HTTP {resp.status_code} from {endpoint}"
        except (requests.RequestException, json.JSONDecodeError) as exc:
            last_error = f"{endpoint}: {exc}"

    raise RuntimeError(f"All Overpass endpoints failed. Last error: {last_error}")
