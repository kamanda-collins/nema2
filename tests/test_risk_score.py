"""
tests/test_risk_score.py

Tests for the Property Risk Scorecard engine (plan Phase 1.1), including the
field benchmark coordinates required by the plan's verification strategy:
- Kampala / Lubigi wetland (0.3345, 32.5320)  -> High Risk / In Wetland
- Wakiso / Kira hilltop (0.3950, 32.6350)     -> Safe / Low Exposure
- Nairobi River corridor (-1.2864, 36.8172)   -> Riparian Buffer Alert
"""

from risk_score import (
    DISCLAIMER,
    assess_property_risk,
    detect_country,
    legal_references,
    statutory_buffer_m,
)


# --- Jurisdiction ----------------------------------------------------------------

def test_detect_country_uganda():
    assert detect_country(0.3476, 32.5825) == "Uganda"  # Kampala


def test_detect_country_kenya():
    assert detect_country(-1.2864, 36.8172) == "Kenya"  # Nairobi


def test_detect_country_unknown_outside_region():
    assert detect_country(51.5, -0.12) == "East Africa (unclassified)"  # London


def test_statutory_buffer_defaults():
    assert statutory_buffer_m("Uganda", "wetland") == 100
    assert statutory_buffer_m("Kenya", "waterway") == 30
    assert statutory_buffer_m("Nowhere") == 30  # default table


def test_legal_references_mention_expected_statutes():
    ug = " ".join(legal_references("Uganda"))
    ke = " ".join(legal_references("Kenya"))
    assert "National Environment Act, 2019" in ug
    assert "EMCA" in ke and "Water Act, 2016" in ke


def test_disclaimer_warns_about_statutory_clearance():
    assert "not a land survey" in DISCLAIMER
    assert "NEMA" in DISCLAIMER


# --- Plan field benchmarks ---------------------------------------------------------

def test_benchmark_lubigi_wetland_is_high_risk():
    """Lubigi wetland, Kampala — must trigger High Risk / In Wetland."""
    result = assess_property_risk(True, None, feature_kind="wetland", lat=0.3345, lon=32.5320)
    assert result.band == "High Risk"
    assert result.is_restricted
    assert result.traffic_light == "red"
    assert 0 <= result.score <= 59
    assert "INSIDE_MAPPED_WETLAND" in result.flags
    assert result.country == "Uganda"


def test_benchmark_kira_hilltop_is_safe():
    """Wakiso / Kira hilltop — must trigger Safe / Low Exposure."""
    result = assess_property_risk(False, 1200.0, feature_kind="wetland", lat=0.3950, lon=32.6350)
    assert result.band == "Safe"
    assert result.traffic_light == "green"
    assert 90 <= result.score <= 100


def test_benchmark_nairobi_riparian_corridor_alerts():
    """Nairobi River riparian corridor — must trigger a riparian buffer alert."""
    result = assess_property_risk(False, 50.0, feature_kind="waterway", lat=-1.2864, lon=36.8172)
    assert result.band == "High Risk"
    assert result.country == "Kenya"
    assert "RIPARIAN_CORRIDOR" in result.flags


# --- Band boundaries ---------------------------------------------------------------

def test_band_boundaries_match_plan():
    country = "Uganda"
    assert assess_property_risk(False, 1000, "wetland", country=country).band == "Safe"
    assert assess_property_risk(False, 500, "wetland", country=country).band == "Safe"
    assert assess_property_risk(False, 499, "wetland", country=country).band == "Caution"
    assert assess_property_risk(False, 100, "wetland", country=country).band == "Caution"
    # Inside the 100 m statutory buffer -> capped into the red band
    assert assess_property_risk(False, 99, "wetland", country=country).band == "High Risk"
    assert assess_property_risk(False, 30, "wetland", country=country).band == "High Risk"


def test_within_statutory_buffer_flag_and_headline():
    result = assess_property_risk(False, 60.0, "wetland", country="Uganda")
    assert "WITHIN_STATUTORY_BUFFER" in result.flags
    assert "100 m statutory buffer" in result.headline
    assert result.score <= 45


def test_unknown_distance_is_caution():
    result = assess_property_risk(False, None, country="Uganda")
    assert result.band == "Caution"
    assert "DISTANCE_UNKNOWN" in result.flags


def test_score_is_always_within_0_100():
    for distance in [0, 1, 29, 30, 99, 100, 199, 200, 499, 500, 999, 1000, 50000]:
        result = assess_property_risk(False, distance, "waterway", country="Kenya")
        assert 0 <= result.score <= 100


def test_to_dict_contains_key_fields():
    result = assess_property_risk(False, 300.0, "wetland", lat=0.3476, lon=32.5825)
    payload = result.to_dict()
    assert payload["score"] == result.score
    assert payload["country"] == "Uganda"
    assert payload["statutory_buffer_m"] == 100
    assert payload["in_wetland"] is False
