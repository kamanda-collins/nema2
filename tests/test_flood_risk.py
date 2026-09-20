"""
tests/test_flood_risk.py

Tests for topography & flood risk modeling (plan Phase 3.3):
- Sampling grid geometry
- Mocked elevation fetch -> index computation -> band classification
- Graceful degradation when the DEM service is unreachable
- Cache behaviour
"""

import pytest

import flood_risk
from flood_risk import (
    compute_flood_index,
    fetch_elevations,
    flood_risk_assessment,
    _sample_points,
)


@pytest.fixture(autouse=True)
def clear_cache():
    flood_risk._cache.clear()
    yield
    flood_risk._cache.clear()


# --- Sampling geometry -----------------------------------------------------------------

def test_sample_grid_has_centre_corners_and_ring():
    points = _sample_points(0.35, 32.6, 15.0, 15.0)
    assert len(points) == 11  # centre + 4 corners + 6-point context ring
    assert points[0] == (0.35, 32.6)  # centre first


def test_sample_grid_offsets_move_larger_for_longitude_near_equator():
    pts = _sample_points(0.0, 0.0, 15.0, 15.0)
    corner = pts[1]
    assert corner != (0.0, 0.0)
    assert abs(corner[0] - 0.0) > 0  # latitude shifted


# --- Index computation ------------------------------------------------------------------

def test_draining_hillside_low_susceptibility():
    # Hillside plot with a steep escape route to a much lower valley -> minimal index
    result = compute_flood_index(
        plot_elevations=[1200.0, 1200.5, 1200.2, 1200.4, 1200.3],
        context_elevations=[1150.0] * 6,
        sample_spacing_m=21.2,
    )
    assert result["band"] == "Low"
    assert result["components"]["depression"] == 0.0
    assert result["components"]["slope"] == 0.0  # water has a >=10 deg descent


def test_flat_plain_moderate_susceptibility():
    # Dead-flat plain, level with surroundings: water pools -> moderate
    result = compute_flood_index(
        plot_elevations=[1200.0] * 5,
        context_elevations=[1200.0] * 6,
        sample_spacing_m=21.2,
    )
    assert result["susceptibility_index"] == 40  # slope component only
    assert result["band"] == "Moderate"


def test_sunken_plot_high_susceptibility():
    # Plot sits 4 m below a flat plain -> high depression component
    result = compute_flood_index(
        plot_elevations=[1000.0] * 5,
        context_elevations=[1004.0] * 6,
        sample_spacing_m=21.2,
    )
    assert result["depression_depth_m"] == 4.0
    assert result["susceptibility_index"] >= 70
    assert result["band"] == "High"


def test_available_descent_reduces_susceptibility():
    # Identical plots; only the surroundings differ (valley vs raised rim).
    plot = [100.0] * 5
    draining = compute_flood_index(plot, [50.0] * 6, sample_spacing_m=21.2)
    trapped = compute_flood_index(plot, [110.0] * 6, sample_spacing_m=21.2)
    assert draining["components"]["slope"] < trapped["components"]["slope"]
    assert draining["susceptibility_index"] < trapped["susceptibility_index"]


def test_index_is_bounded_0_100():
    extreme = compute_flood_index(
        plot_elevations=[0.0, 50.0, 0.0, 50.0, 0.0],
        context_elevations=[100.0] * 6,
        sample_spacing_m=1.0,
    )
    assert 0 <= extreme["susceptibility_index"] <= 100
    assert extreme["band"] in {"Low", "Moderate", "Elevated", "High"}


def test_band_thresholds():
    assert flood_risk._classify(0) == "Low"
    assert flood_risk._classify(30) == "Moderate"
    assert flood_risk._classify(60) == "Elevated"
    assert flood_risk._classify(90) == "High"


# --- Service availability ----------------------------------------------------------------

def test_invalid_coordinates_reported_unavailable():
    assert flood_risk_assessment(999, 0)["status"] == "unavailable"
    assert flood_risk_assessment("abc", 0)["status"] == "unavailable"
    assert flood_risk_assessment(0, 999)["reason"] == "invalid_coordinates"


def test_service_unreachable_degrades_gracefully(monkeypatch):
    def boom(url):
        raise ConnectionError("no network")

    monkeypatch.setattr(flood_risk, "_http_get_json", boom)
    result = flood_risk_assessment(0.35, 32.6, use_cache=False)
    assert result["status"] == "unavailable"
    assert result["reason"] == "elevation_service_unreachable"
    assert "Wetland screening is unaffected" in result["message"]


def test_malformed_elevation_response_degrades(monkeypatch):
    monkeypatch.setattr(
        flood_risk, "_http_get_json", lambda url: {"elevation": [1.0, 2.0]}  # wrong count
    )
    result = flood_risk_assessment(0.35, 32.6, use_cache=False)
    assert result["status"] == "unavailable"


def test_full_assessment_with_mocked_dem(monkeypatch):
    # Flat plain 1 m below surroundings: modest susceptibility
    def fake_fetch(url):
        lat_part = url.split("latitude=")[1].split("&")[0]
        count = len(lat_part.split(","))
        return {"elevation": [1100.0] * count}

    monkeypatch.setattr(flood_risk, "_http_get_json", fake_fetch)

    result = flood_risk_assessment(0.35, 32.6, use_cache=False)
    assert result["status"] == "available"
    assert result["samples"] == 11
    assert result["elevation_m"] == 1100.0
    assert result["band"] in {"Low", "Moderate", "Elevated", "High"}
    assert result["method"].startswith("Copernicus")


def test_assessment_results_are_cached(monkeypatch):
    calls = []

    def fake_fetch(url):
        calls.append(url)
        return {"elevation": [500.0] * 11}

    monkeypatch.setattr(flood_risk, "_http_get_json", fake_fetch)

    first = flood_risk_assessment(0.35, 32.6)
    second = flood_risk_assessment(0.35, 32.6)
    assert len(calls) == 1
    assert first["susceptibility_index"] == second["susceptibility_index"]
    assert second.get("cached") is True


def test_fetch_elevations_returns_none_on_exception(monkeypatch):
    def boom(url):
        raise TimeoutError("slow")

    monkeypatch.setattr(flood_risk, "_http_get_json", boom)
    assert fetch_elevations([(0.0, 0.0)]) is None
