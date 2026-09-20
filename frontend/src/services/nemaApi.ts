/**
 * NEMA Compliance API Service
 * TypeScript client for the NEMA FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_NEMA_API_URL || 'http://localhost:8000';

// ==================== Types ====================

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties?: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  crs?: Record<string, any>;
}

export interface ComplianceCheckRequest {
  site_geojson: GeoJSONFeatureCollection;
  buffer_zone_m?: number;
  include_distance?: boolean;
  include_wetland_names?: boolean;
}

export interface ComplianceResult {
  in_wetland: boolean;
  wetland_names: string[];
  min_distance_m: number | null;
  risk_level: 'CRITICAL' | 'HIGH' | 'LOW' | 'UNKNOWN';
  compliant: boolean;
  message: string;
  recommendation: string;
  buffer_violation: boolean;
  checked_at: string;
}

export interface BatchSite {
  name: string;
  geojson: GeoJSONFeatureCollection;
}

export interface BatchComplianceRequest {
  sites: BatchSite[];
  buffer_zone_m?: number;
  include_distance?: boolean;
}

export interface BatchComplianceResult {
  results: Array<ComplianceResult & { site_name: string }>;
  total_sites: number;
  compliant_sites: number;
  non_compliant_sites: number;
  processing_time_s: number;
  processed_at: string;
}

export interface WetlandsSearchRequest {
  bounds?: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  point?: {
    lon: number;
    lat: number;
    radius_km?: number;
  };
  limit?: number;
}

export interface WetlandsSearchResult {
  wetlands: GeoJSONFeatureCollection;
  count: number;
  searched_at: string;
}

export interface ReportGenerationRequest {
  site_name: string;
  site_geojson: GeoJSONFeatureCollection;
  compliance_result: ComplianceResult;
  applicant_info?: Record<string, string>;
  format?: 'markdown' | 'html' | 'pdf';
}

export interface ReportGenerationResult {
  report_content: string;
  format: string;
  generated_at: string;
  download_url?: string;
}

export interface MapExportRequest {
  site_geojson: GeoJSONFeature;
  buffer_m?: number; // 100-50000, default 5000
  use_satellite?: boolean; // true for satellite, false for street view
  site_label_text?: string;
  show_site_label?: boolean;
  dpi?: number; // 72-300, default 200
}

export interface MapExportResult {
  image_base64: string;
  format: string; // 'png'
  width_px: number;
  height_px: number;
  dpi: number;
  file_size_kb: number;
  generated_at: string;
  metadata: {
    center_lon: number;
    center_lat: number;
    bounds: [number, number, number, number];
    buffer_m: number;
    wetlands_count: number;
    basemap_used: boolean;
  };
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  features_enabled: {
    compliance_check: boolean;
    distance_calculation: boolean;
    report_generation: boolean;
    batch_processing: boolean;
    wetlands_search: boolean;
    map_visualization: boolean;
  };
  wetlands_loaded: boolean;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  timestamp: string;
}

// ==================== API Service Class ====================

export class NEMAApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check API health and feature availability
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Check compliance for a single site
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/compliance/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_geojson: request.site_geojson,
        buffer_zone_m: request.buffer_zone_m ?? 200,
        include_distance: request.include_distance ?? true,
        include_wetland_names: request.include_wetland_names ?? true,
      }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail || error.error || 'Compliance check failed');
    }

    return response.json();
  }

  /**
   * Check compliance for multiple sites (batch processing)
   */
  async batchCheck(
    sites: BatchSite[],
    bufferZone: number = 200,
    includeDistance: boolean = true
  ): Promise<BatchComplianceResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/compliance/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sites,
        buffer_zone_m: bufferZone,
        include_distance: includeDistance,
      }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail || error.error || 'Batch check failed');
    }

    return response.json();
  }

  /**
   * Search for wetlands by bounds or point + radius
   */
  async searchWetlands(request: WetlandsSearchRequest): Promise<WetlandsSearchResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/wetlands/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bounds: request.bounds,
        point: request.point,
        limit: request.limit ?? 100,
      }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail || error.error || 'Wetlands search failed');
    }

    return response.json();
  }

  /**
   * Export professional map with wetlands overlay
   */
  async exportMap(request: MapExportRequest): Promise<MapExportResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/map/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_geojson: request.site_geojson,
        buffer_m: request.buffer_m ?? 5000,
        use_satellite: request.use_satellite ?? true,
        site_label_text: request.site_label_text,
        show_site_label: request.show_site_label ?? true,
        dpi: request.dpi ?? 200,
      }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail || error.error || 'Map export failed');
    }

    return response.json();
  }

  /**
   * Generate a compliance report
   */
  async generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_name: request.site_name,
        site_geojson: request.site_geojson,
        compliance_result: request.compliance_result,
        applicant_info: request.applicant_info,
        format: request.format ?? 'markdown',
      }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail || error.error || 'Report generation failed');
    }

    return response.json();
  }
}

// ==================== Singleton Instance ====================

export const nemaApi = new NEMAApiService();

// ==================== Helper Functions ====================

/**
 * Convert Leaflet layer to GeoJSON
 */
export function layerToGeoJSON(layer: any): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [layer.toGeoJSON()],
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'red';
    case 'HIGH':
      return 'orange';
    case 'LOW':
      return 'green';
    case 'UNKNOWN':
    default:
      return 'gray';
  }
}

/**
 * Get risk level badge variant
 */
export function getRiskLevelVariant(riskLevel: string): 'destructive' | 'warning' | 'success' | 'secondary' {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'destructive';
    case 'HIGH':
      return 'warning';
    case 'LOW':
      return 'success';
    case 'UNKNOWN':
    default:
      return 'secondary';
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number | null): string {
  if (meters === null) return 'N/A';
  if (meters < 1000) return `${meters.toFixed(0)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Download base64 image as PNG file
 */
export function downloadBase64Image(base64: string, filename: string = 'map-export.png'): void {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to blob
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
