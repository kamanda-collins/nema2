"""
tests/test_phase4.py

Tests for Phase 4 features:
- 4.1 White-label branding: validation, tier gating, PDF co-branding
- 4.2 Cadastral block/plot search against a local GeoPackage registry
- 4.3 B2B batch screening endpoint gating and behaviour
"""

import geopandas as gpd
import pytest
from fastapi.testclient import TestClient
from shapely.geometry import box

import storage
import branding as branding_mod
from cadastral import cadastral_available, search_parcel
from certificate import build_certificate_pdf
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_db(monkeypatch, tmp_path):
    db_path = str(tmp_path / "app_data.db")
    monkeypatch.setattr(storage, "DEFAULT_DB_PATH", db_path)
    yield db_path


# --- 4.1 Branding module ----------------------------------------------------------------

def test_validate_branding_defaults_and_clamping():
    brand = branding_mod.validate_branding(
        {"agency_name": "  Kira   Estates ", "watermark_text": "kira est 2024", "accent_color": "nope", "junk": 1}
    )
    assert brand.agency_name == "Kira Estates"  # whitespace collapsed
    assert brand.watermark_text == "KIRA EST 2024"  # uppercased for watermark
    assert brand.accent_color == branding_mod._DEFAULT_ACCENT  # bad colour -> fallback
    assert "junk" not in brand.to_dict()


def test_validate_branding_accepts_hex_and_none():
    assert branding_mod.validate_branding({"accent_color": "#FF5722"}).accent_color == "#FF5722"
    assert branding_mod.validate_branding(None).agency_name  # defaults populated
    assert branding_mod.validate_branding("not a dict").agency_name  # defensive


def test_branding_allowed_tiers():
    assert branding_mod.branding_allowed("pro") is True
    assert branding_mod.branding_allowed("law_firm") is True
    assert branding_mod.branding_allowed("free") is False
    assert branding_mod.branding_allowed("instant") is False
    assert branding_mod.branding_allowed(None) is False


def test_certificate_with_branding_builds_pdf():
    risk = {
        "score": 85, "band": "Safe", "label": "Safe", "color": "#2e7d32",
        "country": "Uganda", "statutory_buffer_m": 100, "headline": "ok",
        "guidance": "", "legal_references": [], "in_wetland": False, "flags": [],
    }
    pdf = build_certificate_pdf(
        risk=risk, lat=0.35, lon=32.6, include_map=False,
        branding={"agency_name": "Kira Estates LLP", "watermark_text": "Kira Estates", "accent_color": "#1b5e20"},
    )
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 1000


def test_certificate_without_branding_still_builds():
    risk = {
        "score": 40, "band": "High Risk", "label": "High Risk", "color": "#c62828",
        "country": "Kenya", "statutory_buffer_m": 30, "headline": "ok",
        "guidance": "", "legal_references": [], "in_wetland": True, "flags": [],
    }
    pdf = build_certificate_pdf(risk=risk, lat=-1.28, lon=36.82, include_map=False)
    assert pdf.startswith(b"%PDF")


# --- 4.2 Cadastral search -----------------------------------------------------------------

@pytest.fixture
def registry_gpkg(tmp_path):
    """Build a tiny two-parcel cadastral registry in UTM 36N (Uganda)."""
    parcels = gpd.GeoDataFrame(
        {
            "Block": ["B42", "B07"],
            "Plot": ["1234", "0055"],
            "ParcelName": ["Kira Road Plot", "Entebbe Road Plot"],
            "geometry": [
                box(452000, 38600, 452030, 38630),   # ~ Kampala
                box(452100, 38700, 452140, 38740),
            ],
        },
        crs="EPSG:32636",
    )
    path = str(tmp_path / "cadastral_test.gpkg")
    parcels.to_file(path, driver="GPKG")
    return path


def test_cadastral_not_available_without_registry():
    info = cadastral_available(gpkg_path="Z:/does/not/exist.gpkg")
    assert info["available"] is False
    assert "Coordinate-based screening is unaffected" in info["message"]


def test_cadastral_search_finds_parcel(registry_gpkg):
    result = search_parcel("B42", "1234", gpkg_path=registry_gpkg)
    assert result["status"] == "found"
    assert result["parcel_name"] == "Kira Road Plot"
    assert 32.0 < result["centroid"]["lon"] < 33.0
    assert 0.0 < result["centroid"]["lat"] < 1.0
    assert result["area_m2"] == pytest.approx(900, rel=0.15)
    assert result["geometry_geojson"]["type"] == "Polygon"


def test_cadastral_search_is_case_and_dash_insensitive(registry_gpkg):
    assert search_parcel("b-42", "1234", gpkg_path=registry_gpkg)["status"] == "found"
    assert search_parcel("B07", "55", gpkg_path=registry_gpkg)["status"] == "found"  # "0055" -> "55"


def test_cadastral_search_reports_missing_parcel(registry_gpkg):
    result = search_parcel("B42", "9999", gpkg_path=registry_gpkg)
    assert result["status"] == "not_found"


def test_cadastral_search_requires_both_values():
    with pytest.raises(ValueError):
        search_parcel("", "1234")
    with pytest.raises(ValueError):
        search_parcel("B42", "  ")


# --- API: batch + cadastral + branding gates ------------------------------------------------

def _make_key(db_path, tier):
    return storage.create_api_key("Tester", tier=tier, db_path=db_path)["key"]


def test_cadastral_status_endpoint():
    resp = client.get("/api/v1/cadastral/status")
    assert resp.status_code == 200
    assert resp.json()["available"] in (True, False)


def test_cadastral_search_endpoint_not_available():
    resp = client.get("/api/v1/cadastral/search", params={"block": "B42", "plot": "1234"})
    assert resp.status_code == 200
    assert resp.json()["status"] in ("not_available", "not_found", "found")


def test_cadastral_search_endpoint_requires_params():
    resp = client.get("/api/v1/cadastral/search", params={"block": "B42"})
    assert resp.status_code == 422  # missing plot query param


def test_batch_requires_law_firm_tier_402(isolated_db):
    pro_key = _make_key(isolated_db, "pro")
    resp = client.post(
        "/api/v1/batch/assess",
        json={"plots": [{"lat": 0.35, "lon": 32.6, "label": "P1"}]},
        headers={"X-API-Key": pro_key},
    )
    assert resp.status_code == 402


def test_batch_rejects_anonymous():
    resp = client.post(
        "/api/v1/batch/assess",
        json={"plots": [{"lat": 0.35, "lon": 32.6, "label": "P1"}]},
    )
    assert resp.status_code == 402


def test_batch_screens_all_plots_for_law_firm(isolated_db):
    key = _make_key(isolated_db, "law_firm")
    resp = client.post(
        "/api/v1/batch/assess",
        json={
            "plots": [
                {"lat": 0.3345, "lon": 32.5320, "label": "Lubigi"},
                {"lat": 0.3476, "lon": 32.5825, "label": "Kampala Hill"},
            ]
        },
        headers={"X-API-Key": key},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["count"] == 2
    by_label = {r["label"]: r for r in data["results"]}
    assert all(r["status"] == "success" for r in data["results"])
    # Both plots must be scored and must differ (Lubigi is 275 m from wetland -> Caution,
    # Kampala Hill is 76 m -> High Risk / statutory buffer).
    assert by_label["Lubigi"]["band"] == "Caution"
    assert by_label["Kampala Hill"]["band"] == "High Risk"
    assert by_label["Lubigi"]["score"] > by_label["Kampala Hill"]["score"]
    # usage recorded once for the whole batch
    record = storage.get_api_key(key, db_path=isolated_db)
    assert record["requests_used"] == 1


def test_custom_branding_requires_paid_tier(isolated_db):
    anon = client.post(
        "/api/v1/reports/generate",
        json={"lat": 0.35, "lon": 32.6, "branding": {"agency_name": "Someone"}},
    )
    assert anon.status_code == 402
    assert "White-label" in anon.json()["detail"]

    free_key = _make_key(isolated_db, "free")
    free = client.post(
        "/api/v1/reports/generate",
        json={"lat": 0.35, "lon": 32.6, "branding": {"agency_name": "Someone"}},
        headers={"X-API-Key": free_key},
    )
    assert free.status_code == 402


def test_pro_tier_gets_custom_branding_certificate(isolated_db):
    key = _make_key(isolated_db, "pro")
    resp = client.post(
        "/api/v1/reports/generate",
        json={
            "lat": 0.3476, "lon": 32.5825,
            "branding": {"agency_name": "Kira Estates LLP", "watermark_text": "KIRA", "accent_color": "#1b5e20"},
        },
        headers={"X-API-Key": key},
    )
    assert resp.status_code == 200
    cert_id = resp.json()["certificate_id"]
    download = client.get(f"/api/v1/reports/download/{cert_id}")
    assert download.status_code == 200
    assert download.content.startswith(b"%PDF")
