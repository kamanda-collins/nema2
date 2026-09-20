import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers, Wind, Droplets, TreePine, Navigation } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useEnvironmentalData } from '@/hooks/useEnvironmentalData';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    L: any;
  }
}

interface MonitoringPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'air' | 'water' | 'vegetation' | 'general';
  createdAt: Date;
}

export const InteractiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const overlayLayerRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const [showOverlays, setShowOverlays] = useState(false);
  const [monitoringPoints, setMonitoringPoints] = useState<MonitoringPoint[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const { currentLocation, setLocation } = useLocation();
  const { data } = useEnvironmentalData();
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Create map instance
      const map = window.L.map(mapRef.current, {
        center: [40.7128, -74.0060],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: true // Better performance to reduce flickering
      });

      // Add base tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        keepBuffer: 2 // Keep tiles in buffer to reduce flickering
      }).addTo(map);

      // Create layers for markers and overlays
      markersLayerRef.current = window.L.layerGroup().addTo(map);
      overlayLayerRef.current = window.L.layerGroup().addTo(map);

      // Set cursor to crosshair to indicate clickable map
      map.getContainer().style.cursor = 'crosshair';

      // Add click handler for location selection
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        
        setIsLoadingLocation(true);
        // Show loading cursor
        map.getContainer().style.cursor = 'wait';
        
        // Reverse geocode to get location name
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(response => response.json())
          .then(data => {
            setLocation({
              lat,
              lng,
              name: data.display_name || 'Selected Location',
              address: data.display_name,
              source: 'map',
              timestamp: new Date()
            });

            toast({
              title: "Location Selected",
              description: `Analysis location set to ${data.display_name || 'selected coordinates'}`,
            });

            // Reset cursor and loading state
            map.getContainer().style.cursor = 'crosshair';
            setIsLoadingLocation(false);
          })
          .catch(() => {
            setLocation({
              lat,
              lng,
              name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              source: 'map',
              timestamp: new Date()
            });
            
            // Reset cursor and loading state
            map.getContainer().style.cursor = 'crosshair';
            setIsLoadingLocation(false);
          });
      });

      // Add hover effects for better UX
      map.on('mouseover', () => {
        if (map.getContainer().style.cursor !== 'wait') {
          map.getContainer().style.cursor = 'crosshair';
        }
      });

      mapInstanceRef.current = map;

      // Force map resize
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [setLocation, toast]);

  // Update current location marker with smooth animation and no flickering
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !currentLocation) return;

    // Remove existing current location marker smoothly
    if (currentLocationMarkerRef.current) {
      markersLayerRef.current.removeLayer(currentLocationMarkerRef.current);
    }

    // Create elegant Google Maps style pin marker
    const pinIcon = window.L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div class="pin-container">
          <div class="pin-body">
            <div class="pin-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
          <div class="pin-shadow"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 36],
      popupAnchor: [0, -36]
    });

    const marker = window.L.marker([currentLocation.lat, currentLocation.lng], {
      icon: pinIcon
    });

    marker.bindPopup(`
      <div style="min-width: 200px; padding: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="background: #ea4335; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <strong style="color: #333;">Selected Location</strong>
        </div>
        <div style="margin-bottom: 4px; color: #666; font-size: 14px;">${currentLocation.name}</div>
        <div style="color: #999; font-size: 12px;">${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}</div>
      </div>
    `, {
      closeButton: true,
      autoClose: false
    });

    // Add smooth hover effects
    marker.on('mouseover', function() {
      mapInstanceRef.current.getContainer().style.cursor = 'pointer';
    });

    marker.on('mouseout', function() {
      mapInstanceRef.current.getContainer().style.cursor = 'crosshair';
    });

    markersLayerRef.current.addLayer(marker);
    currentLocationMarkerRef.current = marker;

    // Smooth map transition with intelligent zoom - reduced animation to minimize flickering
    const currentZoom = mapInstanceRef.current.getZoom();
    const currentCenter = mapInstanceRef.current.getCenter();
    
    // Calculate distance to determine if we need to move significantly
    const distance = mapInstanceRef.current.distance(currentCenter, [currentLocation.lat, currentLocation.lng]);
    
    // Very gentle zoom adjustment - minimal changes to reduce flickering
    let targetZoom = currentZoom;
    if (distance > 100000) {
      // If very far away, zoom to a reasonable level
      targetZoom = Math.max(12, currentZoom);
    } else if (currentZoom < 10) {
      // If zoomed out too much, zoom in a bit
      targetZoom = 11; // Reduced from 12
    } else if (currentZoom > 16) {
      // If zoomed in too much, zoom out a bit
      targetZoom = 15; // Reduced from 14
    }

    // Smoother, shorter transition to reduce flickering
    mapInstanceRef.current.flyTo([currentLocation.lat, currentLocation.lng], targetZoom, {
      animate: true,
      duration: 0.8, // Reduced from 1.2
      easeLinearity: 0.2 // Increased from 0.1 for smoother easing
    });
  }, [currentLocation]);

  // Add monitoring points to map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    monitoringPoints.forEach(point => {
      const getPointColor = (type: string) => {
        switch (type) {
          case 'air': return '#3b82f6';
          case 'water': return '#06b6d4';
          case 'vegetation': return '#10b981';
          default: return '#6b7280';
        }
      };

      const marker = window.L.marker([point.lat, point.lng], {
        icon: window.L.divIcon({
          className: 'monitoring-point-marker',
          html: `
            <div style="background: ${getPointColor(point.type)}; color: white; border-radius: 4px; padding: 4px 8px; font-size: 10px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              ${point.name}
            </div>
          `,
          iconSize: [60, 20],
          iconAnchor: [30, 10]
        })
      });

      marker.bindPopup(`
        <div>
          <strong>${point.name}</strong><br>
          Type: ${point.type}<br>
          <small>Added: ${point.createdAt.toLocaleDateString()}</small>
        </div>
      `);

      // Add hover effect to monitoring points
      marker.on('mouseover', function() {
        mapInstanceRef.current.getContainer().style.cursor = 'pointer';
      });

      marker.on('mouseout', function() {
        mapInstanceRef.current.getContainer().style.cursor = 'crosshair';
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [monitoringPoints]);

  // Add environmental data overlays
  useEffect(() => {
    if (!mapInstanceRef.current || !overlayLayerRef.current || !showOverlays || !data) return;

    overlayLayerRef.current.clearLayers();

    if (currentLocation) {
      // Add air quality overlay circle
      const aqiColor = data.airQuality.aqi > 150 ? '#ef4444' : data.airQuality.aqi > 100 ? '#f59e0b' : '#10b981';
      const aqiCircle = window.L.circle([currentLocation.lat, currentLocation.lng], {
        color: aqiColor,
        fillColor: aqiColor,
        fillOpacity: 0.2,
        radius: 2000,
        weight: 2
      });

      aqiCircle.bindPopup(`
        <div>
          <strong>Air Quality Zone</strong><br>
          AQI: ${data.airQuality.aqi} (${data.airQuality.status})<br>
          PM2.5: ${data.airQuality.pm25} µg/m³
        </div>
      `);

      overlayLayerRef.current.addLayer(aqiCircle);
    }
  }, [showOverlays, data, currentLocation]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS not available",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
      return;
    }

    // Show loading cursor
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getContainer().style.cursor = 'wait';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          name: 'Current GPS Location',
          source: 'gps',
          timestamp: new Date()
        });

        // Reset cursor
        if (mapInstanceRef.current) {
          mapInstanceRef.current.getContainer().style.cursor = 'crosshair';
        }
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Could not get your current location",
          variant: "destructive"
        });

        // Reset cursor
        if (mapInstanceRef.current) {
          mapInstanceRef.current.getContainer().style.cursor = 'crosshair';
        }
      }
    );
  };

  const addMonitoringPoint = () => {
    if (!currentLocation) {
      toast({
        title: "No location selected",
        description: "Please select a location first",
        variant: "destructive"
      });
      return;
    }

    const newPoint: MonitoringPoint = {
      id: Date.now().toString(),
      name: `Point ${monitoringPoints.length + 1}`,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      type: 'general',
      createdAt: new Date()
    };

    setMonitoringPoints(prev => [...prev, newPoint]);
    
    toast({
      title: "Monitoring point added",
      description: `Added ${newPoint.name} at current location`,
    });
  };

  return (
    <>
      <style>{`
        .pin-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: pinDrop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .pin-body {
          background: #ea4335;
          color: white;
          border-radius: 50% 50% 50% 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(234, 67, 53, 0.4);
          border: 2px solid white;
          transition: all 0.3s ease;
          z-index: 2;
        }
        .pin-body:hover {
          transform: rotate(-45deg) scale(1.1);
          box-shadow: 0 4px 15px rgba(234, 67, 53, 0.6);
        }
        .pin-icon {
          transform: rotate(45deg);
        }
        .pin-shadow {
          position: absolute;
          bottom: -2px;
          width: 16px;
          height: 6px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          filter: blur(1px);
          animation: shadowPulse 2s ease-in-out infinite;
          z-index: 1;
        }
        @keyframes pinDrop {
          0% {
            transform: translateY(-50px) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translateY(0px) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
        }
        @keyframes shadowPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-10px) translateX(-50%);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
        }
      `}</style>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Interactive Environmental Map</h3>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOverlays(!showOverlays)}
                className="flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                {showOverlays ? 'Hide' : 'Show'} Data Overlays
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={getCurrentLocation}
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                GPS
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative">
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border border-gray-200 bg-gray-100"
              style={{ minHeight: '400px' }}
            />
            
            {/* Top-Center Map Instructions with Compact Glassmorphism */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-[1000]">
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                padding: '10px 16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                display: 'inline-block',
                textAlign: 'center',
                animation: 'fadeSlideIn 0.8s ease-out'
              }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span style={{ fontSize: '16px' }}>📍</span>
                  <span className="font-semibold text-sm text-gray-800">Click to Pin Location</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Click anywhere on the map to select a location for analysis
                </p>
                {isLoadingLocation && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600">Loading location...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 space-y-2 z-[1000]">
              <Button
                size="sm"
                onClick={addMonitoringPoint}
                disabled={!currentLocation}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-md"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Add Point
              </Button>
            </div>

            {/* Environmental Data Panel */}
            {currentLocation && data && (
              <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
                <h4 className="font-medium text-sm mb-2">Environmental Data</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Wind className="h-3 w-3 text-blue-500" />
                    <span>AQI: {data.airQuality.aqi}</span>
                    <Badge variant="outline" className="text-xs">
                      {data.airQuality.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-3 w-3 text-cyan-500" />
                    <span>Humidity: {data.weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TreePine className="h-3 w-3 text-green-500" />
                    <span>NDVI: {data.vegetation.ndvi.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Location Info */}
          {currentLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div style={{
                  background: '#ea4335',
                  color: 'white',
                  borderRadius: '50% 50% 50% 0',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-45deg)',
                  fontSize: '10px'
                }}>
                  📍
                </div>
                <span className="font-medium text-green-800">Pinned Location</span>
              </div>
              <p className="text-sm text-green-700">{currentLocation.name}</p>
              <p className="text-xs text-green-600">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </p>
            </div>
          )}

          {/* Monitoring Points Summary */}
          {monitoringPoints.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-2">Active Monitoring Points ({monitoringPoints.length})</h4>
              <div className="flex flex-wrap gap-2">
                {monitoringPoints.slice(0, 6).map(point => (
                  <Badge key={point.id} variant="outline" className="text-xs">
                    {point.name} ({point.type})
                  </Badge>
                ))}
                {monitoringPoints.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{monitoringPoints.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
