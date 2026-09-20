
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Zap, Upload, FileText, Download } from 'lucide-react';
import { HistoricalTrends } from './HistoricalTrends';
import { SpectralAnalysis } from './SpectralAnalysis';
import { DataUploader } from './DataUploader';
import { ChangeDetection } from './ChangeDetection';

export const TimeSeriesDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDataset, setSelectedDataset] = useState('landsat');

  return (
    <div className="space-y-6 p-4">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Time Series Analysis & Spectral Exploration</h2>
          <p className="text-gray-600">Advanced temporal analysis, change detection, and mineral identification</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="5years">5 Years</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDataset} onValueChange={setSelectedDataset}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Data Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landsat">Landsat 8/9</SelectItem>
              <SelectItem value="sentinel">Sentinel-2</SelectItem>
              <SelectItem value="modis">MODIS</SelectItem>
              <SelectItem value="custom">Custom Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide gap-0 sm:grid sm:w-full sm:grid-cols-4">
          <TabsTrigger value="trends" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Trends</TabsTrigger>
          <TabsTrigger value="spectral" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Spectral</TabsTrigger>
          <TabsTrigger value="upload" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Upload</TabsTrigger>
          <TabsTrigger value="detection" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <HistoricalTrends period={selectedPeriod} dataset={selectedDataset} />
        </TabsContent>

        <TabsContent value="spectral" className="space-y-6">
          <SpectralAnalysis dataset={selectedDataset} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <DataUploader onDataUploaded={(data) => console.log('Data uploaded:', data)} />
        </TabsContent>

        <TabsContent value="detection" className="space-y-6">
          <ChangeDetection period={selectedPeriod} dataset={selectedDataset} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
