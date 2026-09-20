import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Filter, Calendar } from 'lucide-react';

interface TrendAnalysisProps {
  period: string;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ period }) => {
  const [selectedMetric, setSelectedMetric] = useState('environmental');
  const [analysisType, setAnalysisType] = useState('trend');

  // Mock trend data
  const environmentalTrends = [
    { date: '2024-01', aqi: 85, pm25: 35, temperature: 22, humidity: 65 },
    { date: '2024-02', aqi: 82, pm25: 33, temperature: 24, humidity: 68 },
    { date: '2024-03', aqi: 79, pm25: 31, temperature: 26, humidity: 70 },
    { date: '2024-04', aqi: 77, pm25: 29, temperature: 28, humidity: 72 }
  ];

  const miningTrends = [
    { date: '2024-01', production: 450, efficiency: 85, safety: 96, costs: 180 },
    { date: '2024-02', production: 480, efficiency: 87, safety: 97, costs: 175 },
    { date: '2024-03', production: 520, efficiency: 89, safety: 98, costs: 170 },
    { date: '2024-04', production: 510, efficiency: 91, safety: 98, costs: 165 }
  ];

  const correlationData = [
    { efficiency: 85, production: 450, cost: 180 },
    { efficiency: 87, production: 480, cost: 175 },
    { efficiency: 89, production: 520, cost: 170 },
    { efficiency: 91, production: 510, cost: 165 },
    { efficiency: 88, production: 495, cost: 172 },
    { efficiency: 90, production: 530, cost: 168 }
  ];

  const forecasting = [
    { date: '2024-01', actual: 450, predicted: 445 },
    { date: '2024-02', actual: 480, predicted: 475 },
    { date: '2024-03', actual: 520, predicted: 515 },
    { date: '2024-04', actual: 510, predicted: 520 },
    { date: '2024-05', actual: null, predicted: 535 },
    { date: '2024-06', actual: null, predicted: 545 }
  ];

  const insights = [
    {
      title: 'Environmental Improvement',
      description: 'Air quality index has improved by 9.4% over the past 4 months',
      trend: 'positive',
      confidence: 92
    },
    {
      title: 'Production Efficiency',
      description: 'Mining efficiency shows consistent upward trend (+7.1%)',
      trend: 'positive',
      confidence: 88
    },
    {
      title: 'Cost Optimization',
      description: 'Operating costs decreased by 8.3% while maintaining output',
      trend: 'positive',
      confidence: 85
    },
    {
      title: 'Safety Performance',
      description: 'Safety scores remain consistently high with minimal variation',
      trend: 'stable',
      confidence: 95
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderChart = () => {
    if (analysisType === 'trend' && selectedMetric === 'environmental') {
      return (
        <AreaChart data={environmentalTrends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="aqi" stackId="1" stroke="#8884d8" fill="#8884d8" name="AQI" />
          <Area type="monotone" dataKey="pm25" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="PM2.5" />
        </AreaChart>
      );
    }
    
    if (analysisType === 'trend' && selectedMetric === 'mining') {
      return (
        <LineChart data={miningTrends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="production" stroke="#8884d8" strokeWidth={2} name="Production" />
          <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} name="Efficiency" />
          <Line type="monotone" dataKey="safety" stroke="#ffc658" strokeWidth={2} name="Safety Score" />
        </LineChart>
      );
    }
    
    if (analysisType === 'correlation') {
      return (
        <ScatterChart data={correlationData}>
          <CartesianGrid />
          <XAxis type="number" dataKey="efficiency" name="Efficiency" unit="%" />
          <YAxis type="number" dataKey="production" name="Production" unit=" tons" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Efficiency vs Production" data={correlationData} fill="#8884d8" />
        </ScatterChart>
      );
    }
    
    if (analysisType === 'forecast') {
      return (
        <LineChart data={forecasting}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} name="Actual" />
          <Line type="monotone" dataKey="predicted" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
        </LineChart>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced Trend Analysis</h3>
          <p className="text-gray-600">Historical patterns, forecasting, and correlation analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="environmental">Environmental</SelectItem>
              <SelectItem value="mining">Mining Operations</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Analysis Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trend">Trend Analysis</SelectItem>
              <SelectItem value="correlation">Correlation</SelectItem>
              <SelectItem value="forecast">Forecasting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {analysisType === 'trend' && 'Historical Trends'}
          {analysisType === 'correlation' && 'Correlation Analysis'}
          {analysisType === 'forecast' && 'Predictive Forecasting'}
        </h3>
        
        <ResponsiveContainer width="100%" height={350}>
          {renderChart()}
        </ResponsiveContainer>
      </Card>

      {/* Insights Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights & Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(insight.trend)}
                <h4 className="font-medium">{insight.title}</h4>
                <Badge className={getTrendColor(insight.trend)}>
                  {insight.confidence}% confidence
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Statistical Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <h4 className="font-medium mb-2">Trend Direction</h4>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-lg font-bold text-green-600">Positive</span>
          </div>
          <p className="text-sm text-gray-600">Most metrics showing improvement</p>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-2">Volatility</h4>
          <div className="text-lg font-bold text-blue-600">Low (±3.2%)</div>
          <p className="text-sm text-gray-600">Stable performance indicators</p>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-2">Forecast Accuracy</h4>
          <div className="text-lg font-bold text-purple-600">89.3%</div>
          <p className="text-sm text-gray-600">High predictive reliability</p>
        </Card>
      </div>
    </div>
  );
};
