
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface AdvancedRenderOptionsProps {
  mapType: 'satellite' | 'terrain' | 'road';
  setMapType: (v: 'satellite' | 'terrain' | 'road') => void;
  outputFormat: 'png' | 'pdf' | 'svg';
  setOutputFormat: (v: 'png' | 'pdf' | 'svg') => void;
  colorScheme: 'default' | 'professional' | 'environmental';
  setColorScheme: (v: 'default' | 'professional' | 'environmental') => void;
}

export const AdvancedRenderOptions: React.FC<AdvancedRenderOptionsProps> = ({
  mapType,
  setMapType,
  outputFormat,
  setOutputFormat,
  colorScheme,
  setColorScheme,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="text-sm font-medium mb-2 block">Map Type</label>
      <Select value={mapType} onValueChange={setMapType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="satellite">Satellite</SelectItem>
          <SelectItem value="terrain">Terrain</SelectItem>
          <SelectItem value="road">Road Map</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="text-sm font-medium mb-2 block">Output Format</label>
      <Select value={outputFormat} onValueChange={setOutputFormat}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="png">PNG Image</SelectItem>
          <SelectItem value="pdf">PDF Document</SelectItem>
          <SelectItem value="svg">SVG Vector</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="text-sm font-medium mb-2 block">Color Scheme</label>
      <Select value={colorScheme} onValueChange={setColorScheme}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="professional">Professional</SelectItem>
          <SelectItem value="environmental">Environmental</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);
