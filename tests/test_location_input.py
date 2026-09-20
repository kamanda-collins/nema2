"""
tests/test_location_input.py

Tests for buyer-friendly plot location input (plan Phase 1.1):
- Parsing coordinates out of Google Maps / WhatsApp / Apple Maps links
- Plain decimal and DMS coordinate strings
- Landmark lookup (mocked, no network)
- Plot footprint construction from a dropped pin
"""

import geopandas as gpd
import pytest
from shapely.geometry import Point, Polygon

from location_input import (
    INPUT_METHODS,
    lookup_place,
    parse_coordinates_from_text,
    parse_dms,
    plot_polygon_from_point,
    point_gdf,
)


# --- Google Maps / WhatsApp link parsing ------------------------------------------

@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://www.google.com/maps/@0.3476,32.5825,15z", (0.3476, 32.5825)),
        ("https://maps.google.com/?q=loc:0.3136,32.5811", (0.3136, 32.5811)),
        ("https://www.google.com/maps?ll=0.3476,32.5825&z=14", (0.3476, 32.5825)),
        ("https://maps.google.com/maps/place/X/data=!3d0.3476!4d32.5825", (0.3476, 32.5825)),
        ("geo:0.3476,32.5825", (0.3476, 32.5825)),
        ("https://maps.apple.com/?ll=0.3476,32.5825", (0.3476, 32.5825)),
        ("0.3476, 32.5825", (0.3476, 32.5825)),
        ("0.3476;32.5825", (0.3476, 32.5825)),
        ("-1.2864,36.8172", (-1.2864, 36.8172)),
    ],
)
def test_parse_coordinates_from_links(url, expected):
    lat, lon = parse_coordinates_from_text(url)
    assert round(lat, 4) == expected[0]
    assert round(lon, 4) == expected[1]


def test_parse_whatsapp_style_message_picks_coordinates():
    message = "Check this plot 👉 https://maps.google.com/?q=0.3846,32.6294 — good access road"
    assert parse_coordinates_from_text(message) == (0.3846, 32.6294)


def test_parse_rejects_non_coordinate_text():
    assert parse_coordinates_from_text("Kira, Wakiso district") is None
    assert parse_coordinates_from_text("") is None
    assert parse_coordinates_from_text(None) is None


def test_parse_rejects_out_of_range_values():
    # Latitude 999 is not valid; must not be accepted as a location
    assert parse_coordinates_from_text("999.0, 32.5825") is None


# --- DMS -----------------------------------------------------------------------------

def test_parse_dms_north_east():
    result = parse_dms("0 20 51.4 N 32 34 57.0 E")
    assert result is not None
    lat, lon = result
    assert round(lat, 4) == 0.3476
    assert round(lon, 4) == 32.5825


def test_parse_dms_south_hemisphere_is_negative():
    lat, _ = parse_dms("1 17 11.0 S 36 49 2.0 E")
    assert lat < 0


def test_parse_dms_returns_none_without_match():
    assert parse_dms("no coordinates here") is None


# --- Input methods contract ------------------------------------------------------------

def test_input_methods_exposes_three_buyer_options():
    keys = [key for _, key in INPUT_METHODS]
    assert keys == ["search", "link", "map"]


# --- Landmark lookup (mocked) ------------------------------------------------------------

class _FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        if self._payload is None:
            raise ValueError("no json")
        return self._payload


class _FakeSession:
    def __init__(self, response):
        self.response = response
        self.last_params = None

    def get(self, url, params=None, headers=None, timeout=None):
        self.last_params = params
        return self.response


def test_lookup_place_returns_top_result():
    session = _FakeSession(_FakeResponse(200, [{"lat": "0.3950", "lon": "32.6350", "display_name": "Kira, Wakiso, Uganda"}]))
    result = lookup_place("Kira", session=session)
    assert result["lat"] == pytest.approx(0.3950)
    assert result["lon"] == pytest.approx(32.6350)
    assert "Wakiso" in result["display_name"]


def test_lookup_place_searches_both_countries():
    session = _FakeSession(_FakeResponse(200, [{"lat": "-1.29", "lon": "36.82", "display_name": "Nairobi"}]))
    lookup_place("Nairobi", session=session)
    assert session.last_params["countrycodes"] == "ug,ke"


def test_lookup_place_handles_empty_results():
    session = _FakeSession(_FakeResponse(200, []))
    assert lookup_place("Nowhereville", session=session) is None


def test_lookup_place_handles_http_error():
    session = _FakeSession(_FakeResponse(503, None))
    assert lookup_place("Kira", session=session) is None


def test_lookup_place_ignores_blank_query():
    session = _FakeSession(_FakeResponse(200, [{"lat": "1", "lon": "1"}]))
    assert lookup_place("   ", session=session) is None


# --- Plot geometry -------------------------------------------------------------------------

def test_point_gdf_is_wgs84_point():
    gdf = point_gdf(0.3476, 32.5825)
    assert isinstance(gdf, gpd.GeoDataFrame)
    assert gdf.crs.to_epsg() == 4326
    assert isinstance(gdf.geometry.iloc[0], Point)


def test_plot_polygon_from_point_creates_metric_footprint():
    gdf = plot_polygon_from_point(0.3476, 32.5825, width_m=30, length_m=30)
    assert isinstance(gdf.geometry.iloc[0], Polygon)
    # 30 m x 30 m footprint == 900 m^2 in the local UTM zone
    area = gdf.to_crs(gdf.estimate_utm_crs()).geometry.iloc[0].area
    assert area == pytest.approx(900, rel=0.05)


def test_plot_polygon_footprint_contains_the_pin():
    gdf = plot_polygon_from_point(0.3476, 32.5825, width_m=30, length_m=30)
    pin = point_gdf(0.3476, 32.5825)
    assert gdf.geometry.iloc[0].contains(pin.geometry.iloc[0])