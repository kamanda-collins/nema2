
import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Download, Layers } from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

interface ChangeDetectionMapProps {
  period: string;
  dataset: string;
}

export const ChangeDetectionMap: React.FC<ChangeDetectionMapProps> = ({ period, dataset }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState('2023-06');
  const [layerType, setLayerType] = React.useState('change-overlay');
  const [beforeAfterMode, setBeforeAfterMode] = React.useState('split');

  // Mock change detection data
  const changeData = {
    '2020-01': { vegetation: 0.65, urban: 0.25, water: 0.10 },
    '2020-06': { vegetation: 0.72, urban: 0.23, water: 0.05 },
    '2021-01': { vegetation: 0.58, urban: 0.32, water: 0.10 },
    '2021-06': { vegetation: 0.74, urban: 0.21, water: 0.05 },
    '2022-01': { vegetation: 0.71, urban: 0.24, water: 0.05 },
    '2022-06': { vegetation: 0.76, urban: 0.19, water: 0.05 },
    '2023-01': { vegetation: 0.73, urban: 0.22, water: 0.05 },
    '2023-06': { vegetation: 0.78, urban: 0.17, water: 0.05 }
  };

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Initialize map
    mapInstanceRef.current = window.L.map(mapRef.current, {
      center: [40.7128, -74.0060],
      zoom: 12,
      zoomControl: true
    });

    // Add base layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Add mock change detection overlays
    addChangeDetectionLayers();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const addChangeDetectionLayers = () => {
    if (!mapInstanceRef.current) return;

    // Mock vegetation change areas (green for gain, red for loss)
    const vegetationGain = window.L.polygon([
      [40.720, -74.000],
      [40.725, -74.000],
      [40.725, -73.995],
      [40.720, -73.995]
    ], {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.4,
      weight: 2
    }).addTo(mapInstanceRef.current);

    const vegetationLoss = window.L.polygon([
      [40.715, -74.010],
      [40.720, -74.010],
      [40.720, -74.005],
      [40.715, -74.005]
    ], {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.4,
      weight: 2
    }).addTo(mapInstanceRef.current);

    const urbanExpansion = window.L.polygon([
      [40.710, -74.015],
      [40.715, -74.015],
      [40.715, -74.010],
      [40.710, -74.010]
    ], {
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.4,
      weight: 2
    }).addTo(mapInstanceRef.current);

    // Add popups with change information
    vegetationGain.bindPopup('<b>Vegetation Gain</b><br/>+12.3% increase<br/>Area: 2.4 km²');
    vegetationLoss.bindPopup('<b>Vegetation Loss</b><br/>-18.7% decrease<br/>Area: 1.8 km²');
    urbanExpansion.bindPopup('<b>Urban Expansion</b><br/>New development<br/>Area: 3.2 km²');
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement time-series playback
  };

  const resetAnalysis = () => {
    setCurrentDate('2020-01');
    setIsPlaying(false);
    // TODO: Reset map to initial state
  };

  const exportChangeData = () => {
    // TODO: Implement export functionality
    console.log('Exporting change detection data...');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={togglePlayback}
              variant={isPlaying ? "default" : "outline"}
              size="sm"
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'} Time Series
            </Button>
            <Button onClick={resetAnalysis} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={layerType} onValueChange={setLayerType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="change-overlay">Change Overlay</SelectItem>
                <SelectItem value="vegetation">Vegetation Index</SelectItem>
                <SelectItem value="urban">Urban Coverage</SelectItem>
                <SelectItem value="surface-temp">Surface Temperature</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={beforeAfterMode} onValueChange={setBeforeAfterMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="split">Split View</SelectItem>
                <SelectItem value="swipe">Swipe View</SelectItem>
                <SelectItem value="overlay">Overlay</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportChangeData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Map Container */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Change Detection Visualization</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Current: {currentDate}</Badge>
            <Badge variant="secondary">{layerType}</Badge>
          </div>
        </div>
        
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg border border-gray-200"
          />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Layers className="h-4 w-4" />
              Legend
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Vegetation Gain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Vegetation Loss</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Urban Expansion</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Change Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">+15.2%</div>
            <div className="text-sm text-gray-600">Vegetation Recovery</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">-8.7%</div>
            <div className="text-sm text-gray-600">Forest Loss</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">+12.4%</div>
            <div className="text-sm text-gray-600">Urban Growth</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
