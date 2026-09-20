
// EnvironmentalSidebar.tsx: Extracted from EnvironmentalDashboard for clarity/maintainability

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, AlertTriangle, TrendingUp, FlaskConical, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPicker } from './LocationPicker';
import { MonitoringPointManager } from './MonitoringPointManager';
import { DataExportTools } from './DataExportTools';
import { useToast } from '@/hooks/use-toast';

interface EnvironmentalSidebarProps {
  environmentalAlerts: any[];
  currentLocation: any;
  data: any;
  setActiveTab: (value: string) => void;
  handleSetMonitoringPoint: () => void;
  handleGenerateReport: () => void;
  handleScheduleAnalysis: () => void;
  getAlertColor: (level: string) => string;
}

export const EnvironmentalSidebar: React.FC<EnvironmentalSidebarProps> = ({
  environmentalAlerts,
  currentLocation,
  data,
  setActiveTab,
  handleSetMonitoringPoint,
  handleGenerateReport,
  handleScheduleAnalysis,
  getAlertColor
}) => {
  return (
    <div className="space-y-4">

      {/* Location Picker */}
      <LocationPicker />

      {/* Monitoring Points Manager */}
      <Card className="p-4">
        <MonitoringPointManager onSetPoint={handleSetMonitoringPoint} />
      </Card>

      {/* Data Export Tools */}
      <DataExportTools 
        data={data} 
        locationName={currentLocation?.name?.split(',')[0]} 
      />

      {/* Recent Alerts */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold">Environmental Alerts</h3>
        </div>
        <div className="space-y-3">
          {environmentalAlerts.map((alert) => (
            <div key={alert.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{alert.type}</span>
                <Badge className={getAlertColor(alert.level)}>{alert.level}</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <MapPin className="h-3 w-3" />
                {alert.location}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {alert.timestamp}
                </div>
                <div className="text-xs text-gray-600">
                  {alert.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleGenerateReport}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleScheduleAnalysis}
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            Schedule Analysis
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => setActiveTab('predictions')}
          >
            <Brain className="h-4 w-4 mr-2" />
            View Predictions
          </Button>
        </div>
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          <p><strong>Enhanced Analytics:</strong> Now includes time series analysis, predictive modeling, and advanced alerting capabilities.</p>
        </div>
      </Card>
    </div>
  );
};

