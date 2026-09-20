
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Download, RefreshCw } from 'lucide-react';

interface HistoricalTrendsProps {
  period: string;
  dataset: string;
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({ period, dataset }) => {
  const [selectedIndex, setSelectedIndex] = useState('ndvi');
  const [analysisType, setAnalysisType] = useState('temporal');

  // Mock historical data
  const timeSeriesData = [
    { date: '2020-01', ndvi: 0.65, evi: 0.45, savi: 0.58, temperature: 22.5, precipitation: 45 },
    { date: '2020-04', ndvi: 0.72, evi: 0.52, savi: 0.65, temperature: 28.2, precipitation: 62 },
    { date: '2020-07', ndvi: 0.78, evi: 0.58, savi: 0.71, temperature: 32.1, precipitation: 38 },
    { date: '2020-10', ndvi: 0.68, evi: 0.48, savi: 0.61, temperature: 24.8, precipitation: 55 },
    { date: '2021-01', ndvi: 0.63, evi: 0.43, savi: 0.56, temperature: 21.9, precipitation: 48 },
    { date: '2021-04', ndvi: 0.74, evi: 0.54, savi: 0.67, temperature: 29.1, precipitation: 58 },
    { date: '2021-07', ndvi: 0.81, evi: 0.61, savi: 0.74, temperature: 33.5, precipitation: 42 },
    { date: '2021-10', ndvi: 0.71, evi: 0.51, savi: 0.64, temperature: 25.3, precipitation: 51 },
    { date: '2022-01', ndvi: 0.66, evi: 0.46, savi: 0.59, temperature: 22.8, precipitation: 44 },
    { date: '2022-04', ndvi: 0.76, evi: 0.56, savi: 0.69, temperature: 30.2, precipitation: 65 },
    { date: '2022-07', ndvi: 0.83, evi: 0.63, savi: 0.76, temperature: 34.2, precipitation: 35 },
    { date: '2022-10', ndvi: 0.73, evi: 0.53, savi: 0.66, temperature: 26.1, precipitation: 49 }
  ];

  const trendAnalysis = {
    ndvi: { trend: 'increasing', change: 12.3, confidence: 89 },
    evi: { trend: 'increasing', change: 15.1, confidence: 92 },
    savi: { trend: 'increasing', change: 13.8, confidence: 87 },
    temperature: { trend: 'increasing', change: 8.5, confidence: 95 },
    precipitation: { trend: 'decreasing', change: -5.2, confidence: 78 }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'increasing' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const exportData = () => {
    console.log('Exporting time series data');
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historical Environmental Trends</h3>
          <p className="text-gray-600">Long-term analysis of vegetation and environmental indices</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedIndex} onValueChange={setSelectedIndex}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Index" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ndvi">NDVI (Vegetation)</SelectItem>
              <SelectItem value="evi">EVI (Enhanced Vegetation)</SelectItem>
              <SelectItem value="savi">SAVI (Soil Adjusted)</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="precipitation">Precipitation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Analysis Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="temporal">Temporal</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="anomaly">Anomaly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {selectedIndex.toUpperCase()} Time Series - {dataset}
          </h3>
          <Badge variant="outline">
            {period} analysis
          </Badge>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={selectedIndex}
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Trend Direction</h4>
            {getTrendIcon(trendAnalysis[selectedIndex as keyof typeof trendAnalysis]?.trend)}
          </div>
          <div className="text-lg font-bold capitalize">
            {trendAnalysis[selectedIndex as keyof typeof trendAnalysis]?.trend}
          </div>
          <p className="text-sm text-gray-600">
            {Math.abs(trendAnalysis[selectedIndex as keyof typeof trendAnalysis]?.change || 0)}% change
          </p>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-2">Statistical Confidence</h4>
          <div className="text-lg font-bold text-blue-600">
            {trendAnalysis[selectedIndex as keyof typeof trendAnalysis]?.confidence}%
          </div>
          <p className="text-sm text-gray-600">High reliability</p>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-2">Data Quality</h4>
          <div className="text-lg font-bold text-green-600">Excellent</div>
          <p className="text-sm text-gray-600">{timeSeriesData.length} data points</p>
        </Card>
      </div>

      {/* Seasonal Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Seasonal Patterns</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ndvi" stroke="#10B981" strokeWidth={2} name="NDVI" />
            <Line type="monotone" dataKey="evi" stroke="#F59E0B" strokeWidth={2} name="EVI" />
            <Line type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2} name="Temperature" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
