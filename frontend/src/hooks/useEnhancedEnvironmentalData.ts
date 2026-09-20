/**
 * Enhanced Environmental Data Hook
 * 
 * Replaces the original useEnvironmentalData with real-time capabilities,
 * multiple data source integration, and advanced analytics features.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { realDataService, type RealEnvironmentalData } from '@/services/realDataService';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedEnvironmentalDataHook {
  data: RealEnvironmentalData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  dataQuality: {
    overallScore: number;
    completeness: number;
    accuracy: number;
    timeliness: number;
    sources: string[];
  } | null;
  refreshData: () => Promise<void>;
  enableRealTimeUpdates: boolean;
  setEnableRealTimeUpdates: (enabled: boolean) => void;
}

export const useEnhancedEnvironmentalData = (): EnhancedEnvironmentalDataHook => {
  const [data, setData] = useState<RealEnvironmentalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(true);
  
  const { currentLocation } = useLocation();
  const { toast } = useToast();

  const fetchData = useCallback(async (lat: number, lng: number, showToast: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🌍 Fetching enhanced environmental data for ${lat}, ${lng}`);
      
      const environmentalData = await realDataService.getComprehensiveEnvironmentalData(
        lat, 
        lng, 
        true // Include historical data
      );
      
      setData(environmentalData);
      setLastUpdated(new Date());
      
      if (showToast) {
        toast({
          title: "Environmental Data Updated",
          description: `Data refreshed for ${environmentalData.location.name}. Quality score: ${environmentalData.dataQuality.overallScore}%`,
        });
      }

      console.log('✅ Enhanced environmental data loaded:', {
        location: environmentalData.location,
        dataQuality: environmentalData.dataQuality,
        sources: environmentalData.dataQuality.sources
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch enhanced environmental data';
      setError(errorMessage);
      
      console.error('❌ Enhanced environmental data fetch failed:', error);
      
      if (showToast) {
        toast({
          title: "Data Fetch Failed",
          description: "Using cached or fallback data. Some features may be limited.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial data fetch when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchData(currentLocation.lat, currentLocation.lng, true);
    }
  }, [currentLocation, fetchData]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates || !currentLocation) return;

    const interval = setInterval(() => {
      fetchData(currentLocation.lat, currentLocation.lng, false);
    }, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, currentLocation, fetchData]);

  const refreshData = useCallback(async () => {
    if (currentLocation) {
      await fetchData(currentLocation.lat, currentLocation.lng, true);
    }
  }, [currentLocation, fetchData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    dataQuality: data?.dataQuality || null,
    refreshData,
    enableRealTimeUpdates,
    setEnableRealTimeUpdates
  };
};