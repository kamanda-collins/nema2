/**
 * React Hook for NEMA Compliance Checking
 */

import { useState, useCallback } from 'react';
import {
  nemaApi,
  downloadBase64Image,
  type ComplianceResult,
  type ComplianceCheckRequest,
  type BatchComplianceResult,
  type WetlandsSearchResult,
  type HealthCheckResponse,
  type MapExportRequest,
  type MapExportResult,
  type GeoJSONFeatureCollection,
  type BatchSite,
} from '@/services/nemaApi';
import { useToast } from '@/hooks/use-toast';

// ==================== Health Check Hook ====================

export function useNEMAHealth() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await nemaApi.healthCheck();
      setHealth(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'API Health Check Failed',
        description: errorMessage,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { health, loading, error, checkHealth };
}

// ==================== Compliance Check Hook ====================

export function useNEMACompliance() {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkCompliance = useCallback(
    async (
      siteGeoJSON: GeoJSONFeatureCollection,
      bufferZone: number = 200,
      options?: {
        includeDistance?: boolean;
        includeWetlandNames?: boolean;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const request: ComplianceCheckRequest = {
          site_geojson: siteGeoJSON,
          buffer_zone_m: bufferZone,
          include_distance: options?.includeDistance ?? true,
          include_wetland_names: options?.includeWetlandNames ?? true,
        };

        const complianceResult = await nemaApi.checkCompliance(request);
        setResult(complianceResult);

        // Show toast notification
        const variant = complianceResult.compliant ? 'default' : 'destructive';
        toast({
          variant,
          title: complianceResult.compliant ? 'Site Compliant ✅' : 'Compliance Issue ⚠️',
          description: complianceResult.message,
        });

        return complianceResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Compliance check failed';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Compliance Check Failed',
          description: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    checkCompliance,
    reset,
  };
}

// ==================== Batch Processing Hook ====================

export function useNEMABatchProcessing() {
  const [results, setResults] = useState<BatchComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processBatch = useCallback(
    async (sites: BatchSite[], bufferZone: number = 200) => {
      if (sites.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Sites',
          description: 'Please add sites to process',
        });
        return;
      }

      if (sites.length > 100) {
        toast({
          variant: 'destructive',
          title: 'Too Many Sites',
          description: 'Maximum 100 sites per batch',
        });
        return;
      }

      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        const batchResults = await nemaApi.batchCheck(sites, bufferZone, true);
        setResults(batchResults);
        setProgress(100);

        toast({
          title: 'Batch Processing Complete',
          description: `Processed ${batchResults.total_sites} sites in ${batchResults.processing_time_s.toFixed(2)}s`,
        });

        return batchResults;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Batch processing failed';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Batch Processing Failed',
          description: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    results,
    loading,
    error,
    progress,
    processBatch,
    reset,
  };
}

// ==================== Wetlands Search Hook ====================

export function useNEMAWetlandsSearch() {
  const [wetlands, setWetlands] = useState<WetlandsSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchByBounds = useCallback(
    async (bounds: [number, number, number, number], limit: number = 100) => {
      setLoading(true);
      setError(null);

      try {
        const result = await nemaApi.searchWetlands({ bounds, limit });
        setWetlands(result);
        
        toast({
          title: 'Wetlands Search Complete',
          description: `Found ${result.count} wetlands`,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Wetlands search failed';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Wetlands Search Failed',
          description: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const searchByPoint = useCallback(
    async (lon: number, lat: number, radiusKm: number = 10, limit: number = 100) => {
      setLoading(true);
      setError(null);

      try {
        const result = await nemaApi.searchWetlands({
          point: { lon, lat, radius_km: radiusKm },
          limit,
        });
        setWetlands(result);

        toast({
          title: 'Wetlands Search Complete',
          description: `Found ${result.count} wetlands within ${radiusKm}km`,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Wetlands search failed';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Wetlands Search Failed',
          description: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setWetlands(null);
    setError(null);
  }, []);

  return {
    wetlands,
    loading,
    error,
    searchByBounds,
    searchByPoint,
    reset,
  };
}

// ==================== Report Generation Hook ====================

export function useNEMAReport() {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateReport = useCallback(
    async (
      siteName: string,
      siteGeoJSON: GeoJSONFeatureCollection,
      complianceResult: ComplianceResult,
      applicantInfo?: Record<string, string>,
      format: 'markdown' | 'html' | 'pdf' = 'markdown'
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await nemaApi.generateReport({
          site_name: siteName,
          site_geojson: siteGeoJSON,
          compliance_result: complianceResult,
          applicant_info: applicantInfo,
          format,
        });

        setReport(result.report_content);

        toast({
          title: 'Report Generated',
          description: `${format.toUpperCase()} report created successfully`,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Report generation failed';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Report Generation Failed',
          description: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const downloadReport = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: `Saved as ${filename}`,
    });
  }, [toast]);

  const reset = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return {
    report,
    loading,
    error,
    generateReport,
    downloadReport,
    reset,
  };
}

// ==================== Map Export Hook ====================

export function useNEMAMapExport() {
  const [mapResult, setMapResult] = useState<MapExportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  const exportMap = useCallback(async (request: MapExportRequest) => {
    setLoading(true);
    setError(null);
    setProgress('Generating map...');

    try {
      setProgress('Fetching basemap and wetlands data...');
      const result = await nemaApi.exportMap(request);
      
      setMapResult(result);
      setProgress('Map generated successfully!');
      
      toast({
        title: 'Map Export Complete',
        description: `${result.width_px}x${result.height_px}px @ ${result.dpi} DPI (${result.file_size_kb.toFixed(1)}KB)`,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Map export failed';
      setError(errorMessage);
      setProgress('');
      
      toast({
        variant: 'destructive',
        title: 'Map Export Failed',
        description: errorMessage,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadMap = useCallback((filename?: string) => {
    if (!mapResult) {
      toast({
        variant: 'destructive',
        title: 'No Map Available',
        description: 'Generate a map first before downloading',
      });
      return;
    }

    const defaultFilename = `nema-map-${new Date().toISOString().slice(0, 10)}.png`;
    downloadBase64Image(mapResult.image_base64, filename || defaultFilename);
    
    toast({
      title: 'Map Downloaded',
      description: `Saved as ${filename || defaultFilename}`,
    });
  }, [mapResult, toast]);

  const reset = useCallback(() => {
    setMapResult(null);
    setError(null);
    setProgress('');
  }, []);

  return {
    mapResult,
    loading,
    error,
    progress,
    exportMap,
    downloadMap,
    reset,
  };
}
