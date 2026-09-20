
import { useState, useEffect } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { environmentalDataService, RealTimeEnvironmentalData } from '@/services/environmentalDataService';
import { useToast } from '@/hooks/use-toast';

export const useEnvironmentalData = () => {
  const [data, setData] = useState<RealTimeEnvironmentalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentLocation } = useLocation();
  const { toast } = useToast();

  const fetchData = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const environmentalData = await environmentalDataService.getEnvironmentalData(lat, lng);
      setData(environmentalData);
      
      toast({
        title: "Data Updated",
        description: "Environmental data refreshed successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch environmental data';
      setError(errorMessage);
      
      toast({
        title: "Data Fetch Failed",
        description: "Using cached or fallback data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      fetchData(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation]);

  const refreshData = () => {
    if (currentLocation) {
      fetchData(currentLocation.lat, currentLocation.lng);
    }
  };

  return {
    data,
    isLoading,
    error,
    refreshData
  };
};
