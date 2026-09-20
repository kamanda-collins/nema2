import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChangeDetectionMap } from './ChangeDetectionMap';
import { GeospatialProcessor } from '../Backend/GeospatialProcessor';
import { AlertTriangle, Eye, Download } from 'lucide-react';

interface ChangeDetectionProps {
  period: string;
  dataset: string;
}

export const ChangeDetection: React.FC<ChangeDetectionProps> = ({ period, dataset }) => {
  const [detectionType, setDetectionType] = useState('vegetation');
  const [sensitivity, setSensitivity] = useState('medium');
  const [changeThreshold, setChangeThreshold] = useState('10');

  // Mock detected changes
  const detectedChanges = [
    {
      id: 1,
      type: 'Deforestation',
      location: '40.7589°N, 73.9851°W',
      date: '2023-06-15',
      area: 12.5,
      confidence: 92,
      severity: 'high'
    },
    {
      id: 2,
      type: 'Urban Development',
      location: '40.7612°N, 73.9776°W',
      date: '2023-05-20',
      area: 8.3,
      confidence: 87,
      severity: 'medium'
    },
    {
      id: 3,
      type: 'Vegetation Recovery',
      location: '40.7534°N, 73.9923°W',
      date: '2023-04-10',
      area: 15.7,
      confidence: 95,
      severity: 'low'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced Change Detection</h3>
          <p className="text-gray-600">AI-powered environmental change analysis with PostGIS backend</p>
        </div>
        <div className="flex gap-2">
          <Select value={detectionType} onValueChange={setDetectionType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Detection Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vegetation">Vegetation</SelectItem>
              <SelectItem value="urban">Urban Growth</SelectItem>
              <SelectItem value="water">Water Bodies</SelectItem>
              <SelectItem value="surface">Surface Mining</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sensitivity} onValueChange={setSensitivity}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Sensitivity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="map-view" className="w-full">
        <TabsList className="flex w-full overflow-x-auto gap-0 scrollbar-hide bg-muted p-1 rounded-md"
          style={{ WebkitOverflowScrolling: 'touch' }}>
          <TabsTrigger 
            value="map-view" 
            className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm min-w-[120px] md:min-w-0">
            Map Visualization
          </TabsTrigger>
          <TabsTrigger 
            value="backend-processing" 
            className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm min-w-[130px] md:min-w-0">
            Backend Processing
          </TabsTrigger>
          <TabsTrigger 
            value="detected-changes" 
            className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm min-w-[130px] md:min-w-0">
            Detected Changes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="map-view" className="space-y-6">
          <ChangeDetectionMap period={period} dataset={dataset} />
        </TabsContent>

        <TabsContent value="backend-processing" className="space-y-6">
          <GeospatialProcessor />
        </TabsContent>

        <TabsContent value="detected-changes" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detected Changes</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
            
            <div className="space-y-4">
              {detectedChanges.map((change) => (
                <div key={change.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{change.type}</span>
                        <Badge className={getSeverityColor(change.severity)}>
                          {change.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {change.location} • {change.date} • {change.area} km²
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{change.confidence}% confidence</div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
