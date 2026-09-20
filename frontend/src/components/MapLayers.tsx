
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Satellite, Mountain, Navigation } from 'lucide-react';

interface MapLayersProps {
  onLayerChange: (layerUrl: string, layerName: string) => void;
  currentLayer: string;
}

export const MapLayers = ({ onLayerChange, currentLayer }: MapLayersProps) => {
  const mapLayers = [
    {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      icon: Map,
      attribution: '© OpenStreetMap contributors'
    },
    {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      icon: Satellite,
      attribution: '© Esri'
    },
    {
      name: 'Terrain',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      icon: Mountain,
      attribution: '© OpenTopoMap'
    },
    {
      name: 'Streets',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      icon: Navigation,
      attribution: '© CARTO'
    }
  ];

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Map className="h-4 w-4 text-blue-500" />
          Map Layers
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {mapLayers.map((layer) => {
            const Icon = layer.icon;
            const isActive = currentLayer === layer.url;
            
            return (
              <Button
                key={layer.name}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onLayerChange(layer.url, layer.name)}
                className="flex items-center gap-2 text-xs"
              >
                <Icon className="h-3 w-3" />
                {layer.name}
              </Button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
