"""
geo_utils.py

Shared GIS helper functions that keep the app compatible across
geopandas/shapely versions and pick the correct metric CRS for sites
anywhere in Uganda or Kenya.

Used by: app.py, report_logic.py, static_map_export.py, export_static_map.py
"""

import geopandas as gpd


def union_all_geoseries(geoseries):
    """Dissolve a GeoSeries into a single (multi)geometry.

    geopandas >= 0.14 renamed ``GeoSeries.unary_union`` to
    ``GeoSeries.union_all()`` and the old attribute was removed entirely
    in geopandas 1.0. This helper works on both old and new versions.
    """
    if hasattr(geoseries, "union_all"):
        return geoseries.union_all()
    return geoseries.unary_union


def estimate_utm_crs_for(gdf, fallback="EPSG:32636"):
    """Return the best UTM CRS for ``gdf`` (a metric CRS, in meters).

    Uganda sits in UTM 36N (EPSG:32636), but Kenya mostly spans 36N/37N,
    so a single hardcoded zone distorts distances and buffers in western
    Kenya. ``GeoDataFrame.estimate_utm_crs()`` picks the right zone
    automatically; we fall back to 36N if that call ever fails.
    """
    try:
        crs = gdf.estimate_utm_crs()
        if crs is not None:
            return crs.to_string()
    except Exception:
        pass
    return fallback
