/**
 * lib/types.ts
 *
 * TypeScript mirror of the FastAPI Pydantic schemas (api/schemas.py).
 * Keep in sync with the backend when contracts change.
 */

export type RiskBand = "Safe" | "Caution" | "High Risk";
export type TrafficLight = "green" | "yellow" | "red";

export interface RiskScorecard {
  score: number;
  band: RiskBand | string;
  label: string;
  color: string;
  traffic_light: TrafficLight | string;
  is_restricted: boolean;
  flags: string[];
  country: string;
  statutory_buffer_m: number | null;
  headline: string;
  guidance: string;
  legal_references: string[];
  in_wetland: boolean;
  distance_m: number | null;
  feature_kind: string | null;
  disclaimer?: string;
}

export interface AssessPlotRequest {
  lat?: number;
  lon?: number;
  query?: string;
  dms?: string;
  map_link?: string;
  width_m?: number;
  length_m?: number;
  plot_label?: string;
  include_flood_risk?: boolean;
}

export interface ComplianceResult {
  in_wetland: boolean;
  wetland_names: string[];
  min_distance_meters: number | null;
  nearest_feature_kind: string | null;
}

export interface Provenance {
  source: string;
  used_cache?: boolean;
  used_osm?: boolean;
  cached?: boolean;
  count?: number;
  message: string;
}

export interface FloodRisk {
  status: "available" | "unavailable";
  reason?: string;
  message?: string;
  method?: string;
  samples?: number;
  elevation_m?: number;
  surrounding_elevation_m?: number;
  max_slope_deg?: number;
  depression_depth_m?: number;
  elevation_range_m?: number;
  susceptibility_index?: number;
  band?: "Low" | "Moderate" | "Elevated" | "High" | string;
  components?: { slope: number; depression: number; variability: number };
  cached?: boolean;
}

export interface AssessPlotResponse {
  status: string;
  location: {
    lat: number;
    lon: number;
    label: string;
    input_method: string;
    width_m: number;
    length_m: number;
  };
  risk: RiskScorecard;
  compliance: ComplianceResult;
  provenance: Provenance;
  flood_risk: FloodRisk | null;
}

export interface BrandingPayload {
  agency_name?: string;
  agency_tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  watermark_text?: string;
  accent_color?: string;
  disclaimer_extra?: string;
}

export interface GenerateReportRequest {
  lat: number;
  lon: number;
  plot_label?: string;
  width_m?: number;
  length_m?: number;
  branding?: BrandingPayload;
}

export interface GenerateReportResponse {
  certificate_id: string;
  download_url: string;
  risk_score: number;
  risk_band: string;
  country: string;
}

export interface VerifyResponse {
  status: "valid" | "invalid";
  certificate_id: string;
  issued_at?: string;
  message?: string;
  assessment?: {
    score?: number;
    band?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface Plan {
  plan_id: string;
  title: string;
  price_display: string;
  currency: string | null;
  amount: number;
  reports_per_month: number; // -1 = unlimited
  certificates: boolean;
  includes: string[];
}

/** GET /api/v1/billing/plans returns the catalog keyed by plan_id. */
export type PlansResponse = {
  status: string;
  plans: Record<string, Plan>;
};

export interface ApiKeyRecord {
  key: string;
  name: string | null;
  tier: string;
  requests_used: number;
  created_at: string;
  last_used_at: string | null;
}

export interface UsageResponse {
  status: string;
  tier: string;
  name: string | null;
  requests_used: number;
  limit: number;
  remaining: number | null;
  unlimited: boolean;
  last_used_at: string | null;
}

export interface PaymentInitiateRequest {
  plan_id: string;
  provider?: "pesapal" | "flutterwave";
  phone?: string;
  email?: string;
  currency?: string;
}

export interface PaymentInitiateResponse {
  status: string;
  provider: string;
  reference?: string | null;
  transaction_id?: string | null;
  redirect_url?: string | null;
  message?: string | null;
}

export interface CadastralSearchResponse {
  status: "found" | "not_found" | "not_available";
  block?: string;
  plot?: string;
  parcel_name?: string | null;
  centroid?: { lat: number; lon: number } | null;
  area_m2?: number | null;
  bounds?: number[] | null;
  geometry_geojson?: GeoJSONPolygon | null;
  source?: string;
  message?: string;
  /** Present only for `not_available` (spread from cadastral_available()). */
  available?: boolean;
  path?: string | null;
  layers?: string[];
}

export interface GeoJSONPolygon {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

export interface BatchPlotItem {
  lat: number;
  lon: number;
  label: string;
  width_m?: number;
  length_m?: number;
}

export interface BatchAssessResult {
  label: string;
  lat: number;
  lon: number;
  status: "success" | "error";
  score?: number;
  band?: string;
  traffic_light?: TrafficLight | string;
  in_wetland?: boolean;
  min_distance_meters?: number | null;
  nearest_feature_kind?: string | null;
  country?: string;
  error?: string;
}

export interface BatchAssessResponse {
  status: string;
  count: number;
  results: BatchAssessResult[];
}
