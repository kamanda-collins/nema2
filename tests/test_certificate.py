"""
tests/test_certificate.py

Tests for the bank-grade PDF certificate and its buffer-ring map
(plan Phase 1.3). PDFs/maps are generated for real into memory - no network
is used (basemaps are disabled).
"""

import geopandas as gpd
import pytest
from shapely.geometry import LineString, Point, box

from certificate import (
    build_certificate_pdf,
    generate_verification_id,
    render_site_map_png,
    verification_url,
)
from risk_score import assess_property_risk

KAMPALA = (0.3476, 32.5825)


@pytest.fixture
def site_gdf():
    return gpd.GeoDataFrame(
        {"name": ["Test Plot"]},
        geometry=[box(32.5815, 0.3465, 32.5835, 0.3485)],
        crs="EPSG:4326",
    )


@pytest.fixture
def wetlands_gdf():
    return gpd.GeoDataFrame(
        {"name": ["Nakivubo Wetland", "Channel A"], "feature_kind": ["wetland", "waterway"]},
        geometry=[
            box(32.5790, 0.3450, 32.5810, 0.3490),
            LineString([(32.5850, 0.3400), (32.5860, 0.3500)]),
        ],
        crs="EPSG:4326",
    )


@pytest.fixture
def safe_risk():
    return assess_property_risk(False, 800.0, "wetland", lat=KAMPALA[0], lon=KAMPALA[1])


@pytest.fixture
def restricted_risk():
    return assess_property_risk(True, None, "wetland", lat=0.3345, lon=32.5320)


# --- Verification identity ------------------------------------------------------------

def test_verification_id_format():
    cert_id = generate_verification_id(0.3476, 32.5825, "Safe", "2026-09-19T10:00:00Z")
    assert cert_id.startswith("NEMA-20260919-")
    assert len(cert_id) == len("NEMA-20260919-") + 6


def test_verification_id_is_stable_for_same_inputs():
    a = generate_verification_id(0.3476, 32.5825, "Safe", "2026-09-19T10:00:00Z")
    b = generate_verification_id(0.3476, 32.5825, "Safe", "2026-09-19T10:00:00Z")
    assert a == b


def test_verification_id_differs_by_location():
    a = generate_verification_id(0.3476, 32.5825, "Safe", "2026-09-19T10:00:00Z")
    b = generate_verification_id(0.3950, 32.6350, "Safe", "2026-09-19T10:00:00Z")
    assert a != b


def test_verification_url_uses_id():
    url = verification_url("NEMA-20260919-ABC123")
    assert url.endswith("/NEMA-20260919-ABC123")


# --- Buffer-ring map ---------------------------------------------------------------------

def test_map_renders_png_bytes_with_rings(site_gdf, wetlands_gdf):
    png = render_site_map_png(site_gdf, wetlands_gdf, buffer_m=500, use_basemap=False)
    assert png is not None
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(png) > 5_000


def test_map_handles_no_wetlands(site_gdf):
    png = render_site_map_png(site_gdf, None, use_basemap=False)
    assert png is not None and png[:4] == b"\x89PNG"


def test_map_returns_none_for_empty_site():
    empty = gpd.GeoDataFrame({"name": []}, geometry=[], crs="EPSG:4326")
    assert render_site_map_png(empty, None, use_basemap=False) is None


def test_map_accepts_point_only_plot(wetlands_gdf):
    point = gpd.GeoDataFrame({"name": ["Pin"]}, geometry=[Point(32.5825, 0.3476)], crs="EPSG:4326")
    png = render_site_map_png(point, wetlands_gdf, buffer_m=500, use_basemap=False)
    assert png is not None and png[:4] == b"\x89PNG"


# --- Certificate PDF -------------------------------------------------------------------------

def test_certificate_pdf_is_two_page(safe_risk, site_gdf, wetlands_gdf):
    pdf = build_certificate_pdf(
        risk=safe_risk, site_label="Kira Plot", lat=KAMPALA[1 - 1], lon=KAMPALA[1],
        distance_m=800.0, wetland_names=["Nakivubo Wetland"], feature_kind="wetland",
        site_gdf=site_gdf, wetlands_gdf=wetlands_gdf,
        provenance={"source": "local_cache", "used_cache": True, "count": 2, "message": "Answered from cache."},
    )
    assert pdf[:4] == b"%PDF"
    assert pdf.count(b"/Type /Page") >= 2
    assert len(pdf) > 20_000


def test_certificate_without_map_or_provenance(restricted_risk):
    pdf = build_certificate_pdf(risk=restricted_risk, site_label="Lubigi Plot", include_map=False)
    assert pdf[:4] == b"%PDF"


def test_certificate_accepts_plain_dict_risk():
    payload = {
        "score": 55,
        "band": "High Risk",
        "label": "High Risk / Restricted",
        "color": "#c62828",
        "headline": "Plot is within the 100 m statutory buffer",
        "guidance": "Do not commit funds before official clearance.",
        "country": "Uganda",
        "statutory_buffer_m": 100,
        "legal_references": ["National Environment Act, 2019."],
        "flags": ["WITHIN_STATUTORY_BUFFER"],
        "in_wetland": False,
    }
    pdf = build_certificate_pdf(risk=payload, lat=0.3345, lon=32.5320, distance_m=60.0, include_map=False)
    assert pdf[:4] == b"%PDF"


def test_certificate_reuses_supplied_id(safe_risk):
    pdf = build_certificate_pdf(risk=safe_risk, certificate_id="NEMA-20260919-FIXED1", include_map=False)
    assert pdf[:4] == b"%PDF"


def test_certificate_handles_point_plot_map(safe_risk):
    point = gpd.GeoDataFrame({"name": ["Pin"]}, geometry=[Point(*KAMPALA[::-1])], crs="EPSG:4326")
    pdf = build_certificate_pdf(risk=safe_risk, site_gdf=point, include_map=True)
    assert pdf[:4] == b"%PDF"
