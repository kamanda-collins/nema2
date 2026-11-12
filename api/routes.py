"""API Router for NEMA Compliance REST endpoints."""

import os
import secrets
from typing import Any, Dict, Optional

from fastapi import APIRouter, Header, HTTPException, Request, Response
import geopandas as gpd
from shapely.geometry import Point

from api.schemas import (
    AssessPlotRequest,
    AssessPlotResponse,
    ApiKeyRequest,
    ApiKeyResponse,
    BatchAssessRequest,
    BatchAssessResponse,
    CadastralSearchResponse,
    FloodRiskRequest,
    GenerateReportRequest,
    GenerateReportResponse,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    FeedbackRequest,
)
from location_input import (
    parse_dms,
    parse_coordinates_from_text,
    lookup_place,
    plot_polygon_from_point,
)
from wetland_cache import available_sources, load_wetlands_nearby, cache_summary
from report_logic import check_compliance, calculate_min_distance, estimate_utm_crs_for
from risk_score import assess_property_risk
from certificate import build_certificate_pdf, generate_verification_id
from storage import (
    save_certificate,
    get_certificate,
    save_feedback,
    log_event,
    stats,
    create_api_key,
    get_api_key,
    consume_certificate_credit,
)
from storage import cleanup_expired_certificates as storage_cleanup_expired
from billing import (
    get_plan,
    list_plans,
    resolve_key_quota,
    valid_tier,
    tier_requires_certificate_credit,
)
from flood_risk import flood_risk_assessment
from cadastral import cadastral_available, search_parcel
import payments as payment_gateway

router = APIRouter()
_pdf_cache: Dict[str, bytes] = {}
# Anonymous (key-less) usage counters, per client host. In-process only; the
# durable, enforceable quota lives in the api_keys table for key holders.
_anon_usage: Dict[str, int] = {}


def _require_admin_token(x_admin_token: Optional[str]) -> None:
    """Protect maintenance and entitlement operations from public callers."""
    expected = os.getenv("ADMIN_API_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="Administrative operations are not configured.")
    if not x_admin_token or not secrets.compare_digest(x_admin_token, expected):
        raise HTTPException(status_code=403, detail="Administrator authorization required.")


def _require_professional_reports_enabled() -> None:
    """Keep report issuance off until data and reviewer controls are live."""
    if os.getenv("ENABLE_PROFESSIONAL_REPORTS", "false").lower() != "true":
        raise HTTPException(
            status_code=503,
            detail="Professional reports are unavailable while verified-data controls are being completed.",
        )


def _check_quota(x_api_key: Optional[str], client_host: str) -> Optional[Dict[str, Any]]:
    """
    Freemium paywall gate (plan Phase 3.2).

    - Key holders: hard quota enforcement against their tier.
    - Anonymous callers: free preview, tracked in-process (soft limit).

    Returns the API key record (None for anonymous); raises 401/429 on problems.
    """
    if not x_api_key:
        return None

    key_record = get_api_key(x_api_key)
    if key_record is None:
        raise HTTPException(status_code=401, detail="Unknown or malformed API key.")

    quota = resolve_key_quota(key_record)
    if not quota.get("allowed"):
        log_event("api_quota_blocked", {"tier": quota.get("tier"), "used": quota.get("used")})
        raise HTTPException(
            status_code=429,
            detail=(
                "Monthly quota exhausted for your plan. Upgrade via /api/v1/payments/initiate "
                "or register a higher tier key at /api/v1/billing/api-keys."
            ),
        )
    return key_record


def _record_usage(x_api_key: Optional[str], key_record: Optional[Dict[str, Any]], client_host: str) -> None:
    """Bump usage counters after a successful billable operation."""
    if key_record is not None:
        get_api_key(x_api_key, increment_usage=True)
    else:
        _anon_usage[client_host] = _anon_usage.get(client_host, 0) + 1


def _reserve_certificate_entitlement(x_api_key: Optional[str], key_record: Optional[Dict[str, Any]]) -> None:
    """
    Enforce the pay-per-certificate allowance for credit-based tiers.

    Subscription tiers (pro / law_firm) are covered by their monthly quota, so
    only credit-based tiers (instant) need a credit. The credit is reserved
    before the expensive rendering work so two concurrent requests cannot both
    spend the same credit; refunding an interrupted render belongs to the
    payment-ledger work described in updates.md.
    """
    tier = key_record.get("tier") if key_record else None
    if not tier_requires_certificate_credit(tier):
        return

    if not consume_certificate_credit(x_api_key):
        log_event("api_certificate_credit_exhausted", {"tier": tier})
        raise HTTPException(
            status_code=402,
            detail=(
                "No certificate credits remaining on this key. Purchase another Instant "
                "Due Diligence Certificate credit to issue a further report."
            ),
        )


def _authorised_branding(key_record: Optional[Dict[str, Any]], branding: Any) -> Optional[Dict[str, Any]]:
    """
    Gate the white-label payload (plan Phase 4.1). Custom branding is a
    Pro/Law-Firm feature.

    Both the synchronous and the asynchronous report routes must call this:
    gating only the synchronous route lets a lower tier obtain agency branding
    by choosing /api/v1/reports/generate-async instead.
    """
    from branding import branding_allowed

    requested = branding if isinstance(branding, dict) else None
    if not requested:
        return None

    if not branding_allowed(key_record.get("tier") if key_record else None):
        raise HTTPException(
            status_code=402,
            detail="White-label branding requires the Pro Realtor or Law Firm tier.",
        )
    return requested


def _spatial_analysis(lat: float, lon: float, width_m: float, length_m: float, plot_label: str):
    """
    Shared wetland proximity analysis used by assess, reports, and batch (B2B).

    Returns (site_gdf, wetlands_gdf, provenance, in_wetland, wetland_names,
    min_distance, nearest_feature_kind).
    """
    site_gdf = plot_polygon_from_point(lat, lon, width_m=width_m, length_m=length_m, name=plot_label)
    wetlands_gdf, prov = load_wetlands_nearby(lat, lon, radius_m=2000)

    in_wetland = False
    wetland_names: list = []
    min_dist = None
    nearest_kind = None

    if wetlands_gdf is not None and not wetlands_gdf.empty:
        in_wetland, wetland_names = check_compliance(site_gdf, wetlands_gdf)
        if not in_wetland:
            min_dist = calculate_min_distance(site_gdf, wetlands_gdf)

        try:
            utm = estimate_utm_crs_for(site_gdf)
            pt = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(utm).iloc[0]
            wet_proj = wetlands_gdf.to_crs(utm)
            dists = wet_proj.geometry.distance(pt)
            near_idx = dists.idxmin()
            if "feature_kind" in wet_proj.columns:
                nearest_kind = wet_proj.loc[near_idx, "feature_kind"]
        except Exception:
            nearest_kind = None

    return site_gdf, wetlands_gdf, prov, in_wetland, wetland_names, min_dist, nearest_kind


@router.get("/health", summary="System Health & Cache Status")
def health_check():
    """Returns operational status of the API, local GeoPackage spatial cache, and SQLite storage."""
    return {
        "status": "healthy",
        "service": "NEMA Compliance REST API",
        "version": "2.0.0",
        "storage": stats(),
        "spatial_cache": cache_summary(),
    }


@router.get("/api/v1/data-coverage", summary="Mapped Data Coverage & Provenance")
def data_coverage():
    """Expose the datasets currently available without exposing property searches."""
    sources = available_sources()
    summary = sources.get("cache_summary", {})
    official_feature_count = sum(
        count for tag, count in summary.items() if str(tag).startswith("official_")
    )
    return {
        "status": "available",
        "coverage_status": "verified" if official_feature_count else "community_or_unverified",
        "official_feature_count": official_feature_count,
        "sources": sources,
        "notice": (
            "Coverage is not a clearance map. Confirm parcel boundaries, feature type, and approval requirements "
            "with a registered professional and the responsible authority."
        ),
    }


@router.post("/api/v1/assess-plot", response_model=AssessPlotResponse, summary="Assess Property Risk Score")
def assess_plot(req: AssessPlotRequest, request: Request, x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Parses plot location, queries spatial wetland cache, and returns property risk scorecard and legal citations."""
    key_record = _check_quota(x_api_key, request.client.host if request.client else "unknown")

    lat, lon = req.lat, req.lon
    input_method = "coordinates"

    if (lat is None or lon is None) and req.map_link:
        lat, lon = parse_coordinates_from_text(req.map_link)
        input_method = "map_link"
    if (lat is None or lon is None) and req.dms:
        lat, lon = parse_dms(req.dms)
        input_method = "dms"
    if (lat is None or lon is None) and req.query:
        found = lookup_place(req.query)
        if found:
            lat, lon = found["lat"], found["lon"]
            input_method = "landmark_query"

    if lat is None or lon is None:
        raise HTTPException(
            status_code=400,
            detail="Could not determine property coordinates. Provide valid lat/lon, landmark query, DMS string, or map link.",
        )

    site_gdf, wetlands_gdf, prov, in_wetland, wetland_names, min_dist, nearest_kind = _spatial_analysis(
        lat, lon, req.width_m, req.length_m, req.plot_label
    )

    risk = assess_property_risk(in_wetland, min_dist, feature_kind=nearest_kind, lat=lat, lon=lon)
    # Do not persist a buyer's precise pin in the generic event log.
    log_event(
        "api_assess_plot",
        {"score": risk.score, "country": risk.country, "input_method": input_method},
    )

    # Optional flood susceptibility analysis (plan Phase 3.3) — opt-in so the
    # core wetland screening stays fast and hermetic.
    flood: Optional[Dict[str, Any]] = None
    if req.include_flood_risk:
        flood = flood_risk_assessment(lat, lon, width_m=req.width_m, length_m=req.length_m)

    _record_usage(x_api_key, key_record, request.client.host if request.client else "unknown")

    return AssessPlotResponse(
        status="success",
        location={
            "lat": lat,
            "lon": lon,
            "label": req.plot_label,
            "input_method": input_method,
            "width_m": req.width_m,
            "length_m": req.length_m,
        },
        risk=risk.to_dict(),
        compliance={
            "in_wetland": in_wetland,
            "wetland_names": wetland_names,
            "min_distance_meters": round(min_dist, 1) if min_dist is not None else None,
            "nearest_feature_kind": nearest_kind,
        },
        provenance=prov,
        flood_risk=flood,
    )


@router.post("/api/v1/reports/generate", response_model=GenerateReportResponse, summary="Generate Due Diligence Certificate")
def generate_report(req: GenerateReportRequest, request: Request, x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Generates an indicative screening report for an entitled professional user."""
    _require_professional_reports_enabled()
    key_record = _check_quota(x_api_key, request.client.host if request.client else "unknown")

    # Freemium gate (plan Phase 3.2): 'free' tier keys get the score but not the
    # stamped PDF. Anonymous callers keep the free preview behavior.
    if key_record is None or key_record.get("tier") == "free":
        raise HTTPException(
            status_code=402,
            detail=(
                "Indicative PDF reports are available only to a provisioned professional account. "
                "Self-service paid access is not yet enabled."
            ),
        )

    # White-label gate (plan Phase 4.1): custom branding is a Pro/Law-Firm feature.
    requested_branding = _authorised_branding(key_record, req.branding)

    _reserve_certificate_entitlement(x_api_key, key_record)

    lat, lon = req.lat, req.lon
    site_gdf, wetlands_gdf, prov, in_wetland, wetland_names, min_dist, nearest_kind = _spatial_analysis(
        lat, lon, req.width_m, req.length_m, req.plot_label
    )

    risk = assess_property_risk(in_wetland, min_dist, feature_kind=nearest_kind, lat=lat, lon=lon)
    cert_id = generate_verification_id(lat, lon, risk.band)

    pdf_bytes = build_certificate_pdf(
        certificate_id=cert_id,
        risk=risk,
        site_label=req.plot_label,
        lat=lat,
        lon=lon,
        distance_m=min_dist,
        wetland_names=wetland_names,
        feature_kind=nearest_kind,
        site_gdf=site_gdf,
        wetlands_gdf=wetlands_gdf,
        provenance=prov,
        branding=requested_branding,
    )

    _pdf_cache[cert_id] = pdf_bytes

    save_certificate(cert_id, {
        "score": risk.score,
        "band": risk.band,
        "country": risk.country,
        "lat": lat,
        "lon": lon,
    })
    log_event("api_certificate_issued", {"certificate_id": cert_id, **risk.to_dict()})

    _record_usage(x_api_key, key_record, request.client.host if request.client else "unknown")

    return GenerateReportResponse(
        certificate_id=cert_id,
        download_url=f"/api/v1/reports/download/{cert_id}",
        risk_score=risk.score,
        risk_band=risk.band,
        country=risk.country,
    )


@router.post("/api/v1/reports/generate-async", summary="Trigger Asynchronous PDF Certificate Generation")
def generate_report_async(req: GenerateReportRequest, request: Request, x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """
    Triggers an asynchronous worker task (Celery) to generate the PDF certificate.
    Returns a task ID that can be polled for status.
    """
    _require_professional_reports_enabled()
    key_record = _check_quota(x_api_key, request.client.host if request.client else "unknown")
    if key_record is None or key_record.get("tier") == "free":
        raise HTTPException(
            status_code=402,
            detail=(
                "PDF certificates require a paid plan. Purchase the Instant Due Diligence "
                "Certificate via /api/v1/payments/initiate (plan_id='instant')."
            ),
        )

    lat, lon = req.lat, req.lon
    if (lat is None or lon is None) and req.map_link:
        lat, lon = parse_coordinates_from_text(req.map_link)
    if (lat is None or lon is None) and req.dms:
        lat, lon = parse_dms(req.dms)
    if (lat is None or lon is None) and req.query:
        found = lookup_place(req.query)
        if found:
            lat, lon = found["lat"], found["lon"]

    if lat is None or lon is None:
        raise HTTPException(
            status_code=400,
            detail="Could not determine property coordinates. Provide valid lat/lon, landmark query, DMS string, or map link.",
        )

    # Gate branding before reserving the credit, so a refusal cannot burn it.
    task_branding = _authorised_branding(key_record, req.branding)

    _reserve_certificate_entitlement(x_api_key, key_record)

    task_data = {
        "lat": lat,
        "lon": lon,
        "plot_label": req.plot_label,
        "width_m": req.width_m,
        "length_m": req.length_m,
        "branding": task_branding,
    }
    
    # Offload to Celery
    try:
        from worker import generate_certificate_task

        task = generate_certificate_task.delay(task_data)
        return {
            "status": "processing",
            "task_id": task.id,
            "message": "Certificate generation started in background."
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Background worker unavailable: {e}"
        )




@router.get("/api/v1/reports/task/{task_id}", summary="Check Certificate Generation Task Status")
def get_task_status(task_id: str):
    """Poll the status of a certificate generation task."""
    from worker import celery_app
    try:
        result = celery_app.AsyncResult(task_id)
        if not result.ready():
            return {"status": "processing", "task_id": task_id}
        if result.failed():
            return {"status": "failed", "task_id": task_id, "error": str(result.result)}
        payload = result.result
        if isinstance(payload, dict):
            payload.setdefault("task_id", task_id)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check task status: {e}"
        )


@router.get("/api/v1/reports/download/{certificate_id}", summary="Download Issued Certificate PDF")
def download_certificate(certificate_id: str):
    """Retrieves and streams the generated PDF certificate by verification ID."""
    _require_professional_reports_enabled()
    if certificate_id in _pdf_cache:
        pdf_bytes = _pdf_cache[certificate_id]
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={certificate_id}.pdf"},
        )

    record = get_certificate(certificate_id)
    if not record:
        raise HTTPException(status_code=404, detail="Certificate ID not found.")

    raise HTTPException(
        status_code=410,
        detail="Certificate verification record exists, but PDF buffer expired. Re-generate certificate to download.",
    )


@router.get("/api/v1/verify/{certificate_id}", summary="Verify Due Diligence Certificate")
def verify_certificate(certificate_id: str):
    """Public verification endpoint to check authenticity of an issued due-diligence certificate."""
    record = get_certificate(certificate_id)
    if not record:
        return {
            "status": "invalid",
            "certificate_id": certificate_id,
            "message": "Certificate ID not found in official verification registry.",
        }

    # Public verification deliberately excludes precise coordinates and plot
    # labels. A certificate proves that a record exists; it is not a public
    # property-location database.
    return {
        "status": "valid",
        "certificate_id": certificate_id,
        "issued_at": record.get("created_at"),
        "assessment": {
            "score": record.get("score"),
            "band": record.get("band"),
            "country": record.get("country"),
        },
    }


@router.post("/api/v1/feedback", summary="Submit User Feedback")
def submit_feedback(req: FeedbackRequest):
    """Records user feedback in SQLite database."""
    saved_id = save_feedback(req.feedback_text, meta=req.meta)
    log_event("api_feedback", {"length": len(req.feedback_text)})
    return {"status": "recorded", "id": saved_id}


# --- Phase 3.1: Payments (Mobile Money & Cards) ------------------------------------

@router.get("/api/v1/billing/plans", summary="List Pricing Tiers & Plans")
def get_plans():
    """Returns the commercial pricing catalog (plan section 3.2)."""
    return {"status": "success", "plans": list_plans()}


@router.post(
    "/api/v1/billing/api-keys",
    response_model=ApiKeyResponse,
    summary="Register an API Key for a Pricing Tier",
)
def register_api_key(req: ApiKeyRequest):
    """
    Mints an API key bound to a tier. Free keys work immediately; paid tiers
    become fully active once the corresponding payment completes.
    """
    if not valid_tier(req.tier):
        raise HTTPException(status_code=400, detail=f"Unknown tier '{req.tier}'.")
    if req.tier != "free":
        raise HTTPException(
            status_code=403,
            detail="Paid tiers cannot be self-assigned. Contact the pilot team for provisioned access.",
        )

    record = create_api_key(req.name, tier=req.tier)
    if record is None:
        raise HTTPException(status_code=500, detail="Could not create API key (storage unavailable?).")

    log_event("api_key_created", {"tier": req.tier})
    return ApiKeyResponse(status="created", api_key=record)


@router.get(
    "/api/v1/billing/usage",
    summary="API Key Usage & Remaining Quota",
)
def get_usage(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Reports the caller's tier, usage, and remaining quota for the month."""
    key_record = get_api_key(x_api_key)
    if key_record is None:
        raise HTTPException(status_code=401, detail="Unknown or malformed API key.")

    quota = resolve_key_quota(key_record)
    return {
        "status": "ok",
        "tier": key_record["tier"],
        "name": key_record["name"],
        "requests_used": quota["used"],
        "limit": quota["limit"],
        "remaining": quota["remaining"],
        "unlimited": quota["unlimited"],
        "credit_based": quota["credit_based"],
        "certificate_credits": int(key_record.get("certificate_credits") or 0),
        "last_used_at": key_record["last_used_at"],
    }


@router.post(
    "/api/v1/payments/initiate",
    response_model=PaymentInitiateResponse,
    summary="Initiate Mobile Money / Card Payment",
)
def initiate_payment(req: PaymentInitiateRequest):
    """
    Starts a payment for a plan via Pesapal (MTN MoMo, Airtel Money, M-Pesa)
    or Flutterwave (cards, M-Pesa, diaspora). Returns a redirect URL.
    """
    if os.getenv("ENABLE_SELF_SERVICE_PAYMENTS", "false").lower() != "true":
        raise HTTPException(
            status_code=503,
            detail="Self-service payments are unavailable during the pilot. Do not submit payment details.",
        )

    plan = get_plan(req.plan_id)
    if plan is None or req.plan_id == "free":
        raise HTTPException(status_code=400, detail=f"Plan '{req.plan_id}' is not purchasable.")

    result = payment_gateway.initiate_payment(
        plan_id=req.plan_id,
        amount=float(plan["amount"]),
        currency=req.currency,
        provider=req.provider,
        phone=req.phone,
        email=req.email,
        description=f"NEMA {plan['title']}",
    )
    log_event("api_payment_initiated", {"plan": req.plan_id, "provider": req.provider, "result": result.get("status")})
    return PaymentInitiateResponse(**result)


@router.get(
    "/api/v1/payments/status/{provider}/{transaction_id}",
    summary="Check Payment Transaction Status",
)
def payment_status(provider: str, transaction_id: str):
    """Polls the gateway for the current state of a payment transaction."""
    result = payment_gateway.check_payment_status(provider, transaction_id)
    log_event("api_payment_status", {"provider": provider, "status": result.get("status")})
    return result


@router.post("/api/v1/payments/callback", summary="Payment Gateway Callback / IPN")
async def payment_callback(request: Request):
    """
    Receives gateway callbacks (Pesapal IPN / Flutterwave redirect webhook).
    Verifies the transaction server-side and logs the outcome for reconciliation.
    """
    try:
        payload: Dict[str, Any] = dict(await request.json())
    except Exception:
        payload = dict(request.query_params)

    provider = str(payload.get("provider", "")).lower()
    transaction_id = str(payload.get("transaction_id") or payload.get("OrderTrackingId") or payload.get("tx_ref") or "")
    reference = str(payload.get("reference") or payload.get("OrderMerchantReference") or "")

    if not transaction_id:
        return {"status": "ignored", "message": "No transaction reference in callback."}

    check = payment_gateway.check_payment_status(provider, transaction_id) if provider else {"status": "pending"}
    log_event(
        "api_payment_callback",
        {"provider": provider, "status": check.get("status"), "reference": reference},
    )
    return {"status": "received", "payment_status": check.get("status", "unknown")}


@router.post("/api/v1/billing/activate", summary="Activate a Paid Tier After Successful Payment")
def activate_paid_tier(
    api_key: str,
    plan_id: str,
    provider: str,
    transaction_id: str,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
):
    """
    Verifies a payment server-side and upgrades the API key to the purchased
    tier. This is the deterministic link between Phase 3.1 (payments) and
    Phase 3.2 (paywall): the client hits this after the gateway redirect
    confirms success.
    """
    _require_admin_token(x_admin_token)
    plan = get_plan(plan_id)
    if plan is None or plan_id == "free":
        raise HTTPException(status_code=400, detail=f"Plan '{plan_id}' is not purchasable.")

    key_record = get_api_key(api_key)
    if key_record is None:
        raise HTTPException(status_code=401, detail="Unknown or malformed API key.")

    check = payment_gateway.check_payment_status(provider, transaction_id)
    if check.get("status") != "completed":
        return {
            "status": "pending",
            "payment_status": check.get("status", "unknown"),
            "message": "Payment not confirmed yet; activation refused.",
        }

    from storage import set_api_key_tier

    if not set_api_key_tier(api_key, plan_id):
        raise HTTPException(status_code=500, detail="Could not upgrade the API key tier.")

    log_event("api_tier_activated", {"tier": plan_id, "provider": provider, "transaction_id": transaction_id})
    return {
        "status": "activated",
        "tier": plan_id,
        "plan_title": plan["title"],
        "provider": provider,
        "transaction_id": transaction_id,
    }


# --- Phase 3.3: Flood Risk Modeling --------------------------------------------------

@router.post("/api/v1/flood-risk", summary="Flood Susceptibility Index (Copernicus DEM)")
def get_flood_risk(req: FloodRiskRequest):
    """
    Computes plot elevation, slope, depression depth, and a 0-100 Flood
    Susceptibility Index from the Copernicus GLO-90 DEM.
    """
    result = flood_risk_assessment(req.lat, req.lon, width_m=req.width_m, length_m=req.length_m)
    return result


# --- Operations -----------------------------------------------------------------------

@router.post("/api/v1/admin/cleanup-certificates", summary="Purge Expired Certificate Records")
def admin_cleanup_certificates(days: int = 90, x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """Manually triggers the certificate retention cleanup run by the Celery beat task."""
    _require_admin_token(x_admin_token)
    removed = storage_cleanup_expired(days=days)
    if removed < 0:
        raise HTTPException(status_code=500, detail="Cleanup failed (storage unavailable?).")
    log_event("api_cleanup_certificates", {"days": days, "removed": removed})
    return {"status": "completed", "removed": removed}


# --- Phase 4.2: Cadastral Block / Plot Search ----------------------------------------

@router.get(
    "/api/v1/cadastral/status",
    summary="Cadastral Registry Availability",
)
def cadastral_status():
    """Reports whether a local cadastral parcel registry is loaded."""
    return cadastral_available()


@router.get(
    "/api/v1/cadastral/search",
    response_model=CadastralSearchResponse,
    summary="Search Parcel by Block & Plot Number",
)
def cadastral_search(block: str, plot: str):
    """
    Looks up a parcel by Block/Plot number (plan Phase 4.2). Returns the parcel
    centroid so it can feed straight into /api/v1/assess-plot.
    """
    try:
        result = search_parcel(block, plot)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    log_event("api_cadastral_search", {"block": block, "plot": plot, "status": result.get("status")})
    return CadastralSearchResponse(**result)


# --- Phase 4.3: B2B Batch Screening ----------------------------------------------------

@router.post(
    "/api/v1/batch/assess",
    response_model=BatchAssessResponse,
    summary="Batch Property Screening (Law Firm / Surveyor Pack)",
)
def batch_assess(req: BatchAssessRequest, request: Request, x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """
    Screens up to 100 plots in one call — the Law Firm / Surveyor Pack feature
    (plan Phase 4.3). Every plot gets the full wetland proximity risk scorecard.
    """
    key_record = _check_quota(x_api_key, request.client.host if request.client else "unknown")

    tier = key_record.get("tier") if key_record else None
    if tier != "law_firm":
        log_event("api_batch_denied", {"tier": tier or "anonymous", "count": len(req.plots)})
        raise HTTPException(
            status_code=402,
            detail=(
                "Batch screening requires the Law Firm / Surveyor Pack. "
                "Upgrade via /api/v1/payments/initiate (plan_id='law_firm')."
            ),
        )

    results = []
    for item in req.plots:
        try:
            _, _, prov, in_wetland, wetland_names, min_dist, nearest_kind = _spatial_analysis(
                item.lat, item.lon, item.width_m, item.length_m, item.label
            )
            risk = assess_property_risk(
                in_wetland, min_dist, feature_kind=nearest_kind, lat=item.lat, lon=item.lon
            )
            results.append({
                "label": item.label,
                "lat": item.lat,
                "lon": item.lon,
                "status": "success",
                "score": risk.score,
                "band": risk.band,
                "traffic_light": risk.traffic_light,
                "in_wetland": in_wetland,
                "min_distance_meters": round(min_dist, 1) if min_dist is not None else None,
                "nearest_feature_kind": nearest_kind,
                "country": risk.country,
            })
        except Exception as exc:
            results.append({
                "label": item.label,
                "lat": item.lat,
                "lon": item.lon,
                "status": "error",
                "error": str(exc),
            })

    succeeded = sum(1 for r in results if r["status"] == "success")
    log_event("api_batch_assess", {"requested": len(req.plots), "succeeded": succeeded})
    _record_usage(x_api_key, key_record, request.client.host if request.client else "unknown")

    return BatchAssessResponse(status="completed", count=len(results), results=results)

