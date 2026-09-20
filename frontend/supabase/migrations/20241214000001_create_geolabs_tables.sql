
-- Create tables for Geo-Labs advanced geospatial features

-- Environmental monitoring data table
CREATE TABLE IF NOT EXISTS environmental_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location GEOMETRY(Point, 4326) NOT NULL,
    location_name TEXT,
    data_type TEXT NOT NULL, -- 'dust', 'air_quality', 'noise', 'vegetation'
    measurement_value NUMERIC,
    measurement_unit TEXT,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_type TEXT, -- 'sensor', 'satellite', 'manual', 'api'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mining operations data table
CREATE TABLE IF NOT EXISTS mining_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'quarry', 'surface_mine', 'underground_mine'
    boundary GEOMETRY(Polygon, 4326),
    center_point GEOMETRY(Point, 4326),
    area_hectares NUMERIC,
    volume_cubic_meters NUMERIC,
    depth_meters NUMERIC,
    slope_angle NUMERIC,
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'planned', 'reclaimed'
    permits JSONB, -- regulatory permits and compliance data
    environmental_impact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time series analysis data table
CREATE TABLE IF NOT EXISTS time_series_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_name TEXT NOT NULL,
    analysis_type TEXT NOT NULL, -- 'environmental_change', 'land_cover', 'vegetation_index'
    location GEOMETRY(Polygon, 4326),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    data_source TEXT, -- 'sentinel', 'landsat', 'modis', 'custom'
    analysis_results JSONB,
    trend_direction TEXT, -- 'increasing', 'decreasing', 'stable', 'fluctuating'
    change_percentage NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professional maps metadata table
CREATE TABLE IF NOT EXISTS professional_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_name TEXT NOT NULL,
    map_type TEXT NOT NULL, -- 'environmental', 'mining', 'analysis', 'report'
    boundary GEOMETRY(Polygon, 4326),
    center_point GEOMETRY(Point, 4326),
    zoom_level INTEGER,
    style_config JSONB,
    export_formats TEXT[], -- ['pdf', 'png', 'svg', 'geotiff']
    file_urls JSONB, -- storage URLs for generated files
    generation_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_environmental_data_location ON environmental_data USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_mining_operations_boundary ON mining_operations USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_mining_operations_center ON mining_operations USING GIST (center_point);
CREATE INDEX IF NOT EXISTS idx_time_series_location ON time_series_analysis USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_professional_maps_boundary ON professional_maps USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_professional_maps_center ON professional_maps USING GIST (center_point);

-- Create indexes on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_environmental_data_type ON environmental_data (data_type);
CREATE INDEX IF NOT EXISTS idx_environmental_data_date ON environmental_data (measurement_date);
CREATE INDEX IF NOT EXISTS idx_mining_operations_type ON mining_operations (operation_type);
CREATE INDEX IF NOT EXISTS idx_mining_operations_status ON mining_operations (status);
CREATE INDEX IF NOT EXISTS idx_time_series_type ON time_series_analysis (analysis_type);
CREATE INDEX IF NOT EXISTS idx_professional_maps_type ON professional_maps (map_type);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE environmental_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_series_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_maps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can read all environmental data" ON environmental_data
    FOR SELECT USING (true);

CREATE POLICY "Users can insert environmental data" ON environmental_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read all mining operations" ON mining_operations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert mining operations" ON mining_operations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read all time series analysis" ON time_series_analysis
    FOR SELECT USING (true);

CREATE POLICY "Users can insert time series analysis" ON time_series_analysis
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read all professional maps" ON professional_maps
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own professional maps" ON professional_maps
    FOR ALL USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_environmental_data_updated_at 
    BEFORE UPDATE ON environmental_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mining_operations_updated_at 
    BEFORE UPDATE ON mining_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_series_analysis_updated_at 
    BEFORE UPDATE ON time_series_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_maps_updated_at 
    BEFORE UPDATE ON professional_maps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
