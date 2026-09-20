"""
tests/test_wetland_cache.py

Tests for the local indexed GeoPackage cache (plan Phase 1.2):
- bbox maths and source tagging / layer normalisation
- building the cache from official layers and reading it back by window
- the cache-first orchestrator with live-OSM fallback (fake fetcher, no network)
- growing the cache with fetched OSM features

All file writes go to a pytest tmp_path; the real data/ directory is untouched.
"""

import geopandas as gpd
import os
import pytest
from shapely.geometry import LineString, Point, box

import wetland_cache
from wetland_cache import (
    append_osm_features,
    bbox_for_radius,
    build_cache,
    cache_exists,
    cache_summary,
    filter_within_radius,
    load_wetlands_nearby,
    read_cache_bbox,
)

# Lubigi wetland area, Kampala
LUBIGI_LAT, LUBIGI_LON = 0.3345, 32.5320
# Nairobi (no local coverage in the fixture cache)
NAIROBI_LAT, NAIROBI_LON = -1.2864, 36.8172


@pytest.fixture
def tmp_cache(tmp_path, monkeypatch):
    """Point the module's data paths at a temporary directory."""
    data_dir = tmp_path / "data"
    official = data_dir / "official"
    official.mkdir(parents=True)
    monkeypatch.setattr(wetland_cache, "DATA_DIR", str(data_dir))
    monkeypatch.setattr(wetland_cache, "OFFICIAL_DIR", str(official))
    monkeypatch.setattr(wetland_cache, "CACHE_PATH", str(data_dir / "wetlands_east_africa.gpkg"))
    return data_dir


def _write_official_layer(official_dir, filename, gdf):
    path = os.path.join(str(official_dir), filename)
    gdf.to_file(path, driver="GeoJSON")
    return path


@pytest.fixture
def lubigi_layer(tmp_cache):
    """An official-layer-looking file covering the Lubigi wetland."""
    wetland = gpd.GeoDataFrame(
        {"WETLAND": ["Lubigi Wetland"]},
        geometry=[box(32.5300, 0.3300, 32.5340, 0.3390)],
        crs="EPSG:4326",
    )
    stream = gpd.GeoDataFrame(
        {"fclass": ["stream"]},
        geometry=[LineString([(32.5200, 0.3300), (32.5250, 0.3350), (32.5300, 0.3380)])],
        crs="EPSG:4326",
    )
    _write_official_layer(wetland_cache.OFFICIAL_DIR, "uganda_nwis_wetlands.geojson", wetland)
    _write_official_layer(wetland_cache.OFFICIAL_DIR, "gis_osm_waterways.geojson", stream)
    return wetland_cache.OFFICIAL_DIR


# --- bbox maths ---------------------------------------------------------------------

def test_bbox_for_radius_is_metric_square():
    minx, miny, maxx, maxy = bbox_for_radius(LUBIGI_LAT, LUBIGI_LON, 1000)
    # ~1 km each way in degrees (0.009 deg lat)
    assert 0.007 < (maxy - miny) / 2 < 0.011
    assert 0.007 < (maxx - minx) / 2 < 0.012
    assert miny < LUBIGI_LAT < maxy
    assert minx < LUBIGI_LON < maxx


def test_bbox_for_radius_scales_with_radius():
    small = bbox_for_radius(LUBIGI_LAT, LUBIGI_LON, 500)
    large = bbox_for_radius(LUBIGI_LAT, LUBIGI_LON, 5000)
    assert (large[2] - large[0]) > (small[2] - small[0])


# --- Source tagging / normalisation ---------------------------------------------------

def test_source_tagging_by_filename():
    assert wetland_cache._source_tag_for_filename("uganda_nwis_wetlands.shp") == "official_uganda"
    assert wetland_cache._source_tag_for_filename("Kenya_WRA_riparian.gpkg") == "official_kenya"
    assert wetland_cache._source_tag_for_filename("gis_osm_water_a_free_1.shp") == "osm"
    assert wetland_cache._source_tag_for_filename("mystery_layer.geojson") == "official_other"


def test_normalise_layer_maps_osm_fclass_and_lines():
    gdf = gpd.GeoDataFrame(
        {"fclass": ["water", "stream"], "name": ["Lake A", None]},
        geometry=[
            box(32.50, 0.30, 32.51, 0.31),
            LineString([(32.52, 0.30), (32.53, 0.31)]),
        ],
        crs="EPSG:4326",
    )
    normalised = wetland_cache._normalise_layer(gdf, "osm")
    kinds = list(normalised["feature_kind"])
    assert kinds == ["water_body", "waterway"]
    assert list(normalised["name"])[0] == "Lake A"
    assert list(normalised["name"])[1] == "Unnamed"
    assert set(normalised["source"]) == {"osm"}


def test_normalise_layer_skips_empty():
    empty = gpd.GeoDataFrame({"name": []}, geometry=[], crs="EPSG:4326")
    assert wetland_cache._normalise_layer(empty, "osm") is None


# --- Cache building and windowed reads --------------------------------------------------

def test_build_cache_creates_indexed_geopackage(tmp_cache, lubigi_layer):
    combined, counts = build_cache(verbose=False)
    assert combined is not None
    assert cache_exists()
    assert counts.get("official_uganda") == 1
    assert counts.get("osm") == 1
    assert wetland_cache.CACHE_PATH.endswith(".gpkg")


def test_read_cache_bbox_returns_window_only(tmp_cache, lubigi_layer):
    build_cache()
    # Window over Kampala must contain the wetland; a window over Nairobi must not
    near = read_cache_bbox(bbox_for_radius(LUBIGI_LAT, LUBIGI_LON, 2000))
    far = read_cache_bbox(bbox_for_radius(NAIROBI_LAT, NAIROBI_LON, 2000))
    assert near is not None and len(near) >= 1
    assert far is not None and len(far) == 0


def test_read_cache_bbox_without_cache_returns_none(tmp_cache):
    assert read_cache_bbox(bbox_for_radius(LUBIGI_LAT, LUBIGI_LON, 1000)) is None


def test_cache_summary_counts_sources(tmp_cache, lubigi_layer):
    build_cache()
    summary = cache_summary()
    assert summary.get("official_uganda") == 1


def test_build_cache_with_no_layers_returns_none(tmp_cache):
    combined, counts = build_cache()
    assert combined is None
    assert counts == {}


def test_build_cache_with_write_false_skips_disk(tmp_cache, lubigi_layer):
    combined, _ = build_cache(write=False)
    assert combined is not None and len(combined) == 2
    assert not cache_exists()


# --- Appending / filtering ---------------------------------------------------------------

def test_append_osm_features_creates_then_grows_cache(tmp_cache):
    first = gpd.GeoDataFrame(
        {"name": ["A"], "feature_kind": ["wetland"]},
        geometry=[box(32.53, 0.33, 32.535, 0.339)],
        crs="EPSG:4326",
    )
    assert append_osm_features(first) is True
    assert cache_exists()

    second = gpd.GeoDataFrame(
        {"name": ["B"], "feature_kind": ["waterway"]},
        geometry=[LineString([(32.54, 0.33), (32.55, 0.34)])],
        crs="EPSG:4326",
    )
    append_osm_features(second)
    combined = gpd.read_file(wetland_cache.CACHE_PATH, layer=wetland_cache.LAYER_NAME)
    assert len(combined) == 2


def test_append_osm_features_ignores_empty(tmp_cache):
    empty = gpd.GeoDataFrame({"name": []}, geometry=[], crs="EPSG:4326")
    assert append_osm_features(empty) is False
    assert not cache_exists()


def test_filter_within_radius_drops_far_features():
    gdf = gpd.GeoDataFrame(
        {"name": ["near", "far"]},
        geometry=[
            Point(32.5320, 0.3345),      # at the plot
            Point(32.6200, 0.3345),      # ~9.5 km east
        ],
        crs="EPSG:4326",
    )
    kept = filter_within_radius(gdf, LUBIGI_LAT, LUBIGI_LON, 2000)
    assert list(kept["name"]) == ["near"]


# --- Orchestrator ---------------------------------------------------------------------------

def test_local_cache_hit_does_not_call_osm(tmp_cache, lubigi_layer):
    build_cache()
    calls = []

    def exploding_fetcher(lat, lon, radius_m):
        calls.append((lat, lon))
        raise AssertionError("OSM must not be called when the cache covers the area")

    gdf, provenance = load_wetlands_nearby(LUBIGI_LAT, LUBIGI_LON, 2000, osm_fetcher=exploding_fetcher)
    assert calls == []
    assert provenance["source"] == "local_cache"
    assert provenance["used_cache"] is True
    assert provenance["used_osm"] is False
    assert gdf is not None and len(gdf) >= 1


def test_cache_miss_falls_back_to_osm_and_persists(tmp_cache, lubigi_layer):
    build_cache()
    fetched_layer = gpd.GeoDataFrame(
        {"name": ["Nairobi River"], "feature_kind": ["waterway"], "source": ["osm"]},
        geometry=[LineString([(36.815, -1.290), (36.820, -1.285)])],
        crs="EPSG:4326",
    )

    def fake_fetcher(lat, lon, radius_m):
        return fetched_layer

    gdf, provenance = load_wetlands_nearby(NAIROBI_LAT, NAIROBI_LON, 2000, osm_fetcher=fake_fetcher)
    assert provenance["source"] == "osm_live"
    assert provenance["used_osm"] is True
    assert provenance["cached"] is True
    assert gdf is not None and len(gdf) == 1

    # Second call for the same area must now be served from the cache
    gdf2, provenance2 = load_wetlands_nearby(
        NAIROBI_LAT, NAIROBI_LON, 2000,
        osm_fetcher=lambda *a: (_ for _ in ()).throw(AssertionError("cache should have been used")),
    )
    assert provenance2["source"] == "local_cache"
    assert gdf2 is not None


def test_osm_empty_result_reports_empty(tmp_cache):
    gdf, provenance = load_wetlands_nearby(NAIROBI_LAT, NAIROBI_LON, 1000, osm_fetcher=lambda *a: None)
    assert gdf is None
    assert provenance["source"] == "osm_empty"
    assert "No mapped wetlands" in provenance["message"]


def test_osm_failure_reports_message_not_exception(tmp_cache):
    def failing(lat, lon, radius_m):
        raise RuntimeError("all endpoints down")

    gdf, provenance = load_wetlands_nearby(NAIROBI_LAT, NAIROBI_LON, 1000, osm_fetcher=failing)
    assert gdf is None
    assert "all endpoints down" in provenance["message"]


def test_osm_disabled_returns_none_with_message(tmp_cache):
    gdf, provenance = load_wetlands_nearby(
        NAIROBI_LAT, NAIROBI_LON, 1000, allow_osm_fallback=False
    )
    assert gdf is None
    assert "disabled" in provenance["message"]


def test_available_sources_reports_cache_state(tmp_cache, lubigi_layer):
    sources = wetland_cache.available_sources()
    assert sources["cache_exists"] is False
    assert len(sources["official_layers"]) == 2

