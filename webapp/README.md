# NEMA Wetland Due Diligence — Web App (`webapp/`)

Next.js 14 (App Router) + Tailwind CSS + MapLibre GL frontend for the FastAPI
screening backend. This replaces the legacy `<iframe>` embed (plan **Phase 2.3**)
with a touch-native, mobile-first app that talks directly to the REST API.

## Why not `frontend/`?

`frontend/` is an untracked clone of the unrelated `geo-shape-capture-portal`
project (plus an older `frontend/nema-api/` prototype). Its `node_modules` was
truncated by a failed install, so this app was written fresh against the real
API in `api/routes.py`.

## Install & run

```bash
cd webapp
cp .env.example .env.local     # point NEXT_PUBLIC_API_BASE_URL at your API
npm install
npm run dev                    # http://localhost:3000
```

The backend must be running separately:

```bash
uvicorn main:app --reload --port 8000
```

## Offline validation (no `npm install` required)

`npm install` could not run in the environment this app was authored in (disk
limits), so two dependency-free checkers live in `tools/`:

```bash
node tools/check_webapp_syntax.mjs      # TypeScript compiler API, syntax-checks all 17 sources
python tools/verify_webapp_contract.py  # asserts live API shapes match the components' reads
```

`verify_webapp_contract.py` also asserts the band ↔ score ranges advertised in
`app/page.tsx` still hold. The bands in `risk_score.py` are derived from
**distance**, not from the score, so the copy must not be "simplified".

## Structure

| Path | Purpose |
| --- | --- |
| `app/layout.tsx` | Shell: header nav, footer disclaimer, `ApiKeyBar` |
| `app/page.tsx` | Main flow — locate plot, screen, map, scorecard, certificate |
| `app/batch/page.tsx` | CSV portfolio screening (Phase 4.3, Law Firm tier) |
| `app/verify/page.tsx` | Public certificate verification (QR target) |
| `app/pricing/page.tsx` | Plan catalog + Pesapal / Flutterwave checkout |
| `components/MapPanel.tsx` | MapLibre GL map: footprint, statutory buffer, parcel outline |
| `components/PlotInput.tsx` | Landmark / pasted link / DMS / coordinates input |
| `components/RiskScorecard.tsx` | Traffic-light scorecard + legal citations |
| `components/FloodPanel.tsx` | Copernicus DEM flood susceptibility (Phase 3.3) |
| `components/CertificateActions.tsx` | PDF issue, WhatsApp share, registry verify |
| `components/BrandingForm.tsx` | White-label editor (Phase 4.1) |
| `components/CadastralSearch.tsx` | Block/plot lookup (Phase 4.2) |
| `components/ApiKeyBar.tsx` | API key + quota display, free key minting |
| `lib/api.ts` | Typed client, one function per backend route |
| `lib/types.ts` | TypeScript mirror of `api/schemas.py` |

## Endpoints consumed

`GET /health` · `POST /api/v1/assess-plot` · `POST /api/v1/flood-risk` ·
`POST /api/v1/reports/generate` · `POST /api/v1/reports/generate-async` ·
`GET /api/v1/reports/task/{id}` · `GET /api/v1/reports/download/{id}` ·
`GET /api/v1/verify/{id}` · `POST /api/v1/feedback` · `GET /api/v1/billing/plans` ·
`POST /api/v1/billing/api-keys` · `GET /api/v1/billing/usage` ·
`POST /api/v1/billing/activate` · `POST /api/v1/payments/initiate` ·
`GET /api/v1/payments/status/{provider}/{id}` · `GET /api/v1/cadastral/status` ·
`GET /api/v1/cadastral/search` · `POST /api/v1/batch/assess`

## Paywall behaviour

`lib/api.ts` maps the backend's gates to `ApiError` flags so the UI can react:

| Status | Flag | UI response |
| --- | --- | --- |
| 401 | `isUnauthorized` | Prompt to paste a valid `X-API-Key` |
| 402 | `isUpgradeRequired` | Upgrade prompt linking to `/pricing` |
| 429 | `isQuotaExceeded` | "Quota reached this month" notice |

Anonymous visitors get the free preview: on-screen traffic light and wetland
distance, but no PDF certificate.

## Map data

Base tiles are OpenStreetMap raster (`{z}/{x}/{y}.png`) so no Mapbox key is
required. MapLibre GL is imported lazily inside `useEffect` because it is
browser-only and would otherwise break server rendering.

## Disclaimer

`webapp/` is screening guidance, not legal advice. It does not replace a
certified cadastral survey or a NEMA environmental audit. The footer states this
on every page.
