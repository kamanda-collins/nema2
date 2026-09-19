"""
tests/test_geo_utils.py

Tests for the shared GIS compatibility helpers in geo_utils.py.
These run headless (no Streamlit server required):  python -m pytest tests/
"""

import geopandas as gpd
import pytest
from shapely.geometry import Polygon, box

from geo_utils import estimate_utm_crs_for, union_all_geoseries


# --- Test fixtures ---------------------------------------------------------

# Two overlapping squares in the Kampala area (UTM 36N coordinates)
SQUARE_A = box(459_000, 38_000, 459_500, 38_500)
SQUARE_B = box(459_250, 38_250, 459_750, 38_750)


# --- union_all_geoseries ----------------------------------------------------

def test_union_all_geoseries_merges_overlapping_polygons():
    gs = gpd.GeoSeries([SQUARE_A, SQUARE_B], crs="EPSG:32636")
    merged = union_all_geoseries(gs)
    # Overlapping squares must dissolve into ONE geometry (no overlap double-count)
    assert merged.geom_type in ("Polygon", "MultiPolygon")
    area = merged.area
    expected = SQUARE_A.area + SQUARE_B.area - (SQUARE_A.intersection(SQUARE_B)).area
    assert area == pytest.approx(expected, rel=1e-6)


def test_union_all_geoseries_single_feature_passthrough():
    gs = gpd.GeoSeries([SQUARE_A], crs="EPSG:32636")
    merged = union_all_geoseries(gs)
    assert merged.equals(SQUARE_A)


# --- estimate_utm_crs_for ---------------------------------------------------

def test_estimate_utm_crs_picks_zone_36N_for_uganda():
    # Kampala: 0.3476 N, 32.5825 E -> UTM zone 36N
    point = gpd.GeoDataFrame(
        {"name": ["Kampala"]},
        geometry=gpd.points_from_xy([32.5825], [0.3476]),
        crs="EPSG:4326",
    )
    assert estimate_utm_crs_for(point) == "EPSG:32636"


def test_estimate_utm_crs_picks_correct_zone_and_hemisphere_for_kenya():
    # Nairobi: -1.29 S, 36.82 E -> UTM zone 37 SOUTH (EPSG:32737).
    # The old hardcoded 36N was wrong here; the helper must pick the
    # hemisphere-appropriate metric zone for meter-accurate distances.
    point = gpd.GeoDataFrame(
        {"name": ["Nairobi"]},
        geometry=gpd.points_from_xy([36.82], [-1.29]),
        crs="EPSG:4326",
    )
    assert estimate_utm_crs_for(point) == "EPSG:32737"


def test_estimate_utm_crs_falls_back_when_estimate_fails():
    # A CRS-less GeoDataFrame cannot be estimated; the helper must still
    # return a usable CRS string instead of raising.
    gdf = gpd.GeoDataFrame({"a": [1]}, geometry=[SQUARE_A], crs=None)
    assert estimate_utm_crs_for(gdf) == "EPSG:32636"
