
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search, Clock } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

export const LocationPicker: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { currentLocation, setLocation, locationHistory } = useLocation();
  const { toast } = useToast();

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get location name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      
      setLocation({
        lat: latitude,
        lng: longitude,
        name: data.display_name || 'Current Location',
        address: data.display_name,
        source: 'gps',
        timestamp: new Date()
      });

      toast({
        title: "Location detected",
        description: "Using your current GPS location for analysis",
      });
    } catch (error) {
      toast({
        title: "Location unavailable",
        description: "Unable to get your current location. Please search for a location instead.",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        setLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          name: result.display_name,
          address: result.display_name,
          boundingBox: result.boundingbox ? result.boundingbox.map(Number) : undefined,
          source: 'search',
          timestamp: new Date()
        });

        toast({
          title: "Location found",
          description: `Analysis location set to ${result.display_name}`,
        });
        setSearchQuery('');
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different search term",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search for location",
        variant: "destructive"
      });
    }
  };

  const useHistoryLocation = (location: any) => {
    setLocation({
      ...location,
      source: 'manual',
      timestamp: new Date()
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Analysis Location</h3>
        </div>

        {currentLocation && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Current Location</span>
            </div>
            <p className="text-sm text-green-700 mt-1">{currentLocation.name}</p>
            <p className="text-xs text-green-600">
              {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)} • 
              {currentLocation.source} • {currentLocation.timestamp.toLocaleTimeString()}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <Button onClick={searchLocation} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            onClick={getCurrentLocation} 
            disabled={isGettingLocation}
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Getting location...' : 'Use Current GPS Location'}
          </Button>
        </div>

        {locationHistory.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Recent Locations</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {locationHistory.slice(0, 3).map((location, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => useHistoryLocation(location)}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium truncate max-w-full">
                      {location.name.split(',')[0]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {location.source} • {location.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
