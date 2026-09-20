"""
FastAPI application for NEMA compliance checking
Modular API with feature flags for selective extraction
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import geopandas as gpd
import json
import time
from pathlib import Path
from datetime import datetime

from config import settings
from models import (
    ComplianceCheckRequest,
    ComplianceResult,
    BatchComplianceRequest,
    BatchComplianceResult,
    WetlandsSearchRequest,
    WetlandsSearchResult,
    ReportGenerationRequest,
    ReportGenerationResult,
    HealthCheckResponse,
    ErrorResponse,
    FeatureCollectionModel,
    MapExportRequest,
    MapExportResult
)
from core import (
    check_compliance,
    calculate_min_distance,
    assess_compliance_risk,
    load_wetlands_data,
    validate_site_geometry
)
from map_export import export_map_to_png
import base64


# Initialize FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ALLOWED_ORIGINS == "*" else settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global wetlands data (loaded on startup)
wetlands_gdf: Optional[gpd.GeoDataFrame] = None


@app.on_event("startup")
async def startup_event():
    """Load wetlands data on startup"""
    global wetlands_gdf
    
    try:
        wetlands_path = Path(settings.WETLANDS_DATA_PATH)
        if wetlands_path.exists():
            wetlands_gdf = load_wetlands_data(str(wetlands_path))
            if wetlands_gdf is not None:
                print(f"✅ Loaded {len(wetlands_gdf)} wetlands")
            else:
                print("⚠️  Failed to load wetlands data")
        else:
            print(f"⚠️  Wetlands data not found at {wetlands_path}")
    except Exception as e:
        print(f"❌ Error loading wetlands: {e}")


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "NEMA Compliance API",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy" if wetlands_gdf is not None else "degraded",
        version=settings.API_VERSION,
        features_enabled={
            "compliance_check": settings.ENABLE_COMPLIANCE_CHECK,
            "distance_calculation": settings.ENABLE_DISTANCE_CALCULATION,
            "report_generation": settings.ENABLE_REPORT_GENERATION,
            "batch_processing": settings.ENABLE_BATCH_PROCESSING,
            "wetlands_search": settings.ENABLE_WETLANDS_SEARCH,
            "map_visualization": settings.ENABLE_MAP_VISUALIZATION,
        },
        wetlands_loaded=wetlands_gdf is not None
    )


@app.post("/api/v1/compliance/check", response_model=ComplianceResult)
async def check_site_compliance(request: ComplianceCheckRequest):
    """
    Check if a site complies with NEMA wetland regulations.
    
    This endpoint accepts a GeoJSON site boundary and checks:
    1. Whether it intersects any protected wetlands
    2. Minimum distance to nearest wetland
    3. Compliance with buffer zone requirements
    """
    if not settings.ENABLE_COMPLIANCE_CHECK:
        raise HTTPException(status_code=403, detail="Compliance check feature is disabled")
    
    if wetlands_gdf is None:
        raise HTTPException(status_code=503, detail="Wetlands data not loaded")
    
    try:
        # Convert GeoJSON to GeoDataFrame
        site_gdf = gpd.GeoDataFrame.from_features(
            request.site_geojson.dict()["features"],
            crs="EPSG:4326"
        )
        
        # Validate geometry
        is_valid, error_msg = validate_site_geometry(site_gdf)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid site geometry: {error_msg}")
        
        # Check compliance
        in_wetland, wetland_names = check_compliance(site_gdf, wetlands_gdf)
        
        # Calculate distance (if enabled and not in wetland)
        min_distance = None
        if settings.ENABLE_DISTANCE_CALCULATION and request.include_distance:
            if not in_wetland:
                min_distance = calculate_min_distance(
                    site_gdf,
                    wetlands_gdf,
                    settings.UTM_CRS
                )
        
        # Assess risk
        risk_assessment = assess_compliance_risk(
            in_wetland,
            min_distance,
            request.buffer_zone_m
        )
        
        return ComplianceResult(
            in_wetland=in_wetland,
            wetland_names=wetland_names if request.include_wetland_names else [],
            min_distance_m=min_distance,
            **risk_assessment
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")


@app.post("/api/v1/compliance/batch", response_model=BatchComplianceResult)
async def batch_compliance_check(request: BatchComplianceRequest):
    """
    Check compliance for multiple sites in a single request.
    
    Accepts up to 100 sites and returns compliance results for each.
    """
    if not settings.ENABLE_BATCH_PROCESSING:
        raise HTTPException(status_code=403, detail="Batch processing feature is disabled")
    
    if wetlands_gdf is None:
        raise HTTPException(status_code=503, detail="Wetlands data not loaded")
    
    start_time = time.time()
    results = []
    compliant_count = 0
    non_compliant_count = 0
    
    try:
        for site_data in request.sites:
            try:
                site_name = site_data.get("name", "Unnamed Site")
                site_geojson = site_data.get("geojson")
                
                # Convert to GeoDataFrame
                site_gdf = gpd.GeoDataFrame.from_features(
                    site_geojson["features"],
                    crs="EPSG:4326"
                )
                
                # Check compliance
                in_wetland, wetland_names = check_compliance(site_gdf, wetlands_gdf)
                
                # Calculate distance
                min_distance = None
                if request.include_distance and not in_wetland:
                    min_distance = calculate_min_distance(
                        site_gdf,
                        wetlands_gdf,
                        settings.UTM_CRS
                    )
                
                # Assess risk
                risk_assessment = assess_compliance_risk(
                    in_wetland,
                    min_distance,
                    request.buffer_zone_m
                )
                
                result = {
                    "site_name": site_name,
                    "in_wetland": in_wetland,
                    "wetland_names": wetland_names,
                    "min_distance_m": min_distance,
                    **risk_assessment
                }
                
                results.append(result)
                
                if risk_assessment["compliant"]:
                    compliant_count += 1
                else:
                    non_compliant_count += 1
            
            except Exception as e:
                results.append({
                    "site_name": site_data.get("name", "Unnamed Site"),
                    "error": str(e),
                    "compliant": False
                })
                non_compliant_count += 1
        
        processing_time = time.time() - start_time
        
        return BatchComplianceResult(
            results=results,
            total_sites=len(request.sites),
            compliant_sites=compliant_count,
            non_compliant_sites=non_compliant_count,
            processing_time_s=round(processing_time, 3)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


@app.post("/api/v1/wetlands/search", response_model=WetlandsSearchResult)
async def search_wetlands(request: WetlandsSearchRequest):
    """
    Search for wetlands within a bounding box or near a point.
    
    Returns wetlands as GeoJSON for map visualization.
    """
    if not settings.ENABLE_WETLANDS_SEARCH:
        raise HTTPException(status_code=403, detail="Wetlands search feature is disabled")
    
    if wetlands_gdf is None:
        raise HTTPException(status_code=503, detail="Wetlands data not loaded")
    
    try:
        filtered_wetlands = wetlands_gdf.copy()
        
        # Filter by bounds
        if request.bounds:
            min_lon, min_lat, max_lon, max_lat = request.bounds
            filtered_wetlands = filtered_wetlands.cx[min_lon:max_lon, min_lat:max_lat]
        
        # Filter by point + radius
        if request.point:
            from shapely.geometry import Point
            point = Point(request.point["lon"], request.point["lat"])
            radius_km = request.point.get("radius_km", 10)
            
            # Convert to UTM for distance calculation
            wetlands_utm = filtered_wetlands.to_crs(settings.UTM_CRS)
            point_gdf = gpd.GeoDataFrame(
                geometry=[point],
                crs="EPSG:4326"
            ).to_crs(settings.UTM_CRS)
            
            # Filter by distance
            distances = wetlands_utm.geometry.distance(point_gdf.geometry.iloc[0])
            filtered_wetlands = filtered_wetlands[distances <= radius_km * 1000]
        
        # Limit results
        filtered_wetlands = filtered_wetlands.head(request.limit)
        
        # Convert to GeoJSON
        geojson_data = json.loads(filtered_wetlands.to_json())
        
        return WetlandsSearchResult(
            wetlands=FeatureCollectionModel(**geojson_data),
            count=len(filtered_wetlands)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wetlands search failed: {str(e)}")


@app.post("/api/v1/report/generate", response_model=ReportGenerationResult)
async def generate_report(request: ReportGenerationRequest):
    """
    Generate a compliance report in Markdown, HTML, or PDF format.
    
    Creates a professional report with site details, compliance results,
    and recommendations.
    """
    if not settings.ENABLE_REPORT_GENERATION:
        raise HTTPException(status_code=403, detail="Report generation feature is disabled")
    
    try:
        # For now, generate a simple markdown report
        # Can be extended to use Jinja2 templates later
        
        report_lines = [
            f"# NEMA Compliance Report",
            f"",
            f"**Site Name:** {request.site_name}",
            f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            f"",
            f"## Compliance Status",
            f"",
            f"- **Risk Level:** {request.compliance_result.risk_level}",
            f"- **Compliant:** {'✅ Yes' if request.compliance_result.compliant else '❌ No'}",
            f"- **In Wetland:** {'Yes' if request.compliance_result.in_wetland else 'No'}",
        ]
        
        if request.compliance_result.min_distance_m is not None:
            report_lines.append(
                f"- **Distance to Wetland:** {request.compliance_result.min_distance_m:.1f}m"
            )
        
        if request.compliance_result.wetland_names:
            report_lines.extend([
                f"",
                f"## Affected Wetlands",
                f"",
            ])
            for name in request.compliance_result.wetland_names:
                report_lines.append(f"- {name}")
        
        report_lines.extend([
            f"",
            f"## Assessment",
            f"",
            f"{request.compliance_result.message}",
            f"",
            f"## Recommendation",
            f"",
            f"{request.compliance_result.recommendation}",
        ])
        
        if request.applicant_info:
            report_lines.extend([
                f"",
                f"## Applicant Information",
                f"",
            ])
            for key, value in request.applicant_info.items():
                report_lines.append(f"- **{key.replace('_', ' ').title()}:** {value}")
        
        report_content = "\n".join(report_lines)
        
        return ReportGenerationResult(
            report_content=report_content,
            format=request.format
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@app.post("/api/v1/map/export", response_model=MapExportResult)
async def export_professional_map(request: MapExportRequest):
    """
    Export a professional high-resolution map with wetlands overlay.
    
    Features:
    - Satellite or street view basemaps
    - Wetlands overlay (automatic filtering to view)
    - Custom site labels and markers
    - Scale bar and north arrow
    - Coordinate grids (UTM + Lat/Lon)
    - Analysis buffer visualization
    - Metadata boxes
    - Professional legend
    - High-DPI output (72-300 DPI)
    - Print-ready for NEMA submissions
    
    Returns high-quality PNG image as base64-encoded string.
    """
    if not settings.ENABLE_MAP_VISUALIZATION:
        raise HTTPException(status_code=403, detail="Map export feature is disabled")
    
    if wetlands_gdf is None:
        raise HTTPException(status_code=503, detail="Wetlands data not loaded")
    
    try:
        # Convert GeoJSON to GeoDataFrame
        site_gdf = gpd.GeoDataFrame.from_features(
            request.site_geojson.dict()["features"],
            crs="EPSG:4326"
        )
        
        # Validate geometry
        is_valid, error_msg = validate_site_geometry(site_gdf)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid site geometry: {error_msg}")
        
        # Export map
        print(f"🗺️  Exporting map: buffer={request.buffer_m}m, satellite={request.use_satellite}")
        png_bytes, metadata = export_map_to_png(
            site_gdf=site_gdf,
            wetlands_gdf=wetlands_gdf,
            buffer_m=request.buffer_m,
            use_satellite=request.use_satellite,
            site_label_text=request.site_label_text,
            show_site_label=request.show_site_label,
            dpi=request.dpi
        )
        
        # Encode as base64
        image_base64 = base64.b64encode(png_bytes).decode('utf-8')
        file_size_kb = len(png_bytes) / 1024
        
        # Calculate dimensions
        width_px = int(12 * request.dpi)
        height_px = int(10 * request.dpi)
        
        print(f"✅ Map exported successfully: {width_px}x{height_px}px, {file_size_kb:.1f}KB")
        
        return MapExportResult(
            image_base64=image_base64,
            format="png",
            width_px=width_px,
            height_px=height_px,
            dpi=request.dpi,
            file_size_kb=round(file_size_kb, 2),
            metadata=metadata
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Map export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Map export failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
