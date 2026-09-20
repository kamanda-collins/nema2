
// Geospatial data types for Geo-Labs

export interface EnvironmentalData {
  id: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  location_name?: string;
  data_type: 'dust' | 'air_quality' | 'noise' | 'vegetation' | 'water_quality' | 'soil_quality';
  measurement_value: number;
  measurement_unit: string;
  measurement_date: string;
  source_type: 'sensor' | 'satellite' | 'manual' | 'api';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MiningOperation {
  id: string;
  site_name: string;
  operation_type: 'quarry' | 'surface_mine' | 'underground_mine' | 'processing_plant';
  boundary?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  center_point?: {
    type: 'Point';
    coordinates: [number, number];
  };
  area_hectares?: number;
  volume_cubic_meters?: number;
  depth_meters?: number;
  slope_angle?: number;
  status: 'active' | 'inactive' | 'planned' | 'reclaimed';
  permits?: {
    permit_number?: string;
    issued_date?: string;
    expiry_date?: string;
    regulatory_body?: string;
    compliance_status?: string;
  };
  environmental_impact?: {
    impact_level?: 'low' | 'medium' | 'high';
    mitigation_measures?: string[];
    monitoring_requirements?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface TimeSeriesAnalysis {
  id: string;
  analysis_name: string;
  analysis_type: 'environmental_change' | 'land_cover' | 'vegetation_index' | 'surface_change' | 'water_body_change';
  location: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  start_date: string;
  end_date: string;
  data_source: 'sentinel' | 'landsat' | 'modis' | 'custom' | 'drone';
  analysis_results?: {
    summary?: string;
    key_findings?: string[];
    data_points?: Array<{
      date: string;
      value: number;
      metadata?: Record<string, any>;
    }>;
  };
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  change_percentage?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalMap {
  id: string;
  map_name: string;
  map_type: 'environmental' | 'mining' | 'analysis' | 'report' | 'survey';
  boundary?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  center_point?: {
    type: 'Point';
    coordinates: [number, number];
  };
  zoom_level?: number;
  style_config?: {
    base_layer?: string;
    color_scheme?: string;
    legend_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    scale_bar?: boolean;
    north_arrow?: boolean;
    title?: string;
    subtitle?: string;
  };
  export_formats: Array<'pdf' | 'png' | 'svg' | 'geotiff'>;
  file_urls?: {
    pdf?: string;
    png?: string;
    svg?: string;
    geotiff?: string;
  };
  generation_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface CreateEnvironmentalDataRequest {
  location: [number, number]; // [lng, lat]
  location_name?: string;
  data_type: EnvironmentalData['data_type'];
  measurement_value: number;
  measurement_unit: string;
  source_type: EnvironmentalData['source_type'];
  metadata?: Record<string, any>;
}

export interface CreateMiningOperationRequest {
  site_name: string;
  operation_type: MiningOperation['operation_type'];
  boundary?: number[][][];
  center_point?: [number, number];
  area_hectares?: number;
  volume_cubic_meters?: number;
  depth_meters?: number;
  slope_angle?: number;
  status?: MiningOperation['status'];
  permits?: MiningOperation['permits'];
  environmental_impact?: MiningOperation['environmental_impact'];
}

export interface CreateTimeSeriesAnalysisRequest {
  analysis_name: string;
  analysis_type: TimeSeriesAnalysis['analysis_type'];
  location: number[][][];
  start_date: string;
  end_date: string;
  data_source: TimeSeriesAnalysis['data_source'];
  metadata?: Record<string, any>;
}

export interface GenerateProfessionalMapRequest {
  map_name: string;
  map_type: ProfessionalMap['map_type'];
  boundary?: number[][][];
  center_point?: [number, number];
  zoom_level?: number;
  style_config?: ProfessionalMap['style_config'];
  export_formats: ProfessionalMap['export_formats'];
}

// Utility types for geospatial calculations
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeospatialAnalysisResult {
  area_hectares?: number;
  perimeter_meters?: number;
  centroid?: [number, number];
  bounding_box?: BoundingBox;
  elevation_stats?: {
    min: number;
    max: number;
    mean: number;
    std_dev: number;
  };
}
