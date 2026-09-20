"""
cadastral.py

Cadastral Block / Plot matching (plan Phase 4.2):
- Searches a locally hosted cadastral GeoPackage by block and plot number
- Returns the parcel footprint, centroid, and registry source for downstream
  wetland screening (so partners can search "Block 42 Plot 1234" instead of
  pasting coordinates)

Provider model:
- Primary: local GeoPackage at data/cadastral_{country}.gpkg (or a combined
  data/cadastral.gpkg) with block/plot columns (case-insensitive)
- Override the location with the NEMA_CADASTRAL_GPKG environment variable
- When no registry is present the module reports graceful "not_available"
  status with guidance — coordinates-based screening continues to work

GeoPackage expectation (any projection; reprojected to EPSG:4326 on output):
    parcel_id | block | plot | geometry
"""

import os
from typing import Any, Dict, Optional

import geopandas as gpd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DEFAULT_GPKG = os.getenv("NEMA_CADASTRAL_GPKG", "")

BLOCK_KEYS = ("block", "block_no", "block_number", "blk")
PLOT_KEYS = ("plot", "plot_no", "plot_number", "parcel", "parcel_id", "parcel_no")
NAME_KEYS = ("name", "parcel_name", "owner", "title_no")


def _normalise_columns(frame: gpd.GeoDataFrame) -> Dict[str, str]:
    """Map lowercase column names -> original names for fuzzy matching."""
    return {str(col).strip().lower(): col for col in frame.columns}


def _find_column(cols: Dict[str, str], candidates) -> Optional[str]:
    for candidate in candidates:
        if candidate in cols:
            return cols[candidate]
    # fallback: substring match (e.g. "block_number_2024")
    for candidate in candidates:
        for low, orig in cols.items():
            if candidate in low:
                return orig
    return None


def cadastral_available(gpkg_path: Optional[str] = None) -> Dict[str, Any]:
    """Report whether a local cadastral registry exists and which layers it has."""
    path = gpkg_path or DEFAULT_GPKG
    if not path:
        # Prefer country-specific file, then a combined one
        for name in ("cadastral_uganda.gpkg", "cadastral_kenya.gpkg", "cadastral.gpkg"):
            candidate = os.path.join(DATA_DIR, name)
            if os.path.exists(candidate):
                path = candidate
                break

    if not path or not os.path.exists(path):
        return {
            "available": False,
            "path": None,
            "message": (
                "No cadastral registry loaded. Place a parcel GeoPackage at "
                "data/cadastral.gpkg (columns: block, plot, geometry) or point "
                "NEMA_CADASTRAL_GPKG at one. Coordinate-based screening is unaffected."
            ),
        }

    layers: list = []
    try:
        import pyogrio

        layers = [str(l) for l in pyogrio.list_layers(path)[:, 0]]
    except Exception:
        try:
            import fiona

            layers = list(fiona.listlayers(path))
        except Exception:
            layers = []

    return {"available": bool(layers), "path": path, "layers": layers}


def _load_registry(gpkg_path: Optional[str]) -> Optional[gpd.GeoDataFrame]:
    info = cadastral_available(gpkg_path)
    if not info.get("available"):
        return None
    path = info["path"]
    try:
        frame = gpd.read_file(path)
        if frame is None or frame.empty:
            return None
        return frame
    except Exception:
        # Multi-layer file: try the first readable layer
        for layer in info.get("layers", []):
            try:
                frame = gpd.read_file(path, layer=layer)
                if frame is not None and not frame.empty:
                    return frame
            except Exception:
                continue
    return None


def _matches(value: Any, query: str) -> bool:
    """Loose registry matching: case-insensitive, dash/whitespace/leading-zero-insensitive."""
    if value is None:
        return False
    # Normalise both sides: uppercase, drop everything that isn't a letter or digit,
    # then strip leading zeros from purely-numeric tokens (plot numbers like 0055 -> 55).
    def _norm(s: str) -> str:
        token = "".join(ch for ch in str(s).upper() if ch.isalnum())
        return token.lstrip("0") or "0"

    return _norm(value) == _norm(query)


def search_parcel(
    block: str,
    plot: str,
    country: Optional[str] = None,
    gpkg_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Search the cadastral registry for a Block/Plot pair.

    Returns a dict with status "found" | "not_found" | "not_available".
    Never raises for missing data; malformed input raises ValueError.
    """
    block_q = (block or "").strip()
    plot_q = (plot or "").strip()
    if not block_q or not plot_q:
        raise ValueError("Both 'block' and 'plot' are required.")

    registry = _load_registry(gpkg_path)
    if registry is None:
        return {"status": "not_available", **cadastral_available(gpkg_path)}

    cols = _normalise_columns(registry)
    block_col = _find_column(cols, BLOCK_KEYS)
    plot_col = _find_column(cols, PLOT_KEYS)
    if block_col is None or plot_col is None:
        return {
            "status": "not_available",
            "message": "Registry found but has no recognisable block/plot columns.",
            "columns": list(registry.columns),
        }

    mask = registry[block_col].apply(lambda v: _matches(v, block_q)) & registry[plot_col].apply(
        lambda v: _matches(v, plot_q)
    )
    hits = registry[mask]
    if hits.empty:
        return {"status": "not_found", "block": block_q, "plot": plot_q}

    hit = hits.iloc[0]
    wgs = hits.to_crs("EPSG:4326")
    geom = wgs.geometry.iloc[0]
    centroid = geom.centroid

    name_col = _find_column(cols, NAME_KEYS)
    area_m2 = None
    try:
        utm = wgs.estimate_utm_crs()
        if utm is not None:
            area_m2 = round(float(wgs.to_crs(utm).geometry.iloc[0].area), 1)
    except Exception:
        area_m2 = None

    return {
        "status": "found",
        "block": str(hit[block_col]),
        "plot": str(hit[plot_col]),
        "parcel_name": str(hit[name_col]) if name_col else None,
        "centroid": {"lat": round(float(centroid.y), 6), "lon": round(float(centroid.x), 6)},
        "area_m2": area_m2,
        "bounds": [float(x) for x in geom.bounds],
        "geometry_geojson": geom.__geo_interface__,
        "source": os.path.basename(cadastral_available(gpkg_path)["path"] or "registry"),
    }

