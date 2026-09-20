
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wind, AlertTriangle, CheckCircle } from 'lucide-react';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';

interface AirQualityMonitorProps {
  data: RealTimeEnvironmentalData | null;
}

const monitoringStations = [
  { id: 1, name: 'Central Station', aqi: 142, status: 'moderate', lat: 40.7128, lng: -74.0060 },
  { id: 2, name: 'Industrial Zone', aqi: 168, status: 'unhealthy', lat: 40.7580, lng: -73.9855 },
  { id: 3, name: 'Residential Area', aqi: 95, status: 'good', lat: 40.6892, lng: -74.0445 },
  { id: 4, name: 'Highway Corridor', aqi: 156, status: 'moderate', lat: 40.7489, lng: -73.9680 },
];

export const AirQualityMonitor: React.FC<AirQualityMonitorProps> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy': return 'bg-red-100 text-red-800 border-red-200';
      case 'hazardous': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy': case 'hazardous': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Wind className="h-4 w-4 text-gray-600" />;
    }
  };

  const pollutants = [
    { name: 'PM2.5', value: data?.airQuality.pm25 || 85, max: 150, unit: 'µg/m³', status: data?.airQuality.status || 'moderate', color: 'bg-yellow-500' },
    { name: 'PM10', value: data?.airQuality.pm10 || 108, max: 250, unit: 'µg/m³', status: data?.airQuality.status || 'moderate', color: 'bg-yellow-500' },
    { name: 'Ozone (O3)', value: data?.airQuality.o3 || 102, max: 200, unit: 'µg/m³', status: data?.airQuality.status || 'moderate', color: 'bg-yellow-500' },
    { name: 'NO2', value: data?.airQuality.no2 || 45, max: 100, unit: 'µg/m³', status: data?.airQuality.no2 > 50 ? 'moderate' : 'good', color: 'bg-green-500' },
    { name: 'SO2', value: data?.airQuality.so2 || 23, max: 80, unit: 'µg/m³', status: 'good', color: 'bg-green-500' },
    { name: 'CO', value: data?.airQuality.co || 1.2, max: 4.0, unit: 'mg/m³', status: 'good', color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Pollutant Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pollutants.map((pollutant) => (
            <Card key={pollutant.name} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{pollutant.name}</h4>
                <Badge className={getStatusColor(pollutant.status)}>
                  {pollutant.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{pollutant.value} {pollutant.unit}</span>
                  <span className="text-gray-600">Max: {pollutant.max} {pollutant.unit}</span>
                </div>
                <Progress 
                  value={(pollutant.value / pollutant.max) * 100} 
                  className="h-2"
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Monitoring Stations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monitoringStations.map((station) => (
            <Card key={station.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{station.name}</h4>
                {getStatusIcon(station.status)}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{station.aqi}</p>
                  <p className="text-sm text-gray-600">AQI</p>
                </div>
                <Badge className={getStatusColor(station.status)}>
                  {station.status}
                </Badge>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Wind className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Air Quality Recommendations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Limit outdoor activities during peak pollution hours (8 AM - 6 PM)</li>
              <li>• Consider wearing N95 masks in high-pollution areas</li>
              <li>• Keep windows closed and use air purifiers indoors</li>
              <li>• Avoid exercising near busy roads or industrial areas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
