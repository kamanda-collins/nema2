"""
wetland_cache.py

Local indexed GeoPackage cache & orchestrator (plan Phase 1.2):
- Computes metric bounding boxes for low-latency spatial window reads
- Normalises and merges official NEMA/MWE/WRA layers and OSM extracts
- Manages an indexed GeoPackage (data/wetlands_east_africa.gpkg)
- Orchestrates cache-first lookups with graceful live-OSM fallback and auto-caching
"""

import math
import os
from typing import Any, Callable, Dict, List, Optional, Tuple

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

from geo_utils import estimate_utm_crs_for

# Optional PostGIS integration (plan Phase 2.2)
HAS_SPATIAL_DB = False
load_postgis_as_gdf = None
if not os.getenv("DISABLE_POSTGIS"):
    try:
        from spatial_db import load_postgis_as_gdf
        HAS_SPATIAL_DB = True
    except ImportError:
        pass


DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OFFICIAL_DIR = os.path.join(DATA_DIR, "official")
CACHE_PATH = os.path.join(DATA_DIR, "wetlands_east_africa.gpkg")
LAYER_NAME = "wetlands"


def bbox_for_radius(lat: float, lon: float, radius_m: float) -> Tuple[float, float, float, float]:
    """Calculate a bounding box (minx, miny, maxx, maxy) in EPSG:4326 for a given radius in meters."""
    # 1 degree of latitude is approximately 111,132 meters
    d_lat = radius_m / 111132.0
    # 1 degree of longitude depends on latitude
    lat_rad = math.radians(lat)
    cos_lat = math.cos(lat_rad)
    if abs(cos_lat) < 1e-6:
        cos_lat = 1e-6
    d_lon = radius_m / (111132.0 * abs(cos_lat))

    minx = lon - d_lon
    maxx = lon + d_lon
    miny = lat - d_lat
    maxy = lat + d_lat
    return (float(minx), float(miny), float(maxx), float(maxy))


def _source_tag_for_filename(filename: str) -> str:
    """Classify a source filename into a standardized provenance tag."""
    name_lower = os.path.basename(filename).lower()
    if "uganda" in name_lower and ("nwis" in name_lower or "wetland" in name_lower):
        return "official_uganda"
    if "kenya" in name_lower or "wra" in name_lower or "riparian" in name_lower:
        return "official_kenya"
    if "osm" in name_lower:
        return "osm"
    return "official_other"


def _normalise_layer(gdf: Optional[gpd.GeoDataFrame], source_tag: str) -> Optional[gpd.GeoDataFrame]:
    """Normalise arbitrary GeoDataFrame attributes to standard schema: name, feature_kind, source, geometry."""
    if gdf is None or gdf.empty:
        return None

    df = gdf.copy()
    if df.crs is None:
        df.set_crs("EPSG:4326", inplace=True)
    elif df.crs.to_epsg() != 4326:
        df = df.to_crs("EPSG:4326")

    # Determine feature_kind
    kinds = []
    names = []

    for _, row in df.iterrows():
        geom = row.geometry
        is_linear = geom.geom_type in ("LineString", "MultiLineString") if geom else False

        # Kind determination
        kind = "wetland"
        if "feature_kind" in row and pd.notnull(row["feature_kind"]):
            kind = str(row["feature_kind"])
        elif "fclass" in row and pd.notnull(row["fclass"]):
            fclass = str(row["fclass"]).lower()
            if fclass in ("wetland",):
                kind = "wetland"
            elif fclass in ("water", "reservoir", "basin", "lake"):
                kind = "water_body"
            elif fclass in ("river", "stream", "canal", "drain", "ditch", "waterway"):
                kind = "waterway"
            else:
                kind = "waterway" if is_linear else "water_body"
        elif "natural" in row and pd.notnull(row["natural"]):
            nat = str(row["natural"]).lower()
            if nat == "wetland":
                kind = "wetland"
            elif nat == "water":
                kind = "water_body"
            else:
                kind = "wetland"
        elif "waterway" in row and pd.notnull(row["waterway"]):
            kind = "waterway"
        elif is_linear:
            kind = "waterway"
        else:
            kind = "wetland"

        kinds.append(kind)

        # Name determination
        name = "Unnamed"
        for col in ["name", "WETLAND", "NAME", "wetland_name", "river_name"]:
            if col in row and pd.notnull(row[col]) and str(row[col]).strip():
                name = str(row[col]).strip()
                break
        names.append(name)

    normalised = gpd.GeoDataFrame(
        {
            "name": names,
            "feature_kind": kinds,
            "source": [source_tag] * len(df),
        },
        geometry=df.geometry.values,
        crs="EPSG:4326",
    )
    return normalised


def build_cache(
    data_dir: Optional[str] = None,
    official_dir: Optional[str] = None,
    cache_path: Optional[str] = None,
    write: bool = True,
    verbose: bool = True,
) -> Tuple[Optional[gpd.GeoDataFrame], Dict[str, int]]:
    """Scan official directory and local shapefiles, normalise, and compile into an indexed GeoPackage."""
    off_dir = official_dir or OFFICIAL_DIR
    out_path = cache_path or CACHE_PATH

    layers: List[gpd.GeoDataFrame] = []
    counts: Dict[str, int] = {}

    if os.path.exists(off_dir):
        for fname in sorted(os.listdir(off_dir)):
            if fname.lower().endswith((".shp", ".geojson", ".gpkg", ".json")):
                full_path = os.path.join(off_dir, fname)
                try:
                    raw_gdf = gpd.read_file(full_path)
                    tag = _source_tag_for_filename(fname)
                    norm = _normalise_layer(raw_gdf, tag)
                    if norm is not None and not norm.empty:
                        layers.append(norm)
                        counts[tag] = counts.get(tag, 0) + len(norm)
                except Exception:
                    pass

    # Also check wetland_shp directory in project root
    root_shp = os.path.join(os.path.dirname(__file__), "wetland_shp")
    if os.path.exists(root_shp):
        for fname in sorted(os.listdir(root_shp)):
            if fname.lower().endswith(".shp"):
                full_path = os.path.join(root_shp, fname)
                try:
                    raw_gdf = gpd.read_file(full_path)
                    tag = _source_tag_for_filename(fname)
                    norm = _normalise_layer(raw_gdf, tag)
                    if norm is not None and not norm.empty:
                        layers.append(norm)
                        counts[tag] = counts.get(tag, 0) + len(norm)
                except Exception:
                    pass

    if not layers:
        return None, {}

    combined = pd.concat(layers, ignore_index=True)
    combined = gpd.GeoDataFrame(combined, geometry="geometry", crs="EPSG:4326")

    if write:
        parent = os.path.dirname(out_path)
        if parent and not os.path.exists(parent):
            os.makedirs(parent, exist_ok=True)
        combined.to_file(out_path, layer=LAYER_NAME, driver="GPKG")

    return combined, counts


def cache_exists(cache_path: Optional[str] = None) -> bool:
    """Check if the local GeoPackage cache exists."""
    return os.path.exists(cache_path or CACHE_PATH)


def cache_summary(cache_path: Optional[str] = None) -> Dict[str, int]:
    """Return feature counts by source from the cache."""
    path = cache_path or CACHE_PATH
    if not os.path.exists(path):
        return {}
    try:
        df = gpd.read_file(path, layer=LAYER_NAME)
        if "source" in df.columns:
            counts = df["source"].value_counts()
            return {str(k): int(v) for k, v in counts.items()}
        return {"total": int(len(df))}
    except Exception:
        return {}


def read_cache_bbox(
    bbox: Tuple[float, float, float, float],
    cache_path: Optional[str] = None,
) -> Optional[gpd.GeoDataFrame]:
    """Read features from the GeoPackage cache matching the bounding box window."""
    path = cache_path or CACHE_PATH
    if not os.path.exists(path):
        return None
    try:
        return gpd.read_file(path, bbox=bbox, layer=LAYER_NAME)
    except Exception:
        return None


def filter_within_radius(
    gdf: gpd.GeoDataFrame,
    lat: float,
    lon: float,
    radius_m: float,
) -> gpd.GeoDataFrame:
    """Filter GeoDataFrame features strictly within radius_m meters of the point."""
    if gdf is None or gdf.empty:
        return gdf

    pt_gdf = gpd.GeoDataFrame([{"name": "Center"}], geometry=[Point(lon, lat)], crs="EPSG:4326")
    utm_crs = estimate_utm_crs_for(pt_gdf)
    pt_proj = pt_gdf.to_crs(utm_crs).geometry.iloc[0]
    gdf_proj = gdf.to_crs(utm_crs)

    mask = gdf_proj.geometry.distance(pt_proj) <= radius_m
    return gdf[mask.values].copy()


def append_osm_features(
    osm_gdf: Optional[gpd.GeoDataFrame],
    cache_path: Optional[str] = None,
) -> bool:
    """Append newly fetched OSM features to the persistent cache."""
    norm = _normalise_layer(osm_gdf, "osm")
    if norm is None or norm.empty:
        return False

    path = cache_path or CACHE_PATH
    parent = os.path.dirname(path)
    if parent and not os.path.exists(parent):
        os.makedirs(parent, exist_ok=True)

    try:
        if os.path.exists(path):
            existing = gpd.read_file(path, layer=LAYER_NAME)
            combined = pd.concat([existing, norm], ignore_index=True)
            combined = gpd.GeoDataFrame(combined, geometry="geometry", crs="EPSG:4326")
            combined.to_file(path, layer=LAYER_NAME, driver="GPKG")
        else:
            norm.to_file(path, layer=LAYER_NAME, driver="GPKG")
        return True
    except Exception:
        return False


def load_wetlands_nearby(
    lat: float,
    lon: float,
    radius_m: float = 5000,
    allow_osm_fallback: bool = True,
    osm_fetcher: Optional[Callable[[float, float, float], Optional[gpd.GeoDataFrame]]] = None,
    cache_path: Optional[str] = None,
) -> Tuple[Optional[gpd.GeoDataFrame], Dict[str, Any]]:
    """Cache-first orchestrator to load wetlands around a coordinate."""
    bbox = bbox_for_radius(lat, lon, radius_m)
# 0. Try PostGIS first if available (Phase 2.2)
    if HAS_SPATIAL_DB:
        postgis_gdf = load_postgis_as_gdf(lat, lon, radius_m)
        if postgis_gdf is not None and not postgis_gdf.empty:
            return postgis_gdf, {
                "source": "postgis",
                "used_cache": False,
                "used_osm": False,
                "count": len(postgis_gdf),
                "message": f"Answered from PostGIS spatial database ({len(postgis_gdf)} features).",
            }
    
    # 1. Try reading from local indexed cache
    if cache_exists(cache_path):
        cached = read_cache_bbox(bbox, cache_path)
        if cached is not None and not cached.empty:
            nearby = filter_within_radius(cached, lat, lon, radius_m)
            if not nearby.empty:
                source_tags = sorted(str(s) for s in nearby.get("source", pd.Series(dtype=str)).dropna().unique())
                verified = any(tag.startswith("official_") for tag in source_tags)
                return nearby, {
                    "source": "local_cache",
                    "source_tags": source_tags,
                    "coverage_status": "verified" if verified else "community_or_unverified",
                    "used_cache": True,
                    "used_osm": False,
                    "count": len(nearby),
                    "message": f"Answered from local indexed cache ({len(nearby)} features).",
                }
    
    # 2. Cache miss -> Live fallback
    if not allow_osm_fallback:
        return None, {
            "source": "cache_miss",
            "used_cache": False,
            "used_osm": False,
            "count": 0,
            "message": "No local cache coverage for this location; live OSM fallback is disabled.",
        }
    
    # Use supplied fetcher or default to osm_data.fetch_osm_wetlands
    fetcher = osm_fetcher
    if fetcher is None:
        try:
            from osm_data import fetch_osm_wetlands
            fetcher = fetch_osm_wetlands
        except ImportError:
            pass
    
    if fetcher is None:
        return None, {
            "source": "error",
            "used_cache": False,
            "used_osm": False,
            "count": 0,
            "message": "OSM fetcher not available.",
        }
    
    try:
        fetched = fetcher(lat, lon, radius_m)
    except Exception as exc:
        return None, {
            "source": "osm_error",
            "used_cache": False,
            "used_osm": True,
            "count": 0,
            "message": f"OpenStreetMap fetch failed: {exc}",
        }
    
    if fetched is None or fetched.empty:
        return None, {
            "source": "osm_empty",
            "used_cache": False,
            "used_osm": True,
            "count": 0,
            "message": f"No mapped wetlands or water features within {radius_m/1000:.1f} km (OpenStreetMap).",
        }
    
    # Persist to cache for future lookups
    append_osm_features(fetched, cache_path)
    
    return fetched, {
        "source": "osm_live",
        "source_tags": ["osm"],
        "coverage_status": "community_or_unverified",
        "used_cache": False,
        "used_osm": True,
        "cached": True,
        "count": len(fetched),
        "message": f"Answered from OpenStreetMap ({len(fetched)} features); cached for future use.",
}


def available_sources(
    cache_path: Optional[str] = None,
    official_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """Inspect and report the status of cache and official datasets."""
    off_dir = official_dir or OFFICIAL_DIR
    path = cache_path or CACHE_PATH
    official_files = []
    if os.path.exists(off_dir):
        official_files = [
            f for f in sorted(os.listdir(off_dir))
            if f.lower().endswith((".shp", ".geojson", ".gpkg", ".json"))
        ]

    return {
        "cache_exists": os.path.exists(path),
        "cache_path": path,
        "cache_summary": cache_summary(path),
        "official_layers": official_files,
    }
