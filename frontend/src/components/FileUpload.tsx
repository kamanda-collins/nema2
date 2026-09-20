import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileType, Loader2, Download, Link, Database, MapPin, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onShapefileLoad: (geoJSON: any, filename: string) => void;
}

export const FileUpload = ({ onShapefileLoad }: FileUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [csvData, setCsvData] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [locationName, setLocationName] = useState('');
  const [gisEnabled, setGisEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  // Watch for current location if GIS is enabled
  useEffect(() => {
    if (!gisEnabled) {
      setCurrentLocation(null);
      return;
    }

    const watchId = navigator.geolocation?.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: "Could not retrieve current location",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation?.clearWatch(watchId);
      }
    };
  }, [gisEnabled, toast]);

  const handleGISToggle = () => {
    const newState = !gisEnabled;
    setGisEnabled(newState);
    
    if (newState) {
      // Check if geolocation is available
      if ('geolocation' in navigator) {
        toast({
          title: "GPS Mode Enabled",
          description: "Phone GPS integration is now active",
        });
      } else {
        toast({
          title: "GPS Not Available",
          description: "GPS functionality is not supported on this device",
          variant: "destructive",
        });
        setGisEnabled(false);
        return;
      }
    } else {
      toast({
        title: "GPS Mode Disabled",
        description: "Phone GPS integration is now inactive",
      });
    }
  };

  const handleAddCurrentLocation = () => {
    if (!currentLocation) return;

    const geoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          name: 'Current Location',
          timestamp: new Date().toISOString(),
        },
        geometry: {
          type: 'Point',
          coordinates: [currentLocation.lng, currentLocation.lat]
        }
      }]
    };

    onShapefileLoad(geoJSON, 'GPS Location');
    
    toast({
      title: "Location Added",
      description: "Current GPS location has been added to the map",
    });
  };

  const handleAddManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90) {
      toast({
        title: "Invalid Latitude",
        description: "Latitude must be between -90 and 90",
        variant: "destructive",
      });
      return;
    }

    if (lng < -180 || lng > 180) {
      toast({
        title: "Invalid Longitude", 
        description: "Longitude must be between -180 and 180",
        variant: "destructive",
      });
      return;
    }

    const geoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          name: locationName || 'Manual Location',
          timestamp: new Date().toISOString(),
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }]
    };

    onShapefileLoad(geoJSON, 'Manual Coordinates');
    
    toast({
      title: "Location Added",
      description: "Manual coordinates have been added to the map",
    });

    // Clear the inputs
    setManualLat('');
    setManualLng('');
    setLocationName('');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    // Check supported file types
    const supportedTypes = ['geojson', 'json', 'kml', 'gpx', 'csv'];
    if (!supportedTypes.includes(fileExtension || '')) {
      toast({
        title: "Unsupported File",
        description: `Please upload a supported file: ${supportedTypes.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const text = await file.text();
      let geoJSON;

      switch (fileExtension) {
        case 'geojson':
        case 'json':
          geoJSON = JSON.parse(text);
          break;
        case 'kml':
          geoJSON = await convertKmlToGeoJSON(text);
          break;
        case 'gpx':
          geoJSON = await convertGpxToGeoJSON(text);
          break;
        case 'csv':
          geoJSON = await convertCsvToGeoJSON(text);
          break;
        default:
          throw new Error('Unsupported file type');
      }
      
      // Basic validation
      if (!geoJSON.type || (geoJSON.type !== 'FeatureCollection' && geoJSON.type !== 'Feature')) {
        throw new Error('Invalid GeoJSON format');
      }

      onShapefileLoad(geoJSON, file.name);
      
      toast({
        title: "File Loaded Successfully",
        description: `${file.name} has been imported to the map`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load the file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleApiImport = async () => {
    if (!apiUrl.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      
      // Try to detect if it's already GeoJSON
      if (data.type && (data.type === 'FeatureCollection' || data.type === 'Feature')) {
        onShapefileLoad(data, 'API Import');
      } else {
        // Try to convert common API formats
        const converted = await convertApiDataToGeoJSON(data);
        onShapefileLoad(converted, 'API Import');
      }
      
      toast({
        title: "API Data Imported",
        description: "Data successfully imported from API",
      });
    } catch (error) {
      console.error('API import error:', error);
      toast({
        title: "API Import Failed",
        description: "Failed to import data from API. Check the URL and format.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvImport = () => {
    if (!csvData.trim()) return;

    setIsLoading(true);
    try {
      const geoJSON = convertCsvToGeoJSON(csvData);
      onShapefileLoad(geoJSON, 'CSV Import');
      
      toast({
        title: "CSV Data Imported",
        description: "CSV data successfully converted to map features",
      });
      setCsvData('');
    } catch (error) {
      console.error('CSV import error:', error);
      toast({
        title: "CSV Import Failed",
        description: "Failed to parse CSV. Ensure it has lat/lng columns.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for format conversion
  const convertKmlToGeoJSON = async (kmlText: string) => {
    // Basic KML to GeoJSON conversion
    // In a real app, you'd use a library like @tmcw/togeojson
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    const placemarks = kmlDoc.getElementsByTagName('Placemark');
    const features = [];
    
    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const name = placemark.getElementsByTagName('name')[0]?.textContent || `Feature ${i + 1}`;
      const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;
      
      if (coordinates) {
        const coords = coordinates.trim().split(',').map(Number);
        features.push({
          type: 'Feature',
          properties: { name },
          geometry: {
            type: 'Point',
            coordinates: [coords[0], coords[1]]
          }
        });
      }
    }
    
    return {
      type: 'FeatureCollection',
      features
    };
  };

  const convertGpxToGeoJSON = async (gpxText: string) => {
    // Basic GPX to GeoJSON conversion
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
    
    const waypoints = gpxDoc.getElementsByTagName('wpt');
    const features = [];
    
    for (let i = 0; i < waypoints.length; i++) {
      const wpt = waypoints[i];
      const lat = parseFloat(wpt.getAttribute('lat') || '0');
      const lng = parseFloat(wpt.getAttribute('lon') || '0');
      const name = wpt.getElementsByTagName('name')[0]?.textContent || `Waypoint ${i + 1}`;
      
      features.push({
        type: 'Feature',
        properties: { name },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      });
    }
    
    return {
      type: 'FeatureCollection',
      features
    };
  };

  const convertCsvToGeoJSON = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have header and data rows');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const latIndex = headers.findIndex(h => h.includes('lat'));
    const lngIndex = headers.findIndex(h => h.includes('lng') || h.includes('lon'));
    
    if (latIndex === -1 || lngIndex === -1) {
      throw new Error('CSV must contain latitude and longitude columns');
    }
    
    const features = lines.slice(1).map((line, index) => {
      const values = line.split(',');
      const lat = parseFloat(values[latIndex]);
      const lng = parseFloat(values[lngIndex]);
      
      if (isNaN(lat) || isNaN(lng)) return null;
      
      const properties: any = {};
      headers.forEach((header, i) => {
        if (i !== latIndex && i !== lngIndex) {
          properties[header] = values[i]?.trim();
        }
      });
      
      return {
        type: 'Feature',
        properties,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      };
    }).filter(Boolean);
    
    return {
      type: 'FeatureCollection',
      features
    };
  };

  const convertApiDataToGeoJSON = async (data: any) => {
    // Handle common API response formats
    if (Array.isArray(data)) {
      const features = data.map((item, index) => {
        // Try to find coordinate fields
        const lat = item.latitude || item.lat || item.y;
        const lng = item.longitude || item.lng || item.lon || item.x;
        
        if (lat && lng) {
          return {
            type: 'Feature',
            properties: { ...item, id: index },
            geometry: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)]
            }
          };
        }
        return null;
      }).filter(Boolean);
      
      return {
        type: 'FeatureCollection',
        features
      };
    }
    
    throw new Error('Unsupported API data format');
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileType className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm">Import GIS Data</span>
        </div>
        
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="file">File</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="coordinates">Coordinates</TabsTrigger>
            <TabsTrigger value="gps">GPS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-2">
            <div className="relative">
              <Input
                type="file"
                accept=".geojson,.json,.kml,.gpx,.csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {isLoading && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supports: GeoJSON, KML, GPX, CSV files
            </p>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter API URL..."
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button
                onClick={handleApiImport}
                disabled={isLoading || !apiUrl.trim()}
                size="sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Import from REST APIs, GeoJSON URLs, or data services
            </p>
          </TabsContent>
          
          <TabsContent value="csv" className="space-y-2">
            <textarea
              placeholder="Paste CSV data here (must include lat/lng columns)..."
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="w-full h-20 p-2 border rounded text-xs"
              disabled={isLoading}
            />
            <Button
              onClick={handleCsvImport}
              disabled={isLoading || !csvData.trim()}
              size="sm"
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Import CSV
            </Button>
          </TabsContent>

          <TabsContent value="coordinates" className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Location name (optional)"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
              <Input
                placeholder="Latitude (e.g., 40.7128)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                type="number"
                step="any"
              />
              <Input
                placeholder="Longitude (e.g., -74.0060)"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                type="number"
                step="any"
              />
              <Button
                onClick={handleAddManualLocation}
                disabled={!manualLat.trim() || !manualLng.trim()}
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Add to Map
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Enter latitude and longitude coordinates manually to add a point to the map
            </p>
          </TabsContent>
          
          <TabsContent value="gps" className="space-y-3">
            <div className="space-y-2">
              <Button
                onClick={handleGISToggle}
                variant={gisEnabled ? "default" : "outline"}
                size="sm"
                className="w-full flex items-center gap-2"
              >
                {gisEnabled ? <Smartphone className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                {gisEnabled ? "GPS Active" : "Enable GPS"}
              </Button>
              
              {gisEnabled && (
                <div className="space-y-2 p-3 bg-gray-50 rounded">
                  {currentLocation ? (
                    <div className="space-y-2">
                      <div className="text-xs">
                        <strong>Current Location:</strong>
                      </div>
                      <div className="text-xs text-gray-600">
                        Lat: {currentLocation.lat.toFixed(6)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Lng: {currentLocation.lng.toFixed(6)}
                      </div>
                      <Button
                        onClick={handleAddCurrentLocation}
                        size="sm"
                        className="w-full"
                      >
                        Add to Map
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-2">
                      Waiting for GPS signal...
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Use your device's GPS to add current location to the map
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
