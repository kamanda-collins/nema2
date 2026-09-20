
import React from 'react';

declare global {
  interface Window {
    L: any;
  }
}

interface MapDrawingControlsProps {
  map: any;
  onShapeCreated: (geoJSON: any) => void;
}

export const MapDrawingControls: React.FC<MapDrawingControlsProps> = ({ map, onShapeCreated }) => {
  const drawnItemsRef = React.useRef<any>(null);
  const drawControlRef = React.useRef<any>(null);
  const isInitializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!map || !window.L) {
      return;
    }

    if (isInitializedRef.current) {
      console.log('MapDrawingControls: Already initialized, skipping');
      return;
    }

    console.log('MapDrawingControls: Initializing compact drawing controls');

    try {
      drawnItemsRef.current = new window.L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);

      // Compact toolbar with essential tools only
      drawControlRef.current = new window.L.Control.Draw({
        position: 'topleft',
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true,
          edit: true
        },
        draw: {
          polygon: {
            shapeOptions: {
              color: '#3b82f6',
              fillColor: '#93c5fd',
              fillOpacity: 0.3,
              weight: 2
            }
          },
          rectangle: {
            shapeOptions: {
              color: '#3b82f6',
              fillColor: '#93c5fd',
              fillOpacity: 0.3,
              weight: 2
            }
          },
          // Remove these tools to make toolbar shorter
          circle: false,
          marker: false,
          polyline: false,
          circlemarker: false
        }
      });

      map.addControl(drawControlRef.current);

      // Event handlers
      const handleCreated = (event: any) => {
        const layer = event.layer;
        drawnItemsRef.current.addLayer(layer);
        
        // Create properly formatted GeoJSON
        const geoJSON = {
          type: "Feature",
          properties: {
            created_at: new Date().toISOString(),
            tool_used: event.layerType
          },
          geometry: layer.toGeoJSON().geometry
        };
        
        onShapeCreated(geoJSON);
        console.log('Shape created:', geoJSON);
      };

      const handleEdited = (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
          const geoJSON = {
            type: "Feature",
            properties: {
              updated_at: new Date().toISOString()
            },
            geometry: layer.toGeoJSON().geometry
          };
          onShapeCreated(geoJSON);
        });
      };

      const handleDeleted = (event: any) => {
        console.log('Shapes deleted');
        onShapeCreated(null);
      };

      map.on(window.L.Draw.Event.CREATED, handleCreated);
      map.on(window.L.Draw.Event.EDITED, handleEdited);
      map.on(window.L.Draw.Event.DELETED, handleDeleted);

      isInitializedRef.current = true;
      console.log('MapDrawingControls: Compact initialization complete');

    } catch (error) {
      console.error('MapDrawingControls: Error during initialization:', error);
    }

    return () => {
      if (map && drawControlRef.current) {
        try {
          map.removeControl(drawControlRef.current);
          if (drawnItemsRef.current) {
            map.removeLayer(drawnItemsRef.current);
          }
          console.log('MapDrawingControls: Cleanup completed');
        } catch (error) {
          console.error('MapDrawingControls: Error during cleanup:', error);
        }
      }
      isInitializedRef.current = false;
    };
  }, [map]);

  return null;
};
