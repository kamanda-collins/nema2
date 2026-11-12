# Plot Screener

> Current product position: a preliminary mapped-signal check to use before
> paying a land deposit. It is not clearance, a cadastral survey, title search,
> legal advice, or a NEMA decision. Check `updates.md` before enabling reports
> or payments in any deployed environment.
> Market strategy (segments, pricing, feature rewiring) lives in `MARKET_STRATEGY.md`.

A property due-diligence platform for wetland & water risk checks on land in
Uganda and Kenya — **built for real estate**: plot buyers, sellers, agents,
developers and investors. Pick any plot and the app automatically fetches mapped
wetlands, lakes, rivers and streams around it from OpenStreetMap (no GIS files
needed), then explains what the proximity means for your purchase or development
decision, including NEMA compliance implications.

It remains useful for environmental consultants and regulators doing rapid NEMA
screening of development sites near sensitive wetland ecosystems.

## Repository Layout

The project ships three coordinated surfaces on top of one shared analysis core:

| Path | Surface | Purpose |
| --- | --- | --- |
| `app.py` | Streamlit | The original interactive desktop/analyst experience |
| `main.py`, `api/` | FastAPI | Headless REST API — plot screening, PDF certificates, billing, payments |
| `webapp/` | Next.js 14 | Mobile-first due-diligence app (MapLibre GL, no iframe) |

Shared analysis modules used by all three: `risk_score.py` (0-100 traffic-light
scorecard), `location_input.py` (landmark / map-link / DMS / coordinate
parsing), `certificate.py` (2-page stamped PDF with QR + buffer-ring map),
`storage.py` (SQLite), `wetland_cache.py` (indexed GeoPackage), `spatial_db.py`
(optional PostGIS), `osm_data.py` (Overpass), `flood_risk.py` (Copernicus DEM),

### Running the full stack

```bash
# 1. Backend API (screening, certificates, billing)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Web app
cd webapp && npm install && npm run dev      # http://localhost:3000

# 3. Original Streamlit app (optional)
streamlit run app.py
```

Optional infrastructure — Redis (Celery worker/scheduler), PostGIS (faster
spatial queries) and payment gateway credentials — is **optional by design**:
without it the API degrades gracefully (`DISABLE_POSTGIS=1`, `not_configured`,
`unavailable`) instead of failing.

### Validation

```bash
python -m pytest tests/ -q                    # 213 tests passing
node tools/check_webapp_syntax.mjs            # TypeScript syntax for webapp/
python tools/verify_webapp_contract.py        # frontend <-> backend contract
```

### Enabling gated features

Report issuance and self-service payments are **off by default** (see
`updates.md`). They stay off until the data-provenance, reviewer-workflow and
payment-reconciliation controls are in place:

| Variable | Default | Effect when `true` |
| --- | --- | --- |
| `ENABLE_PROFESSIONAL_REPORTS` | `false` | Enables `/api/v1/reports/*` for provisioned non-free keys |
| `ENABLE_SELF_SERVICE_PAYMENTS` | `false` | Enables `/api/v1/payments/initiate` (Pesapal / Flutterwave) |
| `ADMIN_API_TOKEN` | unset | Required for tier activation and retention cleanup |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Browser origins allowed to call the API |
| `PUBLIC_WEB_URL` | local web app | Origin used in certificate verification links |

Certificate entitlement is **credit-based** for the `instant` tier: a verified
payment adds `certificate_credits` to the key, and each issued report spends one.

`branding.py` (white-label), `cadastral.py` (block/plot registry).

## 📦 Archived modules

Legacy code that disagrees with the current architecture lives under `archive/`
rather than being deleted outright:

- `archive/legacy-streamlit/` — `batch_processing.py`, `data_sources.py`,
  `export_static_map.py`, `memory_monitor.py`, `interactive_input.py`,
  `static_map_export.py`. The Streamlit-era modules that predate the FastAPI
  decoupling. `app.py` imports them lazily inside the functions that use them.
- `archive/legacy-tests/` — `test_app.py`, `test_map_fix.py`,
  `test_report_logic.py`. Smoke tests for the old Streamlit HTTPS fix, the
  Stamen basemap removal, and the batch risk-level thresholds; superseded by
  `tests/`.
- `archive/legacy-web/` — `public/`, `static/`, `website_integration.html`,
  `widget_integration.html`, `README-web.md`, `package.json`, `vercel.json`,
  `setup-github.sh`. The old static-site deployment story; replaced by `webapp/`.
- `archive/bytecode/` — `__pycache__/` and `.pyc` files from previous runs.

## 🌍 What This App Does

### Core Functionality

- **Live OpenStreetMap Data (default)**: wetlands, water bodies and waterways
  are fetched automatically around your plot via the Overpass API — zero file
  preparation
- **Wetland Proximity Analysis**: detects mapped water features within the
  configured buffer zones around a plot
- **Screening Assessment**: relates proximity, feature type and detectability to
  a preliminary risk signal
- **Indicative Reporting**: generates a screening report with recommendations and
  the applicable statutory references (professional reports are gated — see above)
- **Interactive Mapping**: MapLibre GL map showing the plot, nearby features and
  the buffer rings
- **Batch Processing**: screens multiple plots in one call (Law Firm / Surveyor
  Pack)

### Key Features

- **Multi-Source Data Integration**: combines OpenStreetMap wetland data with
  local GeoPackage/PostGIS layers, and reports which sources were used
- **Regulatory Context**: cites NEMA (National Environment Management Authority)
  and Water Act riparian guidance for the detected jurisdiction
- **Risk Signal**: a 0-100 score with a traffic-light band (red / yellow / green)
  computed from **distance**, not from the score itself
- **Provenance Warnings**: results built only on community-mapped data are
  labelled `community_or_unverified` rather than presented as verified
- **Mobile-Optimized**: Next.js 14 responsive design with touch-native map
  gestures and no `<iframe>` embed


## 🛠️ Technical Overview

### Core Python Modules

- `main.py` & `api/`: FastAPI endpoints for screening, certificate issuance,
  batch processing and payment callbacks.
- `risk_score.py`: distance-driven 0-100 scoring with the statutory buffer
  reference for the detected country and feature kind.
- `location_input.py`: parser for Google Maps links, DMS coordinates, decimal
  lat/lon and landmark names.
- `certificate.py`: PDF generator producing the 2-page report with buffer-ring
  map and QR verification code.
- `report_logic.py` & `geo_utils.py`: spatial logic (wetland intersection,
  minimum distance) and automatic UTM projection helpers.
- `storage.py`: SQLite persistence for feedback, audit events, issued
  certificates, API keys and pay-per-certificate credits.
- `billing.py` / `payments.py`: tier catalog, quota evaluation and the Pesapal /
  Flutterwave adapters (MTN MoMo, Airtel Money, M-Pesa, cards).

### Technical Specifications

- **Data Source**: OpenStreetMap (Overpass API) wetlands, water bodies &
  waterways — plus optional local GeoPackages or PostGIS layers
- **Projections**: automatic UTM zone selection (36N/37N or southern
  equivalents) for metre-accurate distances and buffers
- **Coverage**: Uganda, Kenya and surrounding East African regions

### Project Layout (core Python modules)

```
├── app.py                  # Streamlit application (UI, map, report downloads)
├── report_logic.py         # Compliance engine: intersection, distances, report render
├── geo_utils.py            # GIS helpers: geopandas compat, automatic UTM zone selection
├── risk_score.py           # 0-100 traffic-light scorecard + statutory buffers
├── certificate.py          # PDF report with buffer-ring map and QR code
├── location_input.py       # Landmark / map-link / DMS / coordinate parsing
├── wetland_cache.py        # PostGIS -> GeoPackage -> live OSM fallback chain
├── storage.py              # SQLite: feedback, events, certificates, keys, credits
├── report_template.md.j2   # Jinja2 template for the screening report
└── tests/                  # Headless pytest suite (213 tests)
```

### Key Behaviours

- **Distances** are measured from the **plot boundary** (not its centroid) to
  match buffer guidance.
- **UTM zones** are selected automatically per plot (Uganda: 36N; Kenya:
  36N/37N, southern-hemisphere zones handled).
- Screening is **fail-safe**: empty or CRS-less inputs return a
  "not detected" result with a warning instead of crashing.
- A `No mapped signal` result is **not** clearance — unmapped or seasonal
  features may still exist.

## 📜 License and Compliance

This application supports environmental compliance and conservation efforts.
Users are responsible for verifying data accuracy for official submissions,
following local regulatory requirements, and conducting field verification.

**Note**: This tool provides preliminary environmental screening. Official
Environmental Impact Assessments should include field surveys, stakeholder
consultation, and comprehensive analysis by qualified environmental
professionals.

