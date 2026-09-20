
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/LocationContext';

interface SearchLocationHandlerProps {
  map: any;
  searchLocation?: { lat: number; lng: number; name: string; boundingBox?: number[] };
}

export const SearchLocationHandler: React.FC<SearchLocationHandlerProps> = ({ map, searchLocation }) => {
  const highlightLayerRef = React.useRef<any>(null);
  const searchMarkersRef = React.useRef<any>(null);
  const lastProcessedLocationRef = React.useRef<string>('');
  const { setLocation } = useLocation();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!map) return;

    // Initialize layers
    if (!highlightLayerRef.current) {
      highlightLayerRef.current = new window.L.FeatureGroup();
      map.addLayer(highlightLayerRef.current);
    }

    if (!searchMarkersRef.current) {
      searchMarkersRef.current = new window.L.FeatureGroup();
      map.addLayer(searchMarkersRef.current);
    }
  }, [map]);

  React.useEffect(() => {
    if (!searchLocation || !map || !highlightLayerRef.current || !searchMarkersRef.current) {
      return;
    }

    const { lat, lng, name, boundingBox } = searchLocation;
    
    // Create a unique key for this location to prevent duplicate processing
    const locationKey = `${lat}-${lng}-${name}`;
    
    // Skip if we've already processed this exact location
    if (lastProcessedLocationRef.current === locationKey) {
      return;
    }
    
    // Validate lat/lng values
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.error('SearchLocationHandler: Invalid lat/lng values', { lat, lng });
      return;
    }

    console.log('SearchLocationHandler: Processing new location', { lat, lng, name });
    
    // Update the last processed location
    lastProcessedLocationRef.current = locationKey;
    
    // Sync with location context
    setLocation({
      lat,
      lng,
      name: name || 'Unknown Location',
      address: name || 'Unknown Location',
      boundingBox,
      source: 'map',
      timestamp: new Date()
    });
    
    // Clear previous highlights and markers
    highlightLayerRef.current.clearLayers();
    searchMarkersRef.current.clearLayers();

    if (boundingBox && Array.isArray(boundingBox) && boundingBox.length === 4) {
      const [south, north, west, east] = boundingBox;
      
      // Validate bounding box values
      if ([south, north, west, east].every(val => typeof val === 'number' && !isNaN(val))) {
        const bounds = [[south, west], [north, east]];
        
        // Create temporary highlight rectangle
        const highlight = window.L.rectangle(bounds, {
          color: '#ff6b35',
          weight: 3,
          fillColor: '#ff6b35',
          fillOpacity: 0.2,
          dashArray: '10, 10'
        });
        
        highlightLayerRef.current.addLayer(highlight);
        
        // Add permanent marker that stays on top
        const permanentMarker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            className: 'search-location-marker permanent-marker',
            html: `<div class="marker-pin permanent"></div><div class="marker-label permanent">${name || 'Location'}</div>`,
            iconSize: [140, 50],
            iconAnchor: [70, 50]
          }),
          zIndexOffset: 1000
        });
        
        searchMarkersRef.current.addLayer(permanentMarker);
        
        // Fit map to bounds
        map.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: 16 
        });
      } else {
        console.error('SearchLocationHandler: Invalid bounding box values', boundingBox);
      }
    } else {
      // Create point highlight with validated coordinates
      const highlight = window.L.circle([lat, lng], {
        color: '#ff6b35',
        fillColor: '#ff6b35',
        fillOpacity: 0.3,
        radius: 1000,
        weight: 3
      });
      
      highlightLayerRef.current.addLayer(highlight);
      
      // Add permanent marker that stays on top
      const permanentMarker = window.L.marker([lat, lng], {
        icon: window.L.divIcon({
          className: 'search-location-marker permanent-marker',
          html: `<div class="marker-pin permanent"></div><div class="marker-label permanent">${name || 'Location'}</div>`,
          iconSize: [140, 50],
          iconAnchor: [70, 50]
        }),
        zIndexOffset: 1000
      });
      
      searchMarkersRef.current.addLayer(permanentMarker);
      
      // Center map on location
      map.setView([lat, lng], 14, {
        animate: true,
        duration: 1
      });
    }

    toast({
      title: "Location Found",
      description: `Centered map on ${name || 'selected location'}`,
    });

    // Remove only the highlight (not the marker) after 4 seconds
    setTimeout(() => {
      if (highlightLayerRef.current) {
        highlightLayerRef.current.clearLayers();
      }
    }, 4000);

  }, [searchLocation, map, toast, setLocation]);

  return null;
};
