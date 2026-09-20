"""
verify_webapp_contract.py

Cross-checks the FastAPI response shapes against the fields the Next.js
frontend actually reads (webapp/lib/types.ts + the components). Run before
committing frontend changes so the two halves cannot drift apart.

Usage: python tools/verify_webapp_contract.py
"""

import json
import os
import sys
from pathlib import Path

os.environ.setdefault("DISABLE_POSTGIS", "1")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402

client = TestClient(main.app)

# Fields each frontend component destructures. Missing keys => broken UI.
REQUIRED = {
    "/health": [],
    "/api/v1/billing/plans": ["status", "plans"],
    "/api/v1/cadastral/status": ["available"],
}


def check_keys(label, payload, keys):
    missing = [k for k in keys if k not in payload]
    status = "FAIL" if missing else "ok  "
    print(f"{status} {label:34} keys={sorted(payload)[:9]}")
    if missing:
        print(f"       MISSING: {missing}")
    return not missing


ok = True

print("=== simple GET endpoints ===")
for path, keys in REQUIRED.items():
    resp = client.get(path)
    print(f"     {path} -> HTTP {resp.status_code}")
    if resp.status_code != 200:
        ok = False
        continue
    ok &= check_keys(path, resp.json(), keys)

print("\n=== /api/v1/billing/plans detail ===")
plans = client.get("/api/v1/billing/plans").json()["plans"]
assert isinstance(plans, dict), "frontend types.ts declares plans as a keyed object"
plan_keys = ["plan_id", "title", "price_display", "currency", "amount",
             "reports_per_month", "certificates", "includes"]
for plan_id, plan in plans.items():
    ok &= check_keys(f"plan[{plan_id}]", plan, plan_keys)

print("\n=== POST /api/v1/assess-plot (fields RiskScorecard.tsx reads) ===")
resp = client.post(
    "/api/v1/assess-plot",
    json={"lat": 0.3476, "lon": 32.5825, "width_m": 30, "length_m": 30,
          "plot_label": "Contract check plot", "include_flood_risk": False},
)
print(f"     HTTP {resp.status_code}")
if resp.status_code == 200:
    body = resp.json()
    ok &= check_keys("AssessPlotResponse", body,
                     ["status", "location", "risk", "compliance", "provenance"])
    ok &= check_keys("location", body["location"],
                     ["lat", "lon", "label", "input_method", "width_m", "length_m"])
    ok &= check_keys("risk", body["risk"],
                     ["score", "band", "traffic_light", "flags", "country",
                      "statutory_buffer_m", "headline", "guidance", "legal_references"])
    ok &= check_keys("compliance", body["compliance"],
                     ["in_wetland", "wetland_names", "min_distance_meters",
                      "nearest_feature_kind"])
    ok &= check_keys("provenance", body["provenance"], ["source", "message"])
    print(f"     sample: score={body['risk']['score']} band={body['risk']['band']} "
          f"light={body['risk']['traffic_light']}")

    # The UI sorts on traffic_light, so the vocabulary must stay stable.
    if body["risk"]["traffic_light"] not in ("green", "yellow", "red"):
        print(f"FAIL traffic_light '{body['risk']['traffic_light']}' not in green/yellow/red")
        ok = False

    # The "How the score works" copy in webapp/app/page.tsx advertises these
    # ranges, and risk_score.py produces them from DISTANCE (not the score), so
    # assert every reachable band/score pair the UI can display.
    print("\n=== band <-> score ranges advertised by the web UI ===")
    BAND_RANGE = {"High Risk": (0, 45), "Caution": (60, 89), "Safe": (90, 100)}
    from risk_score import assess_property_risk  # noqa: E402

    cases = [
        ("in wetland", assess_property_risk(True, None, feature_kind="wetland",
                                            lat=0.3345, lon=32.5320)),
        ("inside buffer", assess_property_risk(False, 10.0, feature_kind="wetland",
                                               lat=0.3476, lon=32.5825)),
        ("riparian corridor", assess_property_risk(False, 30.0, feature_kind="waterway",
                                                   lat=0.3476, lon=32.5825)),
        ("within 500 m", assess_property_risk(False, 275.0, feature_kind="wetland",
                                              lat=0.3476, lon=32.5825)),
        ("distance unknown", assess_property_risk(False, None, feature_kind=None,
                                                  lat=0.3476, lon=32.5825)),
        ("clear (>500 m)", assess_property_risk(False, 1200.0, feature_kind="wetland",
                                                lat=0.3950, lon=32.6350)),
    ]
    for name, sc in cases:
        lo, hi = BAND_RANGE.get(sc.band, (None, None))
        within = lo is not None and lo <= sc.score <= hi
        print(f"{'ok  ' if within else 'FAIL'} {name:20} score={sc.score:3} "
              f"band={sc.band:10} light={sc.traffic_light:6} expected {lo}-{hi}")
        if not within:
            ok = False
else:
    ok = False

print("\n=== GET /api/v1/cadastral/search (CadastralSearch.tsx) ===")
resp = client.get("/api/v1/cadastral/search", params={"block": "B42", "plot": "55"})
print(f"     HTTP {resp.status_code}")
if resp.status_code == 200:
    body = resp.json()
    ok &= check_keys("CadastralSearchResponse", body, ["status"])
    if "available" in body:
        print("     registry unavailable -> UI shows the graceful fallback notice")
else:
    ok = False

print("\n=== GET /api/v1/verify/{id} (verify page) ===")
resp = client.get("/api/v1/verify/NOPE-404")
print(f"     HTTP {resp.status_code}")
if resp.status_code == 200:
    ok &= check_keys("VerifyResponse", resp.json(), ["status", "certificate_id"])
else:
    ok = False

print("\n=== POST /api/v1/batch/assess gate (batch page) ===")
resp = client.post("/api/v1/batch/assess",
                   json={"plots": [{"lat": 0.3476, "lon": 32.5825, "label": "x"}]})
print(f"     HTTP {resp.status_code} (402 expected without a law_firm key)")
if resp.status_code != 402:
    print("FAIL the batch page relies on a 402 to trigger its upgrade prompt")
    ok = False

print("\n" + ("ALL FRONTEND CONTRACTS MATCH" if ok else "CONTRACT MISMATCH DETECTED"))
raise SystemExit(0 if ok else 1)
