"""Unit tests for NEMA Compliance REST API (Phase 2)."""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "spatial_cache" in data

def test_assess_plot_coordinates():
    # Test with valid coordinates (Lubigi wetland, Kampala)
    payload = {
        "lat": 0.3345,
        "lon": 32.5320,
        "plot_label": "Test Lubigi Plot"
    }
    response = client.post("/api/v1/assess-plot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["risk"]["score"] > 50  # Should be high risk
    assert data["location"]["lat"] == 0.3345

def test_assess_plot_invalid_location():
    # Test with missing coordinates
    payload = {"plot_label": "Nowhere"}
    response = client.post("/api/v1/assess-plot", json=payload)
    assert response.status_code == 400
    assert "Could not determine property coordinates" in response.json()["detail"]

def test_generate_and_verify_report():
    # 1. Generate - Use coordinates with cache coverage (Kampala area, safe location)
    gen_payload = {
        "lat": 0.3476,
        "lon": 32.5825,
        "plot_label": "Kampala Safe Plot"
    }
    gen_response = client.post("/api/v1/reports/generate", json=gen_payload)
    assert gen_response.status_code == 200
    gen_data = gen_response.json()
    cert_id = gen_data["certificate_id"]
    assert cert_id.startswith("NEMA-")

    # 2. Download
    down_response = client.get(f"/api/v1/reports/download/{cert_id}")
    assert down_response.status_code == 200
    assert down_response.headers["content-type"] == "application/pdf"

    # 3. Verify
    ver_response = client.get(f"/api/v1/verify/{cert_id}")
    assert ver_response.status_code == 200
    ver_data = ver_response.json()
    assert ver_data["status"] == "valid"

def test_feedback():
    payload = {
        "feedback_text": "API testing feedback",
        "meta": {"source": "pytest"}
    }
    response = client.post("/api/v1/feedback", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "recorded"
