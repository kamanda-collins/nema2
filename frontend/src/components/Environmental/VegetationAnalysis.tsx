import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TreePine, Leaf, TrendingUp, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';

interface VegetationAnalysisProps {
  data: RealTimeEnvironmentalData | null;
}

const ndviData = [
  { month: 'Jan', ndvi: 0.45, temperature: 5.2, rainfall: 45 },
  { month: 'Feb', ndvi: 0.48, temperature: 7.1, rainfall: 52 },
  { month: 'Mar', ndvi: 0.62, temperature: 12.3, rainfall: 38 },
  { month: 'Apr', ndvi: 0.71, temperature: 16.8, rainfall: 42 },
  { month: 'May', ndvi: 0.78, temperature: 21.2, rainfall: 65 },
  { month: 'Jun', ndvi: 0.82, temperature: 25.6, rainfall: 78 },
];

const vegetationZones = [
  { name: 'Forest Reserve', ndvi: 0.85, area: 2450, health: 'excellent', coverage: 95 },
  { name: 'Agricultural Land', ndvi: 0.72, area: 1820, health: 'good', coverage: 78 },
  { name: 'Urban Parks', ndvi: 0.68, area: 560, health: 'good', coverage: 65 },
  { name: 'Wetlands', ndvi: 0.79, area: 890, health: 'excellent', coverage: 88 },
];

const threats = [
  { type: 'Deforestation', severity: 'medium', area: '12 hectares', location: 'Sector 7-A' },
  { type: 'Drought Stress', severity: 'low', area: '45 hectares', location: 'Agricultural Zone' },
  { type: 'Pest Infestation', severity: 'high', area: '8 hectares', location: 'Pine Forest' },
];

export const VegetationAnalysis: React.FC<VegetationAnalysisProps> = ({ data }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Use real vegetation data when available
  const vegetationData = data?.vegetation;

  return (
    <div className="space-y-6">
      {/* Real-time vegetation status */}
      {vegetationData && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Current Vegetation Status</h3>
            <Badge className={getHealthColor(vegetationData.health)}>
              {vegetationData.health}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{vegetationData.ndvi.toFixed(3)}</p>
              <p className="text-sm text-gray-600">NDVI Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{vegetationData.coverage}%</p>
              <p className="text-sm text-gray-600">Coverage</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{vegetationData.health}</p>
              <p className="text-sm text-gray-600">Health Status</p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">NDVI Trends (6-Month Analysis)</h3>
        <Card className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ndviData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="ndvi" 
                stroke="#10b981" 
                strokeWidth={3} 
                name="NDVI"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p>NDVI (Normalized Difference Vegetation Index) measures vegetation health and density. Values range from -1 to 1, with higher values indicating healthier vegetation.</p>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Vegetation Zones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vegetationZones.map((zone) => (
            <Card key={zone.name} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{zone.name}</h4>
                <TreePine className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">NDVI Score</span>
                  <span className="font-semibold text-green-600">{zone.ndvi}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Coverage</span>
                  <Badge className={getHealthColor(zone.health)}>
                    {zone.coverage}% • {zone.health}
                  </Badge>
                </div>
                <Progress value={zone.coverage} className="h-2" />
                <div className="text-xs text-gray-600">
                  Area: {zone.area} hectares
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Environmental Threats</h3>
        <div className="space-y-3">
          {threats.map((threat, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Leaf className="h-5 w-5 text-orange-500" />
                  <div>
                    <h4 className="font-medium">{threat.type}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {threat.location} • {threat.area}
                    </div>
                  </div>
                </div>
                <Badge className={getSeverityColor(threat.severity)}>
                  {threat.severity}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <TreePine className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">
            {vegetationData ? `${vegetationData.coverage}%` : '74.2%'}
          </p>
          <p className="text-sm text-gray-600">Forest Coverage</p>
        </Card>

        <Card className="p-4 text-center">
          <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">+5.8%</p>
          <p className="text-sm text-gray-600">Growth This Year</p>
        </Card>

        <Card className="p-4 text-center">
          <Leaf className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-600">3</p>
          <p className="text-sm text-gray-600">Active Threats</p>
        </Card>
      </div>

      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <TreePine className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">Vegetation Health Summary</h4>
            <ul className="text-sm text-green-800 space-y-1">
              {vegetationData ? (
                <>
                  <li>• Current NDVI score: {vegetationData.ndvi.toFixed(3)} ({vegetationData.health})</li>
                  <li>• Vegetation coverage: {vegetationData.coverage}% of analyzed area</li>
                  <li>• Health status indicates {vegetationData.health} vegetation conditions</li>
                  <li>• Monitoring continues for environmental changes</li>
                </>
              ) : (
                <>
                  <li>• Overall vegetation health is excellent with NDVI scores above 0.74</li>
                  <li>• Seasonal growth patterns are within normal ranges</li>
                  <li>• Forest reserves showing strong recovery from last year's drought</li>
                  <li>• Immediate attention needed for pest infestation in Pine Forest area</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
