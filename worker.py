"""
worker.py

Celery Task Worker (plan Phase 2.4):
- Asynchronously handles PDF certificate generation
- Offloads heavy map rendering from the API event loop
- Uses Redis as broker and result backend
- Configuration lives in celery_config.py (task routing, queues, beat schedule)
"""

from celery import Celery

# Task logic imports
from risk_score import assess_property_risk
from certificate import build_certificate_pdf, generate_verification_id
from storage import save_certificate, log_event
from wetland_cache import load_wetlands_nearby, available_sources
from location_input import plot_polygon_from_point
from celery_config import celery_app_config

# Celery app — config (broker, backend, routes, beat schedule) from celery_config.py
celery_app = Celery("nema_tasks", include=["worker"])
celery_app.conf.update(celery_app_config)


@celery_app.task(name="worker.generate_certificate_task")
def generate_certificate_task(req_data: dict):
    """
    Background task to generate a NEMA certificate.
    """
    lat = req_data["lat"]
    lon = req_data["lon"]
    plot_label = req_data.get("plot_label", "Unnamed Plot")
    width_m = req_data.get("width_m", 30)
    length_m = req_data.get("length_m", 30)

    # 1. Spatial Analysis
    site_gdf = plot_polygon_from_point(lat, lon, width_m=width_m, length_m=length_m, name=plot_label)
    wetlands_gdf, prov = load_wetlands_nearby(lat, lon, radius_m=2000)

    in_wetland = False
    min_dist = None
    nearest_kind = None
    wetland_names = []

    if wetlands_gdf is not None and not wetlands_gdf.empty:
        # Import here to avoid circular dependencies if any
        from report_logic import check_compliance, calculate_min_distance
        in_wetland, wetland_names = check_compliance(site_gdf, wetlands_gdf)
        if not in_wetland:
            min_dist = calculate_min_distance(site_gdf, wetlands_gdf)
        
        # Determine nearest feature kind
        try:
            from report_logic import estimate_utm_crs_for
            import geopandas as gpd
            from shapely.geometry import Point
            utm = estimate_utm_crs_for(site_gdf)
            pt = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(utm).iloc[0]
            wet_proj = wetlands_gdf.to_crs(utm)
            dists = wet_proj.geometry.distance(pt)
            near_idx = dists.idxmin()
            if "feature_kind" in wet_proj.columns:
                nearest_kind = wet_proj.loc[near_idx, "feature_kind"]
        except:
            pass

    # 2. Risk Scoring
    risk = assess_property_risk(in_wetland, min_dist, feature_kind=nearest_kind, lat=lat, lon=lon)
    cert_id = generate_verification_id(lat, lon, risk.band)

    # 3. PDF Generation (The heavy part)
    pdf_bytes = build_certificate_pdf(
        certificate_id=cert_id,
        risk=risk,
        site_label=plot_label,
        lat=lat,
        lon=lon,
        distance_m=min_dist,
        wetland_names=wetland_names,
        feature_kind=nearest_kind,
        site_gdf=site_gdf,
        wetlands_gdf=wetlands_gdf,
        provenance=prov,
        branding=req_data.get("branding") if isinstance(req_data.get("branding"), dict) else None,
    )

    # 4. Persistence
    save_certificate(cert_id, {
        "score": risk.score,
        "band": risk.band,
        "country": risk.country,
        "lat": lat,
        "lon": lon,
    })
    
    # We store the PDF path or identifier if we were using blob storage
    # For now, we'll return the cert_id and the caller can check the DB
    return {
        "status": "completed",
        "certificate_id": cert_id,
        "risk_band": risk.band,
        "score": risk.score
    }


@celery_app.task(name="worker.process_spatial_query")
def process_spatial_query(lat: float, lon: float, radius_m: float = 5000):
    """
    Background task for heavy spatial queries.
    Returns wetland features and proximity analysis.
    """
    wetlands_gdf, prov = load_wetlands_nearby(lat, lon, radius_m=radius_m)
    
    if wetlands_gdf is None or wetlands_gdf.empty:
        return {
            "status": "empty",
            "features": [],
            "provenance": prov,
        }
    
    # Convert to JSON-serializable format
    features = []
    for _, row in wetlands_gdf.iterrows():
        feature = {
            "name": row.get("name", "Unknown"),
            "feature_kind": row.get("feature_kind", "unknown"),
            "source": row.get("source", "unknown"),
            "geometry": row.geometry.wkt if row.geometry else None,
        }
        features.append(feature)
    
    return {
        "status": "completed",
        "features": features,
        "count": len(features),
        "provenance": prov,
    }


@celery_app.task(name="worker.cleanup_expired_certificates")
def cleanup_expired_certificates():
    """
    Periodic task to clean up expired certificates from storage.
    """
    from storage import cleanup_expired_certificates as _cleanup
    try:
        count = _cleanup()
        return {"status": "completed", "cleaned": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@celery_app.task(name="worker.refresh_cache_stats")
def refresh_cache_stats():
    """
    Periodic task to refresh cache statistics.
    """
    try:
        sources = available_sources()
        return {"status": "completed", "sources": sources}
    except Exception as e:
        return {"status": "error", "message": str(e)}
