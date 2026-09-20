"""FastAPI Schemas for NEMA Compliance REST API."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class AssessPlotRequest(BaseModel):
    lat: Optional[float] = Field(None, description="Latitude in WGS84 decimal degrees")
    lon: Optional[float] = Field(None, description="Longitude in WGS84 decimal degrees")
    query: Optional[str] = Field(None, description="Landmark, town, or street query")
    dms: Optional[str] = Field(None, description="DMS coordinate string")
    map_link: Optional[str] = Field(None, description="Google Maps, WhatsApp, or Apple Maps URL")
    width_m: float = Field(30.0, description="Plot width in meters")
    length_m: float = Field(30.0, description="Plot length in meters")
    plot_label: str = Field("Property Plot", description="Descriptive label for the plot")
    include_flood_risk: bool = Field(False, description="Also compute the Copernicus DEM flood susceptibility index")


class AssessPlotResponse(BaseModel):
    status: str
    location: Dict[str, Any]
    risk: Dict[str, Any]
    compliance: Dict[str, Any]
    provenance: Dict[str, Any]
    flood_risk: Optional[Dict[str, Any]] = None


class GenerateReportRequest(BaseModel):
    lat: float
    lon: float
    plot_label: str = "Property Plot"
    width_m: float = 30.0
    length_m: float = 30.0
    branding: Optional[Dict[str, Any]] = Field(
        None,
        description="White-label overrides (agency_name, watermark_text, accent_color...). Pro/Law-Firm tiers only.",
    )


class GenerateReportResponse(BaseModel):
    certificate_id: str
    download_url: str
    risk_score: int
    risk_band: str
    country: str


class FeedbackRequest(BaseModel):
    feedback_text: str = Field(..., min_length=3, max_length=1000)
    meta: Optional[Dict[str, Any]] = None


# --- Phase 3.2: Freemium Paywall & API Keys ---------------------------------------

class ApiKeyRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80, description="Owner label, e.g. agency or app name")
    tier: str = Field("free", description="Pricing tier: free | instant | pro | law_firm")


class ApiKeyResponse(BaseModel):
    status: str
    api_key: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


class PaymentInitiateRequest(BaseModel):
    plan_id: str = Field(..., description="Plan to purchase: instant | pro | law_firm")
    provider: str = Field("pesapal", description="Gateway: pesapal | flutterwave")
    phone: Optional[str] = Field(None, description="Mobile Money phone number (MTN / Airtel / M-Pesa)")
    email: Optional[str] = Field(None, description="Payer email for receipts")
    currency: str = Field("USD", description="ISO currency code, e.g. USD, UGX, KES")


class PaymentInitiateResponse(BaseModel):
    status: str
    provider: str
    reference: Optional[str] = None
    transaction_id: Optional[str] = None
    redirect_url: Optional[str] = None
    message: Optional[str] = None


class FloodRiskRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    width_m: float = Field(30.0, gt=0, le=2000)
    length_m: float = Field(30.0, gt=0, le=2000)


# --- Phase 4: White-label, Cadastral & B2B ------------------------------------------

class CadastralSearchResponse(BaseModel):
    status: str
    block: Optional[str] = None
    plot: Optional[str] = None
    parcel_name: Optional[str] = None
    centroid: Optional[Dict[str, Any]] = None
    area_m2: Optional[float] = None
    bounds: Optional[list] = None
    geometry_geojson: Optional[Dict[str, Any]] = None
    source: Optional[str] = None
    message: Optional[str] = None


class BatchPlotItem(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    label: str = Field("Plot", max_length=120)
    width_m: float = Field(30.0, gt=0, le=2000)
    length_m: float = Field(30.0, gt=0, le=2000)


class BatchAssessRequest(BaseModel):
    plots: list[BatchPlotItem] = Field(..., min_length=1, max_length=100,
                                       description="Up to 100 plots per batch (Law Firm / Surveyor Pack)")


class BatchAssessResponse(BaseModel):
    status: str
    count: int
    results: list
