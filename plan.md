# Production Blueprint & Implementation Plan: NEMA Wetlands Compliance & Property Due Diligence

> **Superseded in parts:** see `MARKET_STRATEGY.md` (Nov 2026) — it rewires the
> segment order (diaspora first), repositions the report around title-fraud signals,
> adds the Diaspora Express SKU and defers the B2B portal work. Where the two
> documents disagree, the strategy document wins.

## Executive Summary

The **NEMA Wetlands Compliance Checker** is transitioning from a technical, GIS-oriented Streamlit prototype into a commercial **PropTech Property Due Diligence Platform** tailored for Uganda and Kenya. 

In East Africa, land fraud, forged land titles over gazetted wetlands, and subsequent government demolitions by NEMA and water authorities represent one of the single biggest financial risks for land buyers, diaspora investors, real estate agents, and mortgage lenders.

This document details the complete transformation of the system across four progressive phases:
1. **Phase 1 (Immediate Enhancements & Fixes)**: Real estate UX overhaul, local indexed vector caching, replacing current raw Geofabrik shapefiles with official/curated NEMA datasets, and generating bank-grade PDF certificates.
2. **Phase 2 (Production Decoupling & Architecture)**: Migrating from an iframe-embedded Streamlit app to a high-performance **FastAPI + PostGIS + Next.js (MapLibre GL)** stack.
3. **Phase 3 (Monetization & Risk Expansion)**: Mobile Money payment gateways (M-Pesa, MTN MoMo, Airtel Money), freemium paywalls, and flood/elevation risk modeling (DEM).
4. **Phase 4 (B2B, Cadastral & Portal API)**: Agency white-labeling, batch cadastral scanning, and B2B API integrations for real estate classifieds and banks.

---

## 1. Key Considerations & Critical Solutions

### A. Official Data Sourcing vs. Crowdsourced OSM
- **Current Issue**: The preloaded shapefiles (`wetland_shp/gis_osm_water_a_free_1.shp` and `gis_osm_waterways_free_1.shp`) are uncurated OpenStreetMap exports from Geofabrik. Relying strictly on OSM creates major liability if a wetland is unmapped.
- **Solution**:
  1. Ingest official Uganda National Wetlands Information System (NWIS / WRI / Ministry of Water and Environment) gazetted wetland layers.
  2. Ingest Kenya Water Resources Authority (WRA / NEMA Kenya) riparian reserves and water bodies.
  3. Merge and compile these into an optimized, spatially indexed **GeoPackage (`data/wetlands_east_africa.gpkg`)** or **GeoParquet** file.
  4. Use bounding-box spatial window reads (`fiona` / `pyogrio`) so memory footprint remains minimal (<50MB RAM) while query time drops to under 100 milliseconds.

### B. Legal Disclaimer & Risk Ratings
- Automated checks are an environmental screening tool indicating statutory proximity to gazetted zones. Every report must feature clear statutory references (Uganda National Environment Act 2019; Kenya EMCA 1999 & Water Act 2016) and a formal disclaimer noting that official clearance requires an on-site cadastral review and NEMA certificate.

---

## 2. Phase-by-Phase Roadmap

```
Phase 1: Rapid Prototype Hardening (Current Codebase)
  ├── 1.1 Real Estate UI/UX Revamp (Hide GIS/EMS forms, 1-click property check)
  ├── 1.2 Official NEMA GeoPackage & Local Spatial Index (Eliminate Overpass API latency)
  ├── 1.3 Bank-Grade Property Due Diligence PDF Certificate
  └── 1.4 Persistent SQLite storage for feedback and audit logs

Phase 2: Production Decoupled Architecture (Month 1)
  ├── 2.1 FastAPI Spatial REST API
  ├── 2.2 PostgreSQL + PostGIS (Sub-50ms indexed spatial joins)
  ├── 2.3 Next.js + Tailwind + MapLibre GL (Touch-native mobile app, no iframe)
  └── 2.4 Async Task Worker (Celery / Redis) for heavy exports

Phase 3: Monetization & Risk Modeling (Month 2)
  ├── 3.1 Mobile Money Integration (MTN MoMo, Airtel Money, M-Pesa via Pesapal / Flutterwave)
  ├── 3.2 Freemium Paywall (Free basic score vs. Paid stamped certificate)
  └── 3.3 Topography & Flood Risk Modeling (Copernicus 30m DEM)

Phase 4: B2B & Cadastral Scale (Month 3+)
  ├── 4.1 Realtor White-Label Portal (Co-branded agency certificates)
  ├── 4.2 Cadastral Block / Title Matching (Search by Block & Plot)
  └── 4.3 B2B Screening API for Property Portals & Mortgage Banks
```

---

## 3. Detailed Specifications

### Phase 1: Immediate Enhancements to Current Codebase (Week 1–2)

#### 1.1 Real Estate UI/UX Overhaul
- **File**: `app.py`, `interactive_input.py`
- Remove GIS jargon from the primary interface ("Shapefile ZIP", "OGC WFS", "ArcGIS REST", "EMS Overview", "Audits Summary") and place them under an *"Advanced / Environmental Consultant Mode"* toggle.
- Create 3 user-friendly input methods:
  1. **Landmark / Town Search** (e.g., "Kira", "Entebbe", "Ruiru", "Naivasha").
  2. **Paste Google Maps / WhatsApp Location Link** (auto-parse lat/long coordinates).
  3. **Drop a Pin / Draw Plot Boundary** directly on high-resolution satellite imagery.
- Introduce the **Property Risk Scorecard (Traffic Light)**:
  - 🟢 **90–100 (Safe / Low Exposure)**: >500m from wetlands/rivers.
  - 🟡 **60–89 (Caution / Buffer Zone)**: 100m–500m proximity; drainage & NEMA screening recommended.
  - 🔴 **0–59 (High Risk / Restricted)**: Inside mapped wetland or within 100m statutory buffer.

#### 1.2 Official Data Replacement & Local Spatial Caching
- **Files**: `data_sources.py`, `osm_data.py`, `wetland_shp/`
- Download official wetland data (MWE/NWIS Uganda, NEMA/WRA Kenya).
- Package them into an indexed GeoPackage (`data/wetlands_east_africa.gpkg`).
- Query locally via bounding boxes (`pyogrio` / `geopandas.read_file(bbox=...)`).
- Fallback gracefully to Overpass API only for areas outside the preloaded boundaries.

#### 1.3 Bank-Grade "Property Due Diligence Certificate" (PDF)
- **Files**: `report_logic.py`, `report_template.md.j2`, `static_map_export.py`
- Replace raw Markdown/Word exports with an official, 2-page PDF Certificate:
  - Verification ID & timestamp.
  - Risk gauge & statutory distance breakdown.
  - High-res satellite context map with plot footprint and buffer rings (30m, 100m, 500m).
  - Legal citations under the National Environment Act 2019 (Uganda) or EMCA (Kenya).
  - QR code linking to digital verification record.

#### 1.4 Persistent Storage & Cloud Stability
- Replace ephemeral `feedback.txt` with a lightweight SQLite database (`data/app_data.db`).
- Cache static map tiles locally to prevent HTTP timeouts during map generation.

---

### Phase 2: Production-Grade Decoupled Architecture (Month 1)

#### 2.1 Backend (FastAPI + Python)
- Endpoints:
  - `POST /api/v1/assess-plot`: Accepts coordinates or polygon; returns risk classification, nearest water bodies, and distance.
  - `POST /api/v1/reports/generate`: Asynchronously compiles official PDF certificate.
  - `GET /api/v1/verify/{certificate_id}`: Public certificate verification endpoint.
- Asynchronous spatial execution via PostGIS.

#### 2.2 Database (PostgreSQL + PostGIS)
- Spatially indexed (`GIST`) official wetland tables:
  ```sql
  CREATE INDEX idx_wetlands_geom ON gazetted_wetlands USING GIST(geom);
  ```
- Instant proximity queries (`ST_DWithin`, `ST_Distance`) executing in **< 15ms**.

#### 2.3 Frontend (Next.js + Tailwind + MapLibre GL)
- Modern mobile-first UI with touch gestures.
- Elimination of the iframe embed (`public/index.html`).
- Fast vector tile rendering and instant load times.

#### 2.4 Asynchronous Task Queue (Celery / Redis)
- Background processing for high-DPI satellite map rendering and PDF generation.

---

### Phase 3: Monetization & Risk Modeling (Month 2)

#### 3.1 Payment Gateway Integration
- Integrate **Pesapal** and **Flutterwave** for:
  - **Uganda**: MTN Mobile Money, Airtel Money.
  - **Kenya**: Safaricom M-Pesa, Airtel Money.
  - **Diaspora**: International Debit/Credit Cards.

#### 3.2 Tiered Pricing Structure
| Tier | Pricing | Inclusions |
| :--- | :--- | :--- |
| **Free Preview** | Free | Instant on-screen traffic light, basic distance calculation |
| **Instant Due Diligence Certificate** | UGX 25,000 / KES 650 (~$7) | Official stamped 2-page PDF certificate, satellite map, legal guidelines, QR verification |
| **Pro Realtor Pass** | UGX 150,000 / KES 4,500 (~$45) / mo | 30 reports/month, custom agency branding & watermark, WhatsApp sharing kit |
| **Law Firm / Surveyor Pack** | UGX 450,000 (~$120) / mo | Unlimited reports, batch CSV scanning, raw GeoJSON/DXF exports |

#### 3.3 Topography & Flood Risk Modeling
- Integrate **Copernicus / SRTM 30m Digital Elevation Models (DEM)**.
- Classify plots by slope and runoff accumulation to provide a **Flood Susceptibility Index**.

---

### Phase 4: B2B Integration & Cadastral Scale (Month 3+)

1. **Cadastral Block / Plot Search**: Integrate digital land registry / cadastral boundaries where available (e.g. search by Block and Plot number).
2. **Property Portal Badges**: API integration for real estate portals (Jiji, BuyRentKenya, Property24) to attach a verified **"NEMA Buffer Cleared"** badge to property listings.
3. **Bank Mortgage Due Diligence API**: Provide commercial banks and SACCOs with automated collateral risk dossiers before loan approvals.

---

## 4. Verification & Testing Strategy

- **Automated Tests**:
  - Run regression suite: `pytest tests/ -v`
  - Verify UTM projection accuracy and boundary distance calculations in `geo_utils.py` and `report_logic.py`.
- **Field Benchmark Tests**:
  - Test known wetland dispute coordinates:
    - Kampala / Lubigi wetland (`0.3345, 32.5320`) $\to$ Must trigger **High Risk / In Wetland**.
    - Wakiso / Kira hilltop (`0.3950, 32.6350`) $\to$ Must trigger **Safe / Low Exposure**.
    - Nairobi River riparian corridor (`-1.2864, 36.8172`) $\to$ Must trigger **Riparian Buffer Alert**.

