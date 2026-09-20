
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, NavigationOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GPSToggleProps {
  map: any;
}

export const GPSToggle: React.FC<GPSToggleProps> = ({ map }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGPSToggle = () => {
    if (!map) return;

    if (isTracking) {
      // Turn off GPS tracking
      setIsTracking(false);
      toast({
        title: "GPS Disabled",
        description: "Location tracking is now off",
      });
      return;
    }

    // Turn on GPS tracking
    setIsLoading(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 15);
          setIsTracking(true);
          setIsLoading(false);
          
          toast({
            title: "GPS Enabled",
            description: "Map centered on your location",
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
          toast({
            title: "GPS Error",
            description: "Could not get your location. Please check permissions.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      setIsLoading(false);
      toast({
        title: "GPS Not Available",
        description: "GPS is not supported on this device",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
      <Button
        onClick={handleGPSToggle}
        variant={isTracking ? "default" : "outline"}
        size="sm"
        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-md"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isTracking ? (
          <Navigation className="h-4 w-4" />
        ) : (
          <NavigationOff className="h-4 w-4" />
        )}
        {isLoading ? "Locating..." : isTracking ? "Location Active" : "Use Current Location"}
      </Button>
    </div>
  );
};
