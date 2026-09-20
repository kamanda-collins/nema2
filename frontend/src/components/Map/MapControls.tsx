
import React from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    L: any;
  }
}

interface MapControlsProps {
  map: any;
  onShapeCreated: (geoJSON: any) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ map, onShapeCreated }) => {
  const drawnItemsRef = React.useRef<any>(null);
  const scaleControlRef = React.useRef<any>(null);
  const drawControlRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!map) return;

    // Initialize drawn items layer group only once
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new window.L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);
    }

    // Fetch and render saved shapes from Supabase
    const fetchAndRenderShapes = async () => {
      const { data, error } = await supabase.from('features').select('*');

      if (error) {
        console.error('❌ Error fetching features:', error.message);
        return;
      }

      console.log('✅ Fetched features:', data);

      data.forEach((feature) => {
        try {
          const geoLayer = window.L.geoJSON(JSON.parse(feature.geo as string));
          geoLayer.addTo(drawnItemsRef.current);
        } catch (err) {
          console.error('❌ Error rendering shape:', err);
        }
      });
    };

    fetchAndRenderShapes();

    // Remove existing draw control if it exists
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }

    // Configure Leaflet draw controls with mobile-optimized settings
    drawControlRef.current = new window.L.Control.Draw({
      position: 'topright',
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: true,
        edit: true
      },
      draw: {
        polygon: {
          allowIntersection: true,
          showLength: true,
          showArea: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Draw any shape you want!</strong>'
          },
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3,
            weight: 3 // Slightly thicker for mobile
          },
          metric: true,
          feet: false,
          repeatMode: false,
          guideLayers: [],
          maxPoints: 0
        },
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3,
            weight: 3
          }
        },
        circle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3,
            weight: 3
          }
        },
        marker: {
          icon: new window.L.Icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [41, 41]
          })
        },
        polyline: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 4 // Thicker for mobile visibility
          }
        },
        circlemarker: false
      }
    });

    map.addControl(drawControlRef.current);

    // Mobile-optimized drawing cursors and feedback
    map.on('draw:drawstart', () => {
      map.getContainer().style.cursor = 'crosshair';
      map.getContainer().classList.add('drawing-active');
      // Disable map dragging during drawing for better mobile experience
      map.dragging.disable();
    });

    map.on('draw:drawstop', () => {
      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('drawing-active');
      // Re-enable map dragging
      map.dragging.enable();
    });

    // When a new shape is created
    map.on(window.L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItemsRef.current.addLayer(layer);
      const geoJSON = layer.toGeoJSON();
      onShapeCreated(geoJSON);

      console.log('✅ Shape created and added to map');
      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('drawing-active');
      map.dragging.enable();
    });

    // On shape edit
    map.on(window.L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geoJSON = layer.toGeoJSON();
        onShapeCreated(geoJSON);
      });
    });

    // On shape delete
    map.on(window.L.Draw.Event.DELETED, (event: any) => {
      console.log('Shapes deleted by user');
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        drawnItemsRef.current.removeLayer(layer);
      });
      onShapeCreated(null);
    });

    // Add scale bar with mobile-optimized positioning
    if (!scaleControlRef.current) {
      scaleControlRef.current = window.L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: true,
        maxWidth: 150 // Smaller for mobile
      });
      scaleControlRef.current.addTo(map);
    }

    // Cleanup
    return () => {
      if (map && drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        map.getContainer().style.cursor = '';
        map.getContainer().classList.remove('drawing-active');
        map.dragging.enable();
      }
    };
  }, [map, onShapeCreated]);

  return null;
};
