# Product trust and safety update

Date: 2026-09-20

## Why this update exists

This project is a preliminary location-screening tool. It must not imply that
it can clear a property, replace a survey, authenticate a title, determine a
final riparian boundary, or issue an official NEMA decision.

The initial local dataset currently contains OpenStreetMap-derived features
only. It does not contain the official layers required to market results as
gazetted, official, bank-grade, or suitable as a standalone development or
purchase decision.

## Changes made

### Public product language

- Reframed the home page around the real user job: check a location before
  paying a deposit.
- Removed promises that a PDF would be accepted by a bank, lawyer, or buyer.
- Replaced the public explanation of a `Safe` result with `No mapped signal`:
  absence of a mapped feature is not clearance.
- Added clear advice that a map pin is not a parcel boundary and that users
  must confirm boundaries and approvals with registered professionals and the
  responsible authority.
- Reworked the result card so the visible decision is a preliminary screening
  result, not a 0–100 compliance score.
- Added a coverage warning when the result comes from community or unverified
  data.

### Data provenance

- Local-cache results now return `source_tags` and `coverage_status`.
- A cache result with only OSM/community sources is explicitly identified as
  `community_or_unverified`; future results containing an `official_*` source
  are identified as `verified`.
- The UI now displays source tags and explains the consequence of unverified
  coverage.

### Reports and payments

- PDF report issuance is disabled by default. It can only be enabled with
  `ENABLE_PROFESSIONAL_REPORTS=true` after verified datasets, reviewer
  workflow, privacy controls, and professional entitlement controls are in
  place.
- Anonymous callers cannot issue a PDF report when report issuance is enabled;
  a provisioned non-free API key is required.
- The public interface describes reports as a future professional-review
  feature, not a certificate or clearance.
- Self-service payments are disabled by default and return a clear message
  instead of collecting payment details. Enable only with
  `ENABLE_SELF_SERVICE_PAYMENTS=true` after payment-to-entitlement reconciliation
  is implemented.
- Paid tiers cannot be created through the public API-key registration route.
  It now permits only a `free` key; paid access requires verified provisioning.

### Security and privacy

- Replaced wildcard CORS with an explicit `ALLOWED_ORIGINS` allow-list. It
  defaults to `http://localhost:3000`; production domains must be configured.
- Protected manual tier activation and certificate-cleanup operations with
  `X-Admin-Token`, validated against `ADMIN_API_TOKEN`. They are unavailable
  until that secret is configured.
- Removed latitude and longitude from the public certificate-verification
  response. Verification proves that a record exists; it must not expose a
  property-location database.
- Replaced the hard-coded public verification host with `PUBLIC_WEB_URL`,
  defaulting to the local web app.

## Required work before a commercial launch

1. Obtain, licence, version, and document authoritative wetland, riparian,
   water-body, and parcel-boundary data for each country and pilot area.
2. Record source agency, licence, update date, accuracy, geographic coverage,
   and feature type for every output.
3. Build country-specific decision rules reviewed by qualified local
   environmental and surveying professionals. Do not apply one fixed buffer to
   all wetland and water-feature cases.
4. Build a professional-review workflow for amber/red cases and identify the
   responsible authority’s official verification route.
5. Implement payment ledger records that bind a gateway-verified transaction,
   customer, product, expiry, and entitlement before enabling self-service
   payment or report access.
6. Implement user accounts, encrypted storage, consent, retention/deletion,
   access logs, rate limits, and a data-protection compliance review before
   collecting buyer contact or property data at scale.
7. Validate the flood layer against local observations and present it only as
   broad terrain context; 90 m elevation data is not parcel-level flood proof.
8. Run an assisted pilot with buyers, surveyors, conveyancing lawyers, and
   environmental practitioners before publishing pricing.

## Operational environment variables

- `ALLOWED_ORIGINS`: comma-separated browser origins permitted to call the API.
- `ADMIN_API_TOKEN`: required for administrative tier activation and retention
  cleanup.
- `PUBLIC_WEB_URL`: public web-app origin used for report verification links.
- `ENABLE_PROFESSIONAL_REPORTS=true`: enables report endpoints only after the
  safeguards above are operating.
- `ENABLE_SELF_SERVICE_PAYMENTS=true`: enables payment initiation only after
  verified payment reconciliation is implemented.

## Follow-up implementation: privacy and decision support

- Added `GET /api/v1/data-coverage`, which publishes dataset/source status
  without disclosing any user searches.
- Screening activity events no longer retain the caller's exact latitude or
  longitude. They retain only the result score, detected country, and input
  method for operational monitoring.
- Added an explicit in-product acknowledgement: users must confirm that a
  result is not a survey, title check, clearance, or authority decision before
  submitting a screening request.
- Added a public pilot privacy page and a post-result, pre-deposit verification
  checklist tailored to the risk signal and data-coverage status.
