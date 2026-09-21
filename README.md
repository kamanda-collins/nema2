# Plot Screener

> Current product position: a preliminary mapped-signal check to use before
> paying a land deposit. It is not clearance, a cadastral survey, title search,
> legal advice, or a NEMA decision. Check `updates.md` before enabling reports
> or payments in any deployed environment.

A property due-diligence platform for wetland & water risk checks on land in Uganda and Kenya — **built for real estate**: plot buyers, sellers, agents, developers and investors. Pick any plot and the app automatically fetches mapped wetlands, lakes, rivers and streams around it from OpenStreetMap (no GIS files needed), then tells you what the proximity means for your purchase or development decision — including NEMA compliance implications.

It remains useful for environmental consultants and regulators doing rapid NEMA screening of development sites near sensitive wetland ecosystems.

## Repository Layout

The project ships three coordinated surfaces on top of one shared analysis core:

| Path | Surface | Purpose |
| --- | --- | --- |
| pp.py | Streamlit | The original interactive desktop/analyst experience |
| main.py, pi/ | FastAPI | Headless REST API — plot screening, PDF certificates, billing, payments |
| webapp/ | Next.js 14 | Mobile-first due-diligence app (MapLibre GL, no iframe) |

Shared analysis modules used by all three: 
isk_score.py (0-100 traffic-light scorecard), location_input.py (landmark / map-link / DMS / coordinate parsing), certificate.py (2-page stamped PDF with QR + buffer-ring map), storage.py (SQLite), wetland_cache.py (indexed GeoPackage), spatial_db.py (optional PostGIS), osm_data.py (Overpass), lood_risk.py (Copernicus DEM), randing.py (white-label), cadastral.py (block/plot registry).

### Running the full stack

`ash
# 1. Backend API (screening, certificates, billing)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Web app
cd webapp && npm install && npm run dev      # http://localhost:3000

# 3. Original Streamlit app (optional)
streamlit run app.py
`

Optional infrastructure — Redis (Celery worker/scheduler), PostGIS (faster spatial queries) and payment gateway credentials — is **optional by design**: without it the API degrades gracefully (DISABLE_POSTGIS=1, 
ot_configured, unavailable) instead of failing.

### Validation

`ash
python -m pytest tests/ -q                    # 208 tests passing
node tools/check_webapp_syntax.mjs            # TypeScript syntax for webapp/
python tools/verify_webapp_contract.py        # frontend <-> backend contract
`

## 📦 Archived modules

Legacy code that disagrees with the current architecture lives under rchive/ rather than being deleted outright:

- rchive/legacy-streamlit/ — atch_processing.py, data_sources.py, export_static_map.py, memory_monitor.py, interactive_input.py, static_map_export.py. The Streamlit-era modules that predate the FastAPI decoupling. pp.py imports them lazily inside the functions that use them.
- rchive/legacy-tests/ — 	est_app.py, 	est_map_fix.py, 	est_report_logic.py. Smoke tests for the old Streamlit HTTPS fix, the Stamen basemap removal, and the batch risk-level thresholds; superseded by 	ests/.
- rchive/legacy-web/ — public/, static/, website_integration.html, widget_integration.html, README-web.md, package.json, ercel.json, setup-github.sh. The old static-site deployment story; replaced by webapp/.
- rchive/bytecode/ — __pycache__/ and .pyc files from previous runs.

## 🌍 What This App Does

### Core Functionality
- **Live OpenStreetMap Data (default)**: Wetlands, water bodies and waterways are fetched automatically around your plot via the Overpass API — zero file preparation
- **Wetland Proximity Analysis**: Automatically detects wetlands within specified buffer zones around project sites
- **Environmental Impact Assessment**: Analyzes potential impacts based on proximity, wetland types, and project characteristics
- **Compliance Reporting**: Generates detailed compliance reports with recommendations and regulatory requirements
- **Interactive Mapping**: Provides interactive maps showing project sites, nearby wetlands, and analysis areas
- **Static Map Export**: Creates high-quality PNG maps for reports and documentation
- **Batch Processing**: Handles multiple project sites simultaneously for efficiency

### Key Features
- **Multi-Source Data Integration**: Combines OpenStreetMap wetland data with local GIS datasets
- **Regulatory Compliance**: Aligned with NEMA (National Environment Management Authority) guidelines
- **Risk Assessment**: Categorizes environmental risk levels (0-100 score with Low, Medium, High, Critical bands)
- **Professional Reporting**: Generates 2-page stamped PDF certificates with QR codes and buffer maps
- **Mobile-Optimized**: Next.js 14 responsive design works seamlessly on mobile and touch devices
- **Memory Efficient**: Optimized for cloud deployment with intelligent batch processing

## 🛠️ Technical Overview

### Core Python Modules
- main.py & pi/: FastAPI endpoints for screening, certificate issuance, batch processing, and payment webhooks.
- 
isk_score.py: Distance-driven 0-100 risk scoring algorithm matching regulatory buffer bands.
- location_input.py: Flexible parser for Google Maps links, DMS coordinates, decimal lat/lon, and landmark names.
- certificate.py: ReportLab PDF generator creating 2-page verification certificates with buffer ring maps and QR codes.
- 
eport_logic.py & geo_utils.py: Core spatial logic and UTM coordinate projection helpers.
- storage.py: SQLite ledger for search history, payment status, and issued certificate records.

### Technical Specifications
- **Data Source**: OpenStreetMap (Overpass API) wetlands, water bodies & waterways — plus optional local GeoPackages
- **Projections**: Automatic UTM zone selection (36N/37N or southern equivalents) for meter-accurate distances and buffers
- **Coverage**: Uganda, Kenya, and surrounding East African regions

## 📜 License and Compliance

This application is designed to support environmental compliance and conservation efforts.

**Note**: This tool provides preliminary environmental screening. Official Environmental Impact Assessments should include field surveys, stakeholder consultation, and comprehensive analysis by qualified environmental professionals.
