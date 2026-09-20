-- Phase 1: Database & Real-Time Infrastructure Foundation
-- Create comprehensive monitoring data tables

-- Environmental monitoring points table
CREATE TABLE public.environmental_monitoring_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location GEOMETRY(POINT, 4326) NOT NULL,
  location_name TEXT,
  monitoring_type TEXT[] DEFAULT ARRAY['air_quality', 'weather', 'water_quality', 'vegetation']::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  alert_thresholds JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time series sensor data table
CREATE TABLE public.sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitoring_point_id UUID REFERENCES public.environmental_monitoring_points(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  measurement_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  quality_flag TEXT DEFAULT 'good' CHECK (quality_flag IN ('good', 'questionable', 'bad')),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time alerts table
CREATE TABLE public.environmental_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitoring_point_id UUID REFERENCES public.environmental_monitoring_points(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  trigger_value NUMERIC,
  threshold_value NUMERIC,
  location_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Satellite imagery metadata table
CREATE TABLE public.satellite_imagery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id TEXT UNIQUE NOT NULL,
  satellite TEXT NOT NULL,
  sensor TEXT NOT NULL,
  acquisition_date TIMESTAMP WITH TIME ZONE NOT NULL,
  cloud_coverage NUMERIC,
  spatial_resolution NUMERIC,
  spectral_bands TEXT[],
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  file_url TEXT,
  processing_level TEXT,
  quality_score NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analysis results table
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  analysis_name TEXT NOT NULL,
  location GEOMETRY(POLYGON, 4326),
  parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress NUMERIC DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Data sources configuration table
CREATE TABLE public.data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  api_endpoint TEXT,
  authentication_type TEXT,
  parameters JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_interval INTERVAL DEFAULT '1 hour',
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_monitoring_points_location ON public.environmental_monitoring_points USING GIST (location);
CREATE INDEX idx_monitoring_points_user ON public.environmental_monitoring_points (user_id);
CREATE INDEX idx_sensor_readings_point_time ON public.sensor_readings (monitoring_point_id, recorded_at DESC);
CREATE INDEX idx_sensor_readings_type_time ON public.sensor_readings (sensor_type, measurement_type, recorded_at DESC);
CREATE INDEX idx_alerts_user_status ON public.environmental_alerts (user_id, status);
CREATE INDEX idx_alerts_point_created ON public.environmental_alerts (monitoring_point_id, created_at DESC);
CREATE INDEX idx_satellite_geometry ON public.satellite_imagery USING GIST (geometry);
CREATE INDEX idx_satellite_date ON public.satellite_imagery (acquisition_date DESC);
CREATE INDEX idx_analysis_user_status ON public.analysis_results (user_id, status);

-- Enable Row Level Security
ALTER TABLE public.environmental_monitoring_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellite_imagery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Monitoring points: users can manage their own
CREATE POLICY "Users can manage their own monitoring points" ON public.environmental_monitoring_points
  FOR ALL USING (auth.uid() = user_id);

-- Sensor readings: users can view readings from their monitoring points
CREATE POLICY "Users can view sensor readings from their points" ON public.sensor_readings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.environmental_monitoring_points 
      WHERE id = monitoring_point_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert sensor readings" ON public.sensor_readings
  FOR INSERT WITH CHECK (true);

-- Alerts: users can manage their own alerts
CREATE POLICY "Users can manage their own alerts" ON public.environmental_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Satellite imagery: publicly readable for analysis
CREATE POLICY "Satellite imagery is publicly readable" ON public.satellite_imagery
  FOR SELECT USING (true);

-- Analysis results: users can manage their own
CREATE POLICY "Users can manage their own analysis results" ON public.analysis_results
  FOR ALL USING (auth.uid() = user_id);

-- Data sources: publicly readable, admin writable
CREATE POLICY "Data sources are publicly readable" ON public.data_sources
  FOR SELECT USING (true);

-- Create trigger functions for automatic updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_monitoring_points_updated_at
  BEFORE UPDATE ON public.environmental_monitoring_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON public.data_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Set up real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.environmental_monitoring_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.environmental_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_results;

-- Ensure REPLICA IDENTITY FULL for real-time updates
ALTER TABLE public.environmental_monitoring_points REPLICA IDENTITY FULL;
ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
ALTER TABLE public.environmental_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.analysis_results REPLICA IDENTITY FULL;

-- Insert default data sources
INSERT INTO public.data_sources (name, type, api_endpoint, authentication_type, parameters) VALUES
('OpenWeatherMap', 'weather', 'https://api.openweathermap.org/data/2.5', 'api_key', '{"requires_key": true}'),
('OpenAQ', 'air_quality', 'https://api.openaq.org/v2', 'none', '{"rate_limit": 1000}'),
('Open-Meteo', 'weather', 'https://api.open-meteo.com/v1', 'none', '{"rate_limit": 10000}'),
('USGS Water Services', 'water_quality', 'https://waterservices.usgs.gov', 'none', '{"rate_limit": 100}'),
('NASA EarthData', 'satellite', 'https://earthdata.nasa.gov', 'oauth', '{"requires_auth": true}'),
('Google Earth Engine', 'satellite', 'https://earthengine.googleapis.com', 'oauth', '{"requires_auth": true}');