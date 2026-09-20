
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeospatialOperation {
  operation_type: 'volume_calculation' | 'slope_analysis' | 'buffer_analysis' | 'intersection_analysis';
  geometry_data?: any;
  parameters?: Record<string, any>;
}

export interface ProfessionalMapRequest {
  map_name: string;
  map_type: 'environmental' | 'mining' | 'analysis' | 'report';
  boundary?: number[][][];
  center_point?: [number, number];
  zoom_level?: number;
  style_config?: Record<string, any>;
  export_formats: Array<'pdf' | 'png' | 'svg' | 'geotiff'>;
}

export interface EnvironmentalAnalysisRequest {
  analysis_type: 'environmental_change' | 'land_cover' | 'vegetation_index' | 'surface_change' | 'water_body_change';
  location: number[][][];
  start_date: string;
  end_date: string;
  data_sources?: string[];
}

export const useGeospatialAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const processGeospatialData = async (operation: GeospatialOperation) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('geospatial-processing', {
        body: operation
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Processing Complete",
        description: `${operation.operation_type} analysis finished successfully`,
      });

      return data;
    } catch (error) {
      console.error('Geospatial processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process geospatial data",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const generateProfessionalMap = async (request: ProfessionalMapRequest) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-professional-map', {
        body: request
      });

      if (error) throw error;

      toast({
        title: "Map Generation Started",
        description: `Professional map "${request.map_name}" is being generated`,
      });

      return data;
    } catch (error) {
      console.error('Map generation error:', error);
      toast({
        title: "Map Generation Failed",
        description: "Failed to generate professional map",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const runEnvironmentalAnalysis = async (request: EnvironmentalAnalysisRequest) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('environmental-analysis', {
        body: request
      });

      if (error) throw error;

      toast({
        title: "Analysis Started",
        description: `Environmental analysis for ${request.analysis_type} initiated`,
      });

      return data;
    } catch (error) {
      console.error('Environmental analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to start environmental analysis",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    results,
    processGeospatialData,
    generateProfessionalMap,
    runEnvironmentalAnalysis,
  };
};
