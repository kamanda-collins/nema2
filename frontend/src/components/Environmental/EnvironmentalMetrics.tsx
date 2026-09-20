
import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';
import { useIsMobile } from '@/hooks/use-mobile';
import { PollutionSourcesChart } from './PollutionSourcesChart';

// Default static pollution sources data
const defaultPollutionSources = [
  { source: 'Vehicle Emissions', percentage: 35, color: '#ef4444' },
  { source: 'Industrial', percentage: 28, color: '#f97316' },
  { source: 'Construction', percentage: 18, color: '#eab308' },
  { source: 'Natural', percentage: 12, color: '#22c55e' },
  { source: 'Other', percentage: 7, color: '#6b7280' },
];

interface EnvironmentalMetricsProps {
  data: RealTimeEnvironmentalData | null;
}

const airQualityData = [
  { time: '00:00', pm25: 45, pm10: 62, o3: 78 },
  { time: '04:00', pm25: 52, pm10: 68, o3: 82 },
  { time: '08:00', pm25: 78, pm10: 92, o3: 95 },
  { time: '12:00', pm25: 85, pm10: 108, o3: 102 },
  { time: '16:00', pm25: 92, pm10: 115, o3: 98 },
  { time: '20:00', pm25: 68, pm10: 85, o3: 88 },
];

export const EnvironmentalMetrics: React.FC<EnvironmentalMetricsProps> = ({ data }) => {
  const isMobile = useIsMobile();

  // Always use static default data for pollution sources
  const pollutionChartData = defaultPollutionSources;

  return (
    <div className={`space-y-4 ${isMobile ? 'px-2' : 'space-y-6'}`}>
      {/* Air Quality Trends */}
      <div>
        <h3 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>24-Hour Air Quality Trends</h3>
        <Card className={`${isMobile ? 'p-2' : 'p-4'}`}>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={airQualityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Tooltip 
                wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Line type="monotone" dataKey="pm25" stroke="#ef4444" strokeWidth={2} name="PM2.5" />
              <Line type="monotone" dataKey="pm10" stroke="#f97316" strokeWidth={2} name="PM10" />
              <Line type="monotone" dataKey="o3" stroke="#3b82f6" strokeWidth={2} name="Ozone" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {/* Pollution Sources Analysis */}
      <div>
        <h3 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Pollution Sources Analysis</h3>
        <PollutionSourcesChart isMobile={isMobile} data={pollutionChartData} />
      </div>
      {/* Quick Stat Tiles */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        <Card className={`${isMobile ? 'p-3' : 'p-4'}`}>
          <h4 className={`font-medium mb-2 ${isMobile ? 'text-sm' : ''}`}>Temperature</h4>
          <p className={`font-bold text-blue-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {data?.weather.temperature?.toFixed?.(1) || '24.5'}°C
          </p>
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Humidity: {data?.weather.humidity || 68}%
          </p>
        </Card>
        <Card className={`${isMobile ? 'p-3' : 'p-4'}`}>
          <h4 className={`font-medium mb-2 ${isMobile ? 'text-sm' : ''}`}>Wind Conditions</h4>
          <p className={`font-bold text-green-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {data?.weather.windSpeed || 12} km/h
          </p>
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {data?.weather.windDirection || 'SW'} direction
          </p>
        </Card>
        <Card className={`${isMobile ? 'p-3' : 'p-4'}`}>
          <h4 className={`font-medium mb-2 ${isMobile ? 'text-sm' : ''}`}>Atmospheric Pressure</h4>
          <p className={`font-bold text-purple-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {data?.weather.pressure || 1013} hPa
          </p>
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Normal range</p>
        </Card>
      </div>
    </div>
  );
};
