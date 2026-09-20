
import React, { useRef, useEffect } from 'react';
import { MapDrawingControls } from './MapDrawingControls';
import { MapLayersManager } from './MapLayers';
import { SearchLocationHandler } from './SearchLocationHandler';
import { GPSToggle } from './GPSToggle';

declare global {
  interface Window {
    L: any;
  }
}

interface MapContainerProps {
  onShapeCreated?: (geoJSON: any) => void;
  features?: any[];
  currentMapLayer?: string;
  onLayerChange?: (layerUrl: string, layerName: string) => void;
  searchLocation?: { lat: number; lng: number; name: string; boundingBox?: number[] };
}

export const MapContainer: React.FC<MapContainerProps> = ({
  onShapeCreated = () => {},
  features = [],
  currentMapLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  onLayerChange = () => {},
  searchLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    console.log('MapContainer: Starting initialization');

    if (!mapRef.current || !window.L || isInitializedRef.current) {
      if (isInitializedRef.current) {
        console.log('MapContainer: Already initialized, skipping');
      }
      return;
    }

    // Clear any existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Initialize map
      const map = window.L.map(mapRef.current, {
        center: [40.7128, -74.0060],
        zoom: 10,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer
      window.L.tileLayer(currentMapLayer, {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Force map to invalidate size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      mapInstanceRef.current = map;
      isInitializedRef.current = true;
      console.log('MapContainer: Map initialized successfully');

    } catch (error) {
      console.error('MapContainer: Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []); // Remove currentMapLayer dependency to prevent re-initialization

  // Handle layer changes separately
  useEffect(() => {
    if (mapInstanceRef.current && currentMapLayer) {
      // Remove existing tile layers
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof window.L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      
      // Add new tile layer
      window.L.tileLayer(currentMapLayer, {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }
  }, [currentMapLayer]);

  // Display features on map
  useEffect(() => {
    if (!mapInstanceRef.current || !features || !Array.isArray(features) || features.length === 0) {
      return;
    }

    features.forEach((feature, index) => {
      try {
        const geoJSON = JSON.parse(feature.geo);
        const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const color = colors[index % colors.length];
        
        const layer = window.L.geoJSON(geoJSON, {
          style: {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 2
          }
        });
        
        layer.bindPopup(`
          <div>
            <strong>${feature.name}</strong><br>
            ${feature.description || ''}<br>
            <small>Created: ${new Date(feature.created_at).toLocaleDateString()}</small>
          </div>
        `);
        layer.addTo(mapInstanceRef.current);
      } catch (e) {
        console.error('Error parsing GeoJSON:', e);
      }
    });
  }, [features]);

  return (
    <div className="w-full h-full min-h-[500px] relative">
      <style>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          z-index: 1;
          background: #e5e7eb;
        }
        .leaflet-draw-toolbar {
          z-index: 900 !important;
        }
        .leaflet-draw-toolbar a {
          cursor: pointer !important;
        }
        .leaflet-control-container {
          z-index: 800;
        }
      `}</style>
      
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
        style={{ 
          minHeight: '500px',
          backgroundColor: '#e5e7eb'
        }}
      />
      
      <GPSToggle map={mapInstanceRef.current} />
      
      <MapDrawingControls 
        map={mapInstanceRef.current} 
        onShapeCreated={onShapeCreated} 
      />
      <MapLayersManager 
        map={mapInstanceRef.current} 
        currentMapLayer={currentMapLayer} 
      />
      <SearchLocationHandler 
        map={mapInstanceRef.current} 
        searchLocation={searchLocation} 
      />
    </div>
  );
};
