from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class GeometryModel(BaseModel):
    """GeoJSON Geometry"""
    type: str
    coordinates: List[Any]


class FeatureModel(BaseModel):
    """GeoJSON Feature"""
    type: str = "Feature"
    geometry: GeometryModel
    properties: Optional[Dict[str, Any]] = {}


class FeatureCollectionModel(BaseModel):
    """GeoJSON FeatureCollection"""
    type: str = "FeatureCollection"
    features: List[FeatureModel]
    crs: Optional[Dict[str, Any]] = None


class ComplianceCheckRequest(BaseModel):
    """Request model for compliance check"""
    site_geojson: FeatureCollectionModel
    buffer_zone_m: float = Field(default=200.0, ge=0, le=1000)
    include_distance: bool = True
    include_wetland_names: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "site_geojson": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [[[32.5, 0.3], [32.6, 0.3], [32.6, 0.4], [32.5, 0.4], [32.5, 0.3]]]
                            },
                            "properties": {"name": "Test Site"}
                        }
                    ]
                },
                "buffer_zone_m": 200.0,
                "include_distance": True,
                "include_wetland_names": True
            }
        }


class ComplianceResult(BaseModel):
    """Result model for compliance check"""
    in_wetland: bool
    wetland_names: List[str] = []
    min_distance_m: Optional[float] = None
    risk_level: str
    compliant: bool
    message: str
    recommendation: str
    buffer_violation: bool
    checked_at: datetime = Field(default_factory=datetime.utcnow)


class BatchComplianceRequest(BaseModel):
    """Request model for batch compliance checking"""
    sites: List[Dict[str, Any]]  # List of {name, geojson}
    buffer_zone_m: float = 200.0
    include_distance: bool = True
    
    @validator('sites')
    def validate_sites(cls, v):
        if len(v) == 0:
            raise ValueError("Sites list cannot be empty")
        if len(v) > 100:
            raise ValueError("Maximum 100 sites per batch")
        return v


class BatchComplianceResult(BaseModel):
    """Result model for batch compliance checking"""
    results: List[Dict[str, Any]]
    total_sites: int
    compliant_sites: int
    non_compliant_sites: int
    processing_time_s: float
    processed_at: datetime = Field(default_factory=datetime.utcnow)


class WetlandsSearchRequest(BaseModel):
    """Request model for wetlands search"""
    bounds: Optional[List[float]] = Field(
        None,
        description="Bounding box [min_lon, min_lat, max_lon, max_lat]",
        min_items=4,
        max_items=4
    )
    point: Optional[Dict[str, float]] = Field(
        None,
        description="Center point {lon, lat} with optional radius_km"
    )
    limit: int = Field(default=100, ge=1, le=1000)


class WetlandsSearchResult(BaseModel):
    """Result model for wetlands search"""
    wetlands: FeatureCollectionModel
    count: int
    searched_at: datetime = Field(default_factory=datetime.utcnow)


class ReportGenerationRequest(BaseModel):
    """Request model for report generation"""
    site_name: str
    site_geojson: FeatureCollectionModel
    compliance_result: ComplianceResult
    applicant_info: Optional[Dict[str, str]] = None
    format: str = Field(default="markdown", pattern="^(markdown|html|pdf)$")


class ReportGenerationResult(BaseModel):
    """Result model for report generation"""
    report_content: str
    format: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    download_url: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str
    features_enabled: Dict[str, bool]
    wetlands_loaded: bool


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MapExportRequest(BaseModel):
    """Request model for professional map export"""
    site_geojson: FeatureCollectionModel
    buffer_m: float = Field(default=5000.0, ge=100, le=50000, description="Analysis buffer in meters")
    use_satellite: bool = Field(default=True, description="Use satellite view instead of street map")
    site_label_text: Optional[str] = Field(None, description="Custom label for the site")
    show_site_label: bool = Field(default=True, description="Show site marker and label")
    dpi: int = Field(default=200, ge=72, le=300, description="Image quality (DPI)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "site_geojson": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[32.5, 0.3], [32.51, 0.3], [32.51, 0.31], [32.5, 0.31], [32.5, 0.3]]]
                        },
                        "properties": {"name": "My Project Site"}
                    }]
                },
                "buffer_m": 5000,
                "use_satellite": True,
                "site_label_text": "Proposed Development Site",
                "show_site_label": True,
                "dpi": 200
            }
        }


class MapExportResult(BaseModel):
    """Result model for map export"""
    image_base64: str = Field(description="PNG image encoded as base64")
    format: str = "png"
    width_px: int
    height_px: int
    dpi: int
    file_size_kb: float
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
