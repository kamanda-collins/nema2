"""
tests/test_osm_data.py

Tests for the OpenStreetMap (Overpass API) integration in osm_data.py:
- Overpass JSON -> GeoDataFrame parsing (closed ways, open ways, relations)
- Feature classification (wetland / water_body / waterway)
- Endpoint failover and error handling (fully mocked, no network needed)

Run headless:  python -m pytest tests/
"""

import geopandas as gpd
import pytest
from shapely.geometry import LineString, Polygon

import osm_data
from osm_data import (
    build_overpass_query,
    fetch_osm_wetlands,
    gdf_from_overpass_response,
)

# A sample Overpass response around Kampala with one wetland (closed way),
# one river (open way) and one dam (relation with a closed outer member).
SAMPLE_RESPONSE = {
    "version": 0.6,
    "elements": [
        {
            "type": "way",
            "id": 100,
            "tags": {"natural": "wetland", "name": "Nakivubo Wetland"},
            "geometry": [
                {"lat": 0.3400, "lon": 32.5800},
                {"lat": 0.3500, "lon": 32.5800},
                {"lat": 0.3500, "lon": 32.5900},
                {"lat": 0.3400, "lon": 32.5900},
                {"lat": 0.3400, "lon": 32.5800},
            ],
        },
        {
            "type": "way",
            "id": 101,
            "tags": {"waterway": "river", "name": "Channel A"},
            "geometry": [
                {"lat": 0.3000, "lon": 32.5700},
                {"lat": 0.3100, "lon": 32.5800},
                {"lat": 0.3200, "lon": 32.5850},
            ],
        },
        {
            "type": "relation",
            "id": 102,
            "tags": {"natural": "water", "name": "Big Dam"},
            "members": [
                {
                    "role": "outer",
                    "geometry": [
                        {"lat": 0.4000, "lon": 32.6000},
                        {"lat": 0.4100, "lon": 32.6000},
                        {"lat": 0.4100, "lon": 32.6100},
                        {"lat": 0.4000, "lon": 32.6100},
                        {"lat": 0.4000, "lon": 32.6000},
                    ],
                }
            ],
        },
        {
            "type": "way",
            "id": 103,
            "tags": {"waterway": "stream"},
            "geometry": [
                {"lat": 0.2000, "lon": 32.5500},
                {"lat": 0.2100, "lon": 32.5510},
            ],
        },
    ],
}


# --- Query builder ------------------------------------------------------------

def test_build_overpass_query_contains_location_and_radius():
    query = build_overpass_query(0.3476, 32.5825, 5000)
    assert "around:5000,0.347600,32.582500" in query
    assert '"natural"="wetland"' in query
    assert "out body geom;" in query


# --- Parsing --------------------------------------------------------------------

def test_parse_closed_way_into_wetland_polygon():
    gdf = gdf_from_overpass_response(SAMPLE_RESPONSE)
    wetlands = gdf[gdf["feature_kind"] == "wetland"]
    assert len(wetlands) == 1
    assert wetlands.iloc[0]["name"] == "Nakivubo Wetland"
    geom = wetlands.iloc[0]["geometry"]
    assert isinstance(geom, Polygon)
    assert geom.area > 0


def test_parse_open_way_into_waterway_linestring():
    gdf = gdf_from_overpass_response(SAMPLE_RESPONSE)
    rivers = gdf[gdf["osm_id"] == 101]
    assert len(rivers) == 1
    assert isinstance(rivers.iloc[0]["geometry"], LineString)
    assert rivers.iloc[0]["feature_kind"] == "waterway"


def test_parse_relation_with_closed_outer_member():
    gdf = gdf_from_overpass_response(SAMPLE_RESPONSE)
    dams = gdf[gdf["osm_id"] == 102]
    assert len(dams) == 1
    geom = dams.iloc[0]["geometry"]
    assert geom.geom_type in ("Polygon", "MultiPolygon")
    assert dams.iloc[0]["feature_kind"] == "water_body"


def test_unnamed_feature_gets_placeholder_name():
    gdf = gdf_from_overpass_response(SAMPLE_RESPONSE)
    streams = gdf[gdf["osm_id"] == 103]
    assert streams.iloc[0]["name"] == "Unnamed"


def test_parse_output_has_wgs84_crs():
    gdf = gdf_from_overpass_response(SAMPLE_RESPONSE)
    assert gdf.crs.to_epsg() == 4326


def test_parse_empty_response_returns_none():
    assert gdf_from_overpass_response({"elements": []}) is None
    assert gdf_from_overpass_response({}) is None


# --- Fetch & endpoint failover (mocked) --------------------------------------------

class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        if self._payload is None:
            raise ValueError("no json")
        return self._payload


class FailingEndpoint:
    """A requests-like session that fails for given endpoints, succeeds for others."""

    def __init__(self, behaviour):
        # behaviour: list of (matches_substring, FakeResponse_or_Exception)
        self.behaviour = behaviour
        self.calls = []

    def post(self, endpoint, **kwargs):
        self.calls.append(endpoint)
        for matches, response in self.behaviour:
            if matches in endpoint:
                if isinstance(response, Exception):
                    raise response
                return response
        return FakeResponse(200, SAMPLE_RESPONSE)


def test_fetch_returns_gdf_on_first_endpoint():
    session = FailingEndpoint([])
    gdf = fetch_osm_wetlands(0.35, 32.58, radius_m=2000, session=session)
    assert isinstance(gdf, gpd.GeoDataFrame)
    assert len(gdf) == 4


def test_fetch_falls_back_to_next_endpoint_on_http_error():
    session = FailingEndpoint([("overpass-api.de", FakeResponse(504))])
    gdf = fetch_osm_wetlands(0.35, 32.58, radius_m=2000, session=session)
    assert isinstance(gdf, gpd.GeoDataFrame)
    # First endpoint failed, second (kumi.systems) answered
    assert session.calls[0].startswith("https://overpass-api.de")
    assert "kumi" in session.calls[1]


def test_fetch_returns_none_when_area_has_no_features():
    session = FailingEndpoint([("overpass-api.de", FakeResponse(200, {"elements": []}))])
    assert fetch_osm_wetlands(0.35, 32.58, radius_m=2000, session=session) is None


def test_fetch_raises_when_all_endpoints_fail():
    session = FailingEndpoint([
        ("overpass-api.de", FakeResponse(504)),
        ("kumi.systems", FakeResponse(502)),
        ("private.coffee", FakeResponse(500)),
    ])
    with pytest.raises(RuntimeError, match="All Overpass endpoints failed"):
        fetch_osm_wetlands(0.35, 32.58, radius_m=2000, session=session)


def test_fetch_raises_when_network_errors_on_all_endpoints():
    session = FailingEndpoint([
        ("overpass-api.de", osm_data.requests.Timeout("timed out")),
        ("kumi.systems", osm_data.requests.ConnectionError("no route")),
        ("private.coffee", osm_data.requests.ConnectionError("no route")),
    ])
    with pytest.raises(RuntimeError):
        fetch_osm_wetlands(0.35, 32.58, radius_m=2000, session=session)
