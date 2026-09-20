
import React from 'react';

interface MapLayersProps {
  map: any;
  currentMapLayer: string;
}

export const MapLayersManager: React.FC<MapLayersProps> = ({ map, currentMapLayer }) => {
  const currentTileLayerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!map) return;
    
    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }
    
    const newLayer = window.L.tileLayer(currentMapLayer, {
      attribution: '© OpenStreetMap contributors'
    });
    
    currentTileLayerRef.current = newLayer;
    newLayer.addTo(map);
  }, [map, currentMapLayer]);

  return null;
};
