"""
tests/test_report_logic.py

Tests for the compliance engine in report_logic.py:
- check_compliance (intersection detection, empty-input safety, CRS handling)
- calculate_min_distance (meter-accurate, measured from the site boundary)
- render_compliance_report (Jinja2 template rendering)

These run headless (no Streamlit server required):  python -m pytest tests/
"""

import os
from math import isclose

import geopandas as gpd
import pytest
from pyproj import Transformer
from shapely.geometry import Point, box

from report_logic import (
    calculate_min_distance,
    check_compliance,
    render_compliance_report,
)

# Kampala city centre, transformed into UTM 36N so we can lay out exact
# meter-based geometries for the assertions below.
TO_UTM = Transformer.from_crs("EPSG:4326", "EPSG:32636", always_xy=True)
SITE_E, SITE_N = TO_UTM.transform(32.5825, 0.3476)  # Kampala


# --- Fixtures ----------------------------------------------------------------

@pytest.fixture
def site_point_utm():
    return gpd.GeoDataFrame(
        {"name": ["Test Site"]},
        geometry=[Point(SITE_E, SITE_N)],
        crs="EPSG:32636",
    )


@pytest.fixture
def wetland_1km_east_utm():
    # A wetland polygon whose western edge sits exactly 1000 m east of the site
    return gpd.GeoDataFrame(
        {"name": ["Nakivubo Wetland"]},
        geometry=[box(SITE_E + 1000, SITE_N - 200, SITE_E + 1400, SITE_N + 200)],
        crs="EPSG:32636",
    )


@pytest.fixture
def wetland_overlapping_utm():
    # A wetland polygon that contains the site point outright
    return gpd.GeoDataFrame(
        {"name": ["Lutembe Wetland"]},
        geometry=[box(SITE_E - 500, SITE_N - 500, SITE_E + 500, SITE_N + 500)],
        crs="EPSG:32636",
    )


# --- check_compliance ---------------------------------------------------------

def test_check_compliance_detects_intersection(site_point_utm, wetland_overlapping_utm):
    in_wetland, names = check_compliance(site_point_utm, wetland_overlapping_utm)
    assert in_wetland is True
    assert names == ["Lutembe Wetland"]


def test_check_compliance_clear_site(site_point_utm, wetland_1km_east_utm):
    in_wetland, names = check_compliance(site_point_utm, wetland_1km_east_utm)
    assert in_wetland is False
    assert names == []


def test_check_compliance_empty_wetlands_is_safe(site_point_utm):
    empty = gpd.GeoDataFrame({"name": []}, geometry=[], crs="EPSG:32636")
    in_wetland, names = check_compliance(site_point_utm, empty)
    assert in_wetland is False
    assert names == []


def test_check_compliance_reprojects_mixed_crs(site_point_utm, wetland_overlapping_utm):
    # Site supplied in WGS84 while wetlands are already projected
    site_wgs84 = site_point_utm.to_crs("EPSG:4326")
    in_wetland, names = check_compliance(site_wgs84, wetland_overlapping_utm)
    assert in_wetland is True
    assert names == ["Lutembe Wetland"]


def test_check_compliance_handles_missing_crs(site_point_utm, wetland_overlapping_utm):
    # Shapefiles without a .prj arrive with CRS=None; the check must not crash
    site_no_crs = site_point_utm.copy()
    site_no_crs.set_crs(None, allow_override=True)
    wetlands_no_crs = wetland_overlapping_utm.copy()
    wetlands_no_crs.set_crs(None, allow_override=True)
    in_wetland, _ = check_compliance(site_no_crs, wetlands_no_crs)
    assert in_wetland is True


# --- calculate_min_distance -----------------------------------------------------

def test_min_distance_from_point(site_point_utm, wetland_1km_east_utm):
    distance = calculate_min_distance(site_point_utm, wetland_1km_east_utm)
    assert distance is not None
    assert isclose(distance, 1000.0, abs_tol=1.0)  # exactly 1000 m by construction


def test_min_distance_measured_from_site_boundary_not_centroid():
    """Regression test for the old centroid-based calculation.

    A 1000 m-wide site square whose centroid is 1500 m from the wetland but
    whose near edge is exactly 1000 m away must report ~1000 m (NEMA buffers
    are defined relative to the site boundary, not its centroid).
    """
    site = gpd.GeoDataFrame(
        {"name": ["Wide Site"]},
        geometry=[box(SITE_E, SITE_N - 500, SITE_E + 1000, SITE_N + 500)],
        crs="EPSG:32636",
    )
    wetland = gpd.GeoDataFrame(
        {"name": ["Far Wetland"]},
        geometry=[box(SITE_E + 2000, SITE_N - 500, SITE_E + 2400, SITE_N + 500)],
        crs="EPSG:32636",
    )
    distance = calculate_min_distance(site, wetland)
    assert distance is not None
    assert isclose(distance, 1000.0, abs_tol=1.0)


def test_min_distance_works_across_crs(site_point_utm, wetland_1km_east_utm):
    # Site in WGS84, wetlands already projected -> helper must reproject internally
    site_wgs84 = site_point_utm.to_crs("EPSG:4326")
    distance = calculate_min_distance(site_wgs84, wetland_1km_east_utm)
    assert distance is not None
    assert isclose(distance, 1000.0, rel_tol=0.01)


def test_min_distance_empty_inputs_return_none():
    empty = gpd.GeoDataFrame(geometry=[], crs="EPSG:32636")
    assert calculate_min_distance(None, empty) is None
    assert calculate_min_distance(empty, empty) is None


# --- render_compliance_report -----------------------------------------------------

def _report_context(in_wetland, min_distance="N/A"):
    return dict(
        date="2026-01-01",
        num_features=1,
        executive_summary="Summary text",
        purpose="Purpose text",
        project_description="Project text",
        ems_overview="EMS text",
        audits_summary="Audits text",
        community_engagement="Community text",
        challenges="Challenges text",
        conclusion="Conclusion text",
        in_wetland=in_wetland,
        wetland_names=["Nakivubo Wetland"] if in_wetland else [],
        min_distance=min_distance,
    )


def _template_path():
    return os.path.join(os.path.dirname(__file__), "..", "report_template.md.j2")


def test_render_compliance_report_in_wetland():
    report = render_compliance_report(_report_context(True), _template_path())
    assert "Site is in/overlaps a wetland" in report
    assert "Nakivubo Wetland" in report
    assert "Executive Summary" in report


def test_render_compliance_report_clear_site():
    report = render_compliance_report(_report_context(False, 1234.5), _template_path())
    assert "Site is NOT in a mapped wetland" in report
    assert "1234.5" in report


# --- batch risk levels -------------------------------------------------------------

def test_get_risk_level_thresholds():
    from batch_processing import get_risk_level

    assert get_risk_level(True, None) == "HIGH - In Wetland"
    assert get_risk_level(False, 50) == "HIGH - Very Close"
    assert get_risk_level(False, 250) == "MEDIUM - Close"
    assert get_risk_level(False, 800) == "LOW - Moderate Distance"
    assert get_risk_level(False, 5000) == "VERY LOW - Far"
    assert get_risk_level(False, None) == "Unknown"
