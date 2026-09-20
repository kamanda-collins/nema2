import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Droplets, TrendingUp, TrendingDown } from 'lucide-react';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';

interface WaterQualityAnalysisProps {
  data: RealTimeEnvironmentalData | null;
}

const waterParameters = [
  { name: 'pH Level', value: 7.2, range: '6.5-8.5', status: 'good', trend: 'stable' },
  { name: 'Dissolved Oxygen', value: 8.5, unit: 'mg/L', min: 6.0, status: 'excellent', trend: 'up' },
  { name: 'Turbidity', value: 2.1, unit: 'NTU', max: 5.0, status: 'good', trend: 'down' },
  { name: 'Total Coliform', value: 15, unit: 'CFU/100ml', max: 50, status: 'good', trend: 'stable' },
  { name: 'Nitrates', value: 3.2, unit: 'mg/L', max: 10.0, status: 'good', trend: 'up' },
  { name: 'Phosphates', value: 0.8, unit: 'mg/L', max: 2.0, status: 'excellent', trend: 'down' },
];

const waterSources = [
  { name: 'Main River', quality: 87, samples: 24, lastTested: '2 hours ago' },
  { name: 'Lake District', quality: 92, samples: 18, lastTested: '4 hours ago' },
  { name: 'Groundwater Wells', quality: 78, samples: 12, lastTested: '6 hours ago' },
  { name: 'Treatment Plant Outlet', quality: 95, samples: 30, lastTested: '1 hour ago' },
];

export const WaterQualityAnalysis: React.FC<WaterQualityAnalysisProps> = ({ data }) => {
  // Use real data when available, fallback to mock data
  const realWaterData = data?.waterQuality;
  const updatedParameters = waterParameters.map((param, index) => {
    if (realWaterData) {
      switch (index) {
        case 0: // pH Level
          return { ...param, value: realWaterData.ph };
        case 1: // Dissolved Oxygen
          return { ...param, value: realWaterData.dissolvedOxygen };
        case 2: // Turbidity
          return { ...param, value: realWaterData.turbidity };
        default:
          return param;
      }
    }
    return param;
  });

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (quality >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 90) return 'Excellent';
    if (quality >= 75) return 'Good';
    if (quality >= 60) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Water Quality Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {updatedParameters.map((param) => (
            <Card key={param.name} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{param.name}</h4>
                <div className="flex items-center gap-2">
                  {getTrendIcon(param.trend)}
                  <Badge className={getStatusColor(param.status)}>
                    {param.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">
                    {param.value} {param.unit || ''}
                  </span>
                  <span className="text-gray-600">
                    {param.range || `Max: ${param.max} ${param.unit || ''}`}
                  </span>
                </div>
                {param.max && (
                  <Progress 
                    value={(param.value / param.max) * 100} 
                    className="h-2"
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Water Source Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {waterSources.map((source) => (
            <Card key={source.name} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{source.name}</h4>
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">{source.quality}%</span>
                  <Badge className={getQualityColor(source.quality)}>
                    {getQualityLabel(source.quality)}
                  </Badge>
                </div>
                <Progress value={source.quality} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{source.samples} samples</span>
                  <span>Last tested: {source.lastTested}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Droplets className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Water Quality Insights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {realWaterData ? (
                <>
                  <li>• Current pH level: {realWaterData.ph.toFixed(1)} (Status: {realWaterData.status})</li>
                  <li>• Dissolved oxygen: {realWaterData.dissolvedOxygen.toFixed(1)} mg/L</li>
                  <li>• Water temperature: {realWaterData.temperature.toFixed(1)}°C</li>
                  <li>• Turbidity: {realWaterData.turbidity.toFixed(1)} NTU</li>
                </>
              ) : (
                <>
                  <li>• All monitored water sources meet safety standards</li>
                  <li>• Phosphate levels showing improvement due to reduced agricultural runoff</li>
                  <li>• Dissolved oxygen levels are excellent, indicating healthy aquatic ecosystems</li>
                  <li>• Continue monitoring nitrate trends in groundwater sources</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
