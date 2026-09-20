import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { EnvironmentalTabs } from './EnvironmentalTabs';
import { EnvironmentalMetrics } from './EnvironmentalMetrics';
import { EnhancedAnalytics } from './EnhancedAnalytics';
import { TimeSeriesAnalysis } from './TimeSeriesAnalysis';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { InteractiveMap } from '../Map/InteractiveMap';
import { useIsMobile } from '@/hooks/use-mobile';

const fallbackData = {
  airQuality: {
    aqi: 142,
    pm25: 85,
    pm10: 108,
    o3: 102,
    no2: 45,
    so2: 23,
    co: 1.2,
    status: 'moderate'
  },
  weather: {
    temperature: 24.5,
    humidity: 68,
    windSpeed: 12,
    windDirection: 'SW',
    pressure: 1013
  },
  waterQuality: {
    ph: 7.2,
    dissolvedOxygen: 8.5,
    turbidity: 7.2,
    temperature: 22.1,
    status: 'good'
  },
  vegetation: {
    ndvi: 0.74,
    coverage: 74,
    health: 'healthy'
  }
};

interface EnvironmentalMainPanelProps {
  activeTab: string;
  setActiveTab: (v: string) => void;
  data: any;
}

export const EnvironmentalMainPanel: React.FC<EnvironmentalMainPanelProps> = ({
  activeTab,
  setActiveTab,
  data,
}) => {
  const validData = data && typeof data === 'object' ? data : fallbackData;
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (!["overview", "maps", "analytics", "timeseries", "predictions"].includes(activeTab)) {
      setActiveTab("overview");
    }
  }, [activeTab, setActiveTab]);

  return (
    <Card className="p-6">
      <div className="mb-2 text-xs text-gray-400 font-mono">
        <span>[EnvironmentalMainPanel]</span> Active Tab: <span className="font-bold">{activeTab}</span>
      </div>
      <Tabs value={activeTab || 'overview'} onValueChange={setActiveTab} className="w-full">
        <EnvironmentalTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabsContent value="overview" className="mt-6">
          <EnvironmentalMetrics data={validData} />
        </TabsContent>
        <TabsContent value="maps" className="mt-6">
          {/* Responsive: Only show InteractiveMap on desktop, simplified view on mobile */}
          {!isMobile ? (
            <InteractiveMap />
          ) : (
            <div className="p-4 bg-blue-50 rounded-lg border">
              <h3 className="font-medium text-blue-900 mb-2">Map View (Mobile)</h3>
              <p className="text-sm text-blue-800">
                Interactive mapping is optimized for desktop. Use the main map section for full functionality on mobile devices.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <EnhancedAnalytics data={validData} />
        </TabsContent>
        <TabsContent value="timeseries" className="mt-6">
          <TimeSeriesAnalysis data={validData} />
        </TabsContent>
        <TabsContent value="predictions" className="mt-6">
          <PredictiveAnalytics data={validData} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
