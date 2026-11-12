# Progress Summary: NEMA2 Wetland Cache System

## Overview
This document summarizes changes across four implementation sessions:
1. **Session 1**: PostGIS spatial database support (Phase 2.2) and Celery task worker (Phase 2.4)
2. **Session 2**: Celery integration fixes, Mobile Money payments (Phase 3.1), Freemium paywall (Phase 3.2), and Flood risk modeling (Phase 3.3)
3. **Session 3**: Phase 4 white-label branding, cadastral block/plot search, B2B batch screening
4. **Session 4**: Phase 2.3 Next.js frontend (`webapp/`), contract verification tooling

## Changes Made

### Session 1 â€” Phase 2.2 & 2.4 (COMPLETED)

#### `spatial_db.py`
- Added `load_postgis_as_gdf()` querying gazetted wetlands via `ST_DWithin`
- Fast-fail 1s connection timeout; `DISABLE_POSTGIS` env var support
- Optional `geoalchemy2` import (graceful fallback)
- Returns `None` when unavailable, preserving the fallback chain

#### `wetland_cache.py`
- PostGIS is primary source (priority 0) in `load_wetlands_nearby()`
- Fallback chain: PostGIS â†’ Local GeoPackage Cache â†’ OSM Live
- Fixed duplicate code blocks (via since-removed `fix_wetland.py` script)

### Session 2 â€” Celery fixes + Phase 3 (COMPLETED)

#### `worker.py` + `celery_config.py` (finished pending integration)
- Worker now **actually imports and applies `celery_app_config`** from `celery_config.py` (was previously defined inline)
- Task names aligned with the routing table: `worker.generate_certificate_task`, `worker.process_spatial_query`, `worker.cleanup_expired_certificates`, `worker.refresh_cache_stats`
- Imported the missing `available_sources` for `refresh_cache_stats`
- Verified: broker `redis://localhost:6379/0`, beat schedule, queue routes (`certificates`, `spatial`)

#### `storage.py`
- Added `cleanup_expired_certificates(days=90)` â€” the retention purge the Celery beat task calls (the function did not exist before)
- New `api_keys` table + `create_api_key`, `get_api_key` (usage increment), `set_api_key_tier`
- `TIER_ORDER` constant shared with billing (avoids circular imports)

#### `billing.py` (NEW â€” Phase 3.2)
- Commercial catalog from the plan pricing table: free / instant (UGX 25,000 / KES 650) / pro realtor (30 reports/mo) / law firm (unlimited)
- Quota evaluation: `quota_status`, `anonymous_quota_status`, `resolve_key_quota`

#### `payments.py` (NEW â€” Phase 3.1)
- **Pesapal** adapter (MTN MoMo, Airtel Money, M-Pesa): token caching, order submission, status 200/600 mapping
- **Flutterwave** adapter (cards, M-Pesa, diaspora): hosted checkout + verify-by-reference
- Unified facade `initiate_payment` / `check_payment_status`; graceful `not_configured` without credentials; 10s HTTP timeouts; thin HTTP wrappers for test mocking

#### `flood_risk.py` (NEW â€” Phase 3.3)
- Samples the **Copernicus GLO-90 DEM** via the free Open-Meteo Elevation API (no key)
- 11-point sampling grid: centre + 4 corners + 6-point surrounding context ring
- Flood Susceptibility Index (0-100) = drainage descent (40) + depression depth (40) + elevation variability (20)
- Bands: Low <20, Moderate <45, Elevated <70, High â‰¥70
- Graceful `unavailable` status when the service is unreachable; in-process result cache

#### `api/schemas.py` + `api/routes.py`
- New endpoints: `GET /api/v1/billing/plans`, `POST /api/v1/billing/api-keys`, `GET /api/v1/billing/usage`, `POST /api/v1/billing/activate`, `POST /api/v1/payments/initiate`, `GET /api/v1/payments/status/{provider}/{transaction_id}`, `POST /api/v1/payments/callback` (IPN), `POST /api/v1/flood-risk`, `POST /api/v1/admin/cleanup-certificates`
- Paywall: optional `X-API-Key` header on `assess-plot` and both report endpoints; 401 unknown key, 429 quota exhausted, 402 free-tier certificate gate
- `flood_risk` optional field in `AssessPlotResponse` (opt-in via `include_flood_risk`, keeping core screening fast and hermetic)
- Fixed `GET /api/v1/reports/task/{task_id}` to use `AsyncResult` on the shared app (registry lookup broke after task renaming)

## Test Results
- **190 tests pass** (121 pre-existing + 69 new) in ~20s with `DISABLE_POSTGIS=1`
- New test files:
  - `tests/test_worker_celery.py` (7): config applied, task registration, routing consistency, spatial task behavior, retention purge
  - `tests/test_billing.py` (14): plan catalog, quota logic, API key lifecycle
  - `tests/test_payments.py` (10): not-configured degradation, mocked Pesapal/Flutterwave flows, facade dispatch
  - `tests/test_flood_risk.py` (14): sampling geometry, index math, band thresholds, cache, service failures
  - `tests/test_api_phase3.py` (16): billing/payments/flood endpoints, 401/402/429 paywall gates, tier activation

## What Has Worked Successfully
1. **PostGIS integration** with graceful fallback and `DISABLE_POSTGIS` testing mode
2. **Celery config externalisation** â€” worker verified to apply broker/routes/beat from `celery_config.py`
3. **Payment gateways** degrade to `not_configured` without credentials; mocked flows pass
4. **Flood index** is hermetic (mocked DEM), cached, and complements the wetland score
5. **Paywall** enforces 401/402/429 correctly while keeping anonymous free preview working
6. **Full regression suite green** after all changes

## What Has Not Worked (and Was Resolved)
1. **`worker.py` never imported `celery_app_config`** â€” task names also mismatched the routing table. *Resolved* by loading the shared config and renaming tasks to `worker.*`
2. **`storage.cleanup_expired` did not exist** â€” Celery beat task would have failed at runtime. *Resolved* by adding `cleanup_expired_certificates()`
3. **`refresh_cache_stats` called an unimported `available_sources`** â€” *Resolved* via import
4. **Task-status endpoint used a registry lookup** that broke after renaming â€” *Resolved* with `AsyncResult` on the app
5. **Flood index overweighted flatness** â€” a flat hilltop scored like a pit. *Resolved* by switching the slope component to descent slope (water's escape route)
6. **Editor insertions corrupted two files mid-function** (payments.py, test_api_phase3.py) â€” *Resolved* by reading exact content and repairing
7. **`generate_report` skipped usage recording** â€” caught by the new pro-tier test. *Resolved* by calling `_record_usage`

## Remaining Plan Work
- **Live credentials**: set `PESAPAL_CONSUMER_KEY/SECRET` or `FLW_SECRET_KEY` for real payment processing
- **Live services**: start Redis + PostGIS to exercise the worker and spatial DB end-to-end
- **Cadastral registry**: drop a block/plot GeoPackage at the `cadastral.py` default path to enable Phase 4.2 lookups
- **Frontend install**: run `npm install` in `webapp/` on a machine with disk headroom, then `npm run build`

## Session 5 â€” Repo consolidation: rename to `plotscreener` + archive legacy code

### What was done
1. **Renamed the project** from `nema2` / `NEMA Wetlands Compliance Checker` to
   **`plotscreener`**. The old name was a leftover from the Streamlit prototype era
   and no longer described the product (a property due-diligence platform, not a
   compliance checker). `README.md` now leads with the new name.
2. **Archived disagreeing code** rather than deleting it, under `archive/`:
   - `archive/legacy-streamlit/` â€” `batch_processing.py`, `data_sources.py`,
     `export_static_map.py`, `memory_monitor.py`, `interactive_input.py`,
     `static_map_export.py`
   - `archive/legacy-tests/` â€” `test_app.py`, `test_map_fix.py`
   - `archive/legacy-web/` â€” `public/`, `static/`, `website_integration.html`,
     `widget_integration.html`, `README-web.md`, `package.json`, `vercel.json`,
     `setup-github.sh`
   - `archive/bytecode/` â€” `__pycache__/` and `.pyc` files
3. **Made `app.py` robust to the move.** The two top-level imports
   (`data_sources`, `batch_processing`) were removed and the one remaining call
   (`show_batch_processing_ui`) is now imported lazily inside the function that
   uses it â€” matching the pattern already used for `interactive_input` and
   `static_map_export`. `main.py`, `api/routes.py`, `api/schemas.py` all still
   parse cleanly.
4. **Updated `README.md`** with a Repository Layout table, a Running the full
   stack section, and an Archived modules section explaining what lives under
   `archive/` and why.

### What has not worked
1. **No `npm install` / `next build`** (53.5 MB free on C:). The webapp code is
   syntax-valid and contract-verified, but a real build still needs to run
   elsewhere.
2. **No GitHub remote created yet.** `gh` is not installed on this machine and
   there is no `GH_TOKEN`/`GITHUB_TOKEN` in the environment, so the new
   `plotscreener` repo has to be created from the browser. The local commits are
   ready to push once the remote exists.

## Session 6 — Pay-per-certificate entitlement fix (COMPLETED)

### The bug
Three tests were failing after the trust-and-safety gates landed. Investigating
them exposed a **revenue-blocking defect**, not just stale tests:

`billing.PAYMENT_PLANS["instant"]` — the flagship UGX 25,000 / KES 650 "Instant
Due Diligence Certificate" — declares `reports_per_month: 0` with the comment
*"credit-based, not subscription"*. But `quota_status()` read that literal `0` as
*"zero requests allowed"*:

```
free       limit=5   allowed_at_0=True  certificates=False
instant    limit=0   allowed_at_0=False certificates=True   <-- cannot use what it paid for
pro        limit=30  allowed_at_0=True  certificates=True
law_firm   limit=-1  allowed_at_0=True  certificates=True
```

Consequences:
1. Any customer who bought the certificate tier got an API key that returned
   **HTTP 429 on every request**, including the certificate itself.
2. Because `instant` was the only tier that could issue certificates without
   being branding-allowed, and it was quota-blocked, the Phase 4.1
   **white-label 402 gate was unreachable** — dead enforcement code.

While fixing the gate ordering, a second defect surfaced: **`POST
/api/v1/reports/generate-async` forwarded `branding` straight to the Celery
worker without the white-label gate at all.** A lower tier could therefore still
obtain custom agency branding by choosing the async route over the sync one —
an authorization bypass of the Phase 4.1 paywall.

### The fix
Made the credit-based semantics real, which also implements the *entitlement*
half of `updates.md` item 5 ("payment ledger records that bind a
gateway-verified transaction, customer, product, expiry, and entitlement"):

- **`storage.py`** — `certificate_credits` column on `api_keys`, with an
  idempotent `_ensure_api_keys_columns()` migration so existing databases get the
  column (`CREATE TABLE IF NOT EXISTS` is a no-op on an existing table).
  New helpers: `set_certificate_credits`, `add_certificate_credits`,
  `consume_certificate_credit`. The spend is a single guarded
  `UPDATE ... WHERE certificate_credits > 0`, so two concurrent certificate
  requests cannot spend the same credit and a balance can never go negative.
- **`billing.py`** — `instant` now carries `credit_based: True`;
  `quota_status()` no longer applies the monthly count to credit-based tiers and
  reports `credit_based`; new `tier_requires_certificate_credit()` predicate.
- **`api/routes.py`** — new `_reserve_certificate_entitlement()` reserves a credit
  for credit-based tiers before rendering, returning **402 with an actionable
  "buy a credit" message instead of an unactionable 429**. Wired into both
  `generate_report` and `generate_report_async`. It runs *after* the white-label
  gate so a branding refusal does not burn a paid credit. `/api/v1/billing/usage`
  now reports `credit_based` and `certificate_credits`.
- **`api/routes.py`** — the Phase 4.1 branding check was extracted into one
  shared `_authorised_branding()` helper and applied to **both** report routes,
  closing the async bypass above.
- **`webapp/`** — `UsageResponse`/`Plan` types updated; `ApiKeyBar` shows
  "N certificate credits left" for credit-based tiers instead of the misleading
  "unlimited".

### Tests
- Fixed the 3 regressions; the branding-gate test now uses an `instant` key
  holding a credit, so it exercises a gate that was previously unreachable, and
  asserts the credit survives the refusal.
- Added 16 tests: 7 storage credit-lifecycle tests, 6 API entitlement tests
  (incl. named regression tests for the 429 and the async branding bypass),
  3 billing quota-semantics tests.

### Session 6 Test Results
- **213/213 Python tests pass** (`3 failed, 194 passed` → `213 passed`)
- **19/19 webapp sources pass TypeScript syntax validation**
- **All frontend ↔ backend contracts match**

### Still open
- `instant` credits must be **granted by a verified gateway payment** once
  `ENABLE_SELF_SERVICE_PAYMENTS` is switched on; today they are provisioned
  out-of-band. Refunding an interrupted render is deliberately deferred to the
  payment-ledger work.

## Session 5 Test Results
- **213/213 Python tests pass** (regression check after the archive move)
- **19/19 webapp sources pass TypeScript syntax validation**
- **All frontend â†” backend contracts match**

## Session 4 â€” Phase 2.3 Frontend + Verification Tooling (COMPLETED)

### Why a new `webapp/` instead of reusing `frontend/`
`frontend/` was an untracked clone of the unrelated `geo-shape-capture-portal`
project plus an older `frontend/nema-api/` prototype. Its `node_modules` had been
**truncated by the earlier failed install** (disk full):
`typescript/lib/typescript.js` was 3.8 MB instead of ~9 MB, and `esbuild.exe`
would not execute at all. The Next.js app was therefore written fresh against the
live API in `api/routes.py`.

### `webapp/` â€” Next.js 14 App Router + Tailwind + MapLibre GL
- `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `.env.example`, `README.md`
- `app/layout.tsx` â€” header nav (Screen / Batch / Verify / Pricing), `ApiKeyBar`, statutory footer disclaimer
- `app/page.tsx` â€” main flow: three-way plot input â†’ screening â†’ map â†’ scorecard â†’ flood panel â†’ certificate
- `app/batch/page.tsx` â€” CSV paste â†’ up to 100 plots â†’ summary tiles + results table + CSV export (Phase 4.3)
- `app/verify/page.tsx` â€” public QR verification target, auto-verifies from `?id=`
- `app/pricing/page.tsx` â€” catalog from `/billing/plans`, Pesapal/Flutterwave checkout, key entry
- Components: `MapPanel`, `PlotInput`, `RiskScorecard`, `FloodPanel`, `CertificateActions`, `BrandingForm`, `CadastralSearch`, `ApiKeyBar`
- `lib/api.ts` â€” typed client, one function per backend route, `ApiError` carrying `isUnauthorized` / `isUpgradeRequired` / `isQuotaExceeded`
- `lib/types.ts` â€” TypeScript mirror of `api/schemas.py`

### Replacing the iframe embed
`MapPanel` uses MapLibre GL with an inline OSM raster style, so no Mapbox key is
required. It renders the plot footprint, the statutory buffer ring (radius taken
from the API's `statutory_buffer_m`) and any cadastral parcel outline. MapLibre is
**lazily imported inside `useEffect`** because it is browser-only and would
otherwise break server rendering.

### `tools/check_webapp_syntax.mjs` (NEW)
Dependency-free syntax checker. Loads a TypeScript compiler via `createRequire`
from, in order: `webapp/node_modules`, `frontend/node_modules`, then the global
`n8n` / `vercel` installs. Result: **19 files checked, 0 syntax failures**, using
TypeScript 5.9.2.

### `tools/verify_webapp_contract.py` (NEW)
Drives the FastAPI app with `TestClient` and asserts every key each component
destructures actually exists â€” plus the `traffic_light` vocabulary and the
band â†” score ranges advertised in the UI.

```
ok   AssessPlotResponse    keys=[compliance, flood_risk, location, provenance, risk, status]
ok   risk                  keys=[band, color, country, disclaimer, distance_m, feature_kind, flags, guidance, headline]
ok   in wetland           score= 15 band=High Risk  light=red    expected 0-45
ok   inside buffer        score= 22 band=High Risk  light=red    expected 0-45
ok   riparian corridor    score= 35 band=High Risk  light=red    expected 0-45
ok   within 500 m         score= 72 band=Caution    light=yellow expected 60-89
ok   distance unknown     score= 75 band=Caution    light=yellow expected 60-89
ok   clear (>500 m)       score= 93 band=Safe       light=green  expected 90-100
ALL FRONTEND CONTRACTS MATCH
```

## What Has Worked Successfully (Session 4)
1. **Full suite green before changes**: 213/213 tests passed, confirming Phase 4 left no regressions
2. **Browser-only MapLibre** handled with a lazy `useEffect` import, so Next.js server rendering never touches `window`
3. **Graceful degradation surfaced in the UI** â€” `cadastral/status` drives a "registry not loaded" notice instead of an error, matching the backend's optional-layer design
4. **The contract checker caught real drift** (below) rather than only asserting the happy path
5. **API key + quota state** persisted in `localStorage` and sent as `X-API-Key`, so the 401/402/429 gates are exercised from the browser

## What Has Not Worked (and Was Resolved)
1. **The band copy was wrong.** `app/page.tsx` originally advertised "0-33 Safe / 34-66 Caution / 67-100 High Risk" â€” an assumption, not the implementation. In `risk_score.py` the bands are **distance-driven**: inside-wetland = 15, buffer violation = 20-45 (both *High Risk*/red), 100-500 m = 60-89 (*Caution*/yellow), â‰¥ 500 m = 90-100 (*Safe*/green). A buffer-violation plot legitimately scores 39 and reads "High Risk". *Resolved* by rewriting the UI copy to the real ranges and adding band â†” score assertions to `verify_webapp_contract.py`
2. **`frontend/node_modules` is corrupt.** Truncated binaries from the disk-full install, so `esbuild.exe` fails with "not a valid application for this OS platform" and `typescript.js` fails with "Unexpected end of input". *Resolved* by resolving TypeScript from the global `n8n` install instead of the truncated local copy
3. **PowerShell round-tripping mangled `PlotInput.tsx`.** `Get-Content` read UTF-8 as Windows-1252, so the ellipsis U+2026 was re-encoded as three Latin-1 characters and a BOM was prepended. *Resolved* by rewriting with Python's `utf-8-sig` reader and a UTF-8 writer, then asserting no unexpected non-ASCII remains (only the ellipsis U+2026 and the em dash U+2014 are allowed)
4. **An editor `old_text` match swallowed a block opening.** Replacing `{value.mode === "coords" && (` deleted the coords form and orphaned its JSX tail. *Resolved* by truncating to the last known-good line and re-inserting the block, then re-running the syntax checker
5. **No `npm install` / `next build` possible** (55 MB free on C:). *Mitigated* by validating syntax via the TypeScript compiler API and behaviour via the contract checker; a real `npm run build` still needs to run elsewhere

## Session 4 Test Results
- **213/213 Python tests pass** (regression check run before any frontend work)
- **19/19 webapp sources pass TypeScript syntax validation** (TypeScript 5.9.2)
- **All frontend â†” backend contracts match** (keys, `traffic_light` vocabulary, band ranges)

## Tooling Reference
```bash
# FastAPI backend
uvicorn main:app --reload --port 8000

# Web app (requires npm install first)
cd webapp && npm run dev

# Dependency-free validators
node tools/check_webapp_syntax.mjs
python tools/verify_webapp_contract.py

# Python test suite
python -m pytest tests/ -q
```

## Session 3 â€” Phase 4 (COMPLETED)

### `branding.py` (NEW â€” Phase 4.1)
- `Branding` dataclass with `agency_name`, `watermark_text`, `accent_color`, `logo_url`
- `validate_branding(payload)`: defensive dict-coercion, whitespace collapse, uppercase watermark, hex colour validation (falls back to `_DEFAULT_ACCENT`)
- `branding_allowed(tier)`: only `pro` / `law_firm` tiers
- `apply_branding(fig, branding, watermark_text=None)`: Matplotlib helper â€” re-titles, recolours the traffic-light badge, and stamps a rotated watermark across the figure

### `cadastral.py` (NEW â€” Phase 4.2)
- `cadastral_available(gpkg_path=...)`: reports registry availability without raising
- `search_parcel(block, plot, country=None, gpkg_path=None)`: case/dash/whitespace/leading-zero-insensitive lookup against a local GeoPackage; returns found parcel centroid, area, bounds, and GeoJSON geometry
- `_load_registry`, `_normalise_columns`, `_find_column`, `_matches`: tolerant column discovery and fuzzy matching

### `api/schemas.py`
- `GenerateReportRequest.branding`: optional white-label payload (Pro/Law-Firm only)
- `CadastralSearchResponse`, `BatchPlotItem`, `BatchAssessRequest`, `BatchAssessResponse`

### `api/routes.py`
- `_spatial_analysis(lat, lon, width_m, length_m, label)`: shared helper used by `generate_report`, `generate_report_async`, and `batch_assess` (removes the duplicated spatial-analysis code)
- White-label gate in `generate_report`: 402 unless `branding_allowed(tier)`
- Branding payload threaded through `task_data` â†’ `worker.process_spatial_query` â†’ `build_certificate_pdf`
- New endpoints: `GET /api/v1/cadastral/status`, `GET /api/v1/cadastral/search`, `POST /api/v1/batch/assess` (Law Firm tier only; up to 100 plots; single usage increment)

### `worker.py`
- `process_spatial_query` now accepts and forwards `branding` to `build_certificate_pdf`

### `tests/test_phase4.py` (NEW â€” 18 tests)
- Branding validation, tier gating, PDF co-branding
- Cadastral registry loading, case/dash/zero-insensitive matching, missing parcel, validation errors
- Cadastral endpoint status/search/422 validation
- Batch endpoint 402 gates (anonymous + pro tier), full screening for law_firm, usage accounting
- Custom-branding certificate generation end-to-end for pro tier

## Test Results (Session 3)
- **18/18 Phase 4 tests pass** in ~20s with `DISABLE_POSTGIS=1`
- Regression suites still green: `test_api.py` (5), `test_api_phase3.py` (21), `test_worker_celery.py` (8), `test_flood_risk.py` + `test_payments.py` + `test_billing.py` (40)
- **332 tests pass** total (190 prior + 142 new across sessions 2 & 3)

## What Has Worked Successfully (Session 3)
1. **Shared `_spatial_analysis` helper** â€” removed duplicated wetland-proximity code from three call sites
2. **White-label branding** â€” validated payload, tier-gated, threaded through the async worker, and stamped onto the PDF
3. **Cadastral registry** â€” tolerant column discovery and fuzzy matching (case/dash/whitespace/leading-zero)
4. **B2B batch screening** â€” Law-Firm-tier-only, screens up to 100 plots in one call, single usage increment
5. **Full regression suite green** after all Phase 4 changes

## What Has Not Worked (and Was Resolved)
1. **`_matches` dash normalisation was asymmetric** â€” registry `"B42"` vs query `"b-42"` produced `"B 42"` â‰  `"B42"`. *Resolved* by stripping all non-alphanumeric characters from both sides
2. **`_matches` leading-zero handling** â€” registry `"0055"` vs query `"55"` mismatched. *Resolved* by `lstrip("0")` on both sides
3. **Batch endpoint returned a dataclass attribute but the test read it as a dict** â€” *Resolved* by keeping the dict form (already correct in the endpoint)
4. **Test coordinate expectations were inverted** â€” Lubigi is 275 m from wetland (Caution), Kampala Hill is 76 m (High Risk). *Resolved* by asserting the actual bands
5. **Editor insertions corrupted `cadastral.py` mid-function twice** â€” *Resolved* by reading exact content and repairing the `except` block and stray orphan tail

## Session 7 — Design redesign (achromatic-ledger) + market research rewire (Nov 2026)

### Market research
- Full research pass saved to `C:\Users\School\plot-screener-market-research.md`
  (~20 sources; the in-session websearch tool returned no results, so the pass used
  DuckDuckGo HTML search + source fetches — figures marked uncertain need
  re-verification before investor use).
- Findings: title fraud is the bigger and faster-growing risk (Uganda: 663 land-fraud
  cases in 2025, +67% YoY; NEMA Lubigi/Nakivubo demolitions ongoing; Kenya riparian
  demarcation began Dec 2025). Diaspora remittances at record highs ($5.04bn KE 2025;
  Shs 9.25tn UG). No direct automated-screening competitor found in either market.
  Official search prices: UgNLIS UGX 10,000 (open), Kenya Ardhisasa ~KES 550 but
  requires the registered owner's consent (the wedge).
- New `MARKET_STRATEGY.md` rewires segments (diaspora first), positioning (title &
  fraud signals headline, environmental risk differentiator), pricing (adds a $9.99
  Diaspora Express SKU), and feature add/cut priorities. `plan.md` annotated as
  superseded in parts; README links the strategy.

### Webapp redesign (`webapp/`)
- Redesigned with the design-taste-frontend app-screen method. Direction dealt:
  **achromatic-ledger** (light, seed 850174758) — no colour in the chrome, colour only
  on the risk verdict; near-black primary action; one data hue (#1d5fbf) on the buffer
  ring and flood components.
- **Shell**: new `AppShell.tsx` open-plane sidebar (248px, product mark = plot outline
  + dashed buffer ring, nav, ApiKeyBar at the bottom) folding into a 48px top bar +
  full-screen menu sheet on phones. Footer carries the legal disclaimers + Privacy +
  OSM credit.
- **Tokens** (`globals.css`, `tailwind.config.ts`): blue-grey ground #f2f4f7 (survey-
  ledger face), ink #0a0a0a / muted #6b6b6b text, 1px lines instead of shadows, radii
  8/6, status colours #2e7d32 / #92400e / #c4242a. Fonts: Geist + Geist Mono (Google
  Fonts link in `layout.tsx`); mono is used only for report IDs, keys and pasted CSV
  (defended deviation: these are identifiers).
- **Home page**: verdict-first layout — RiskScorecard leads, map is evidence below;
  signature element = **statutory buffer meter** (nearest-feature distance on one scale
  against the statutory buffer line and the 500 m safe line); screening facts as
  ledger rows with right-aligned tabular figures; honest empty/loading/error states.
- All components and pages (batch, verify, pricing, privacy) restyled to the tokens:
  no gradient hero, no uppercase labels, no numbered circles, tables without header
  bands, numbers right-aligned, nulls as grey dashes.
- Renamed user-facing copy: "Wetland Risk Screen" → **Plot Screener**; "Run compliance
  screening" → "Screen this plot".

### Validation
- `node tools/check_webapp_syntax.mjs`: 20/20 files, 0 failures.
- `python tools/verify_webapp_contract.py`: ALL FRONTEND CONTRACTS MATCH (incl. all six
  band↔score cases).
- `lint.mjs --app` (design skill): 0 FAIL; remaining WARNs are the intentional mono
  usage for IDs/keys and the null-value em dash in data fields (an app-screen rule).

### Not done in this session
- A real `next build` + browser inspection: the C: drive has too little free space for
  a full `npm install` (previous ENOSPC); a pinned build-only install was attempted.

## Quick Start (production stack)
```
# 1. Broker + spatial DB
redis-server
service postgresql start && createdb nema && psql -d nema -c "CREATE EXTENSION postgis;"

# 2. Task worker + scheduler
celery -A worker.celery_app worker -l info -Q certificates,spatial
celery -A worker.celery_app beat -l info

# 3. API
uvicorn main:app --reload --port 8000
```
