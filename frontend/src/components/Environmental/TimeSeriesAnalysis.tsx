
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Activity, Download, RefreshCw } from 'lucide-react';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';
import { useToast } from '@/hooks/use-toast';

interface TimeSeriesAnalysisProps {
  data: RealTimeEnvironmentalData | null;
}

interface DataPoint {
  timestamp: string;
  date: string;
  aqi: number;
  pm25: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  ndvi: number;
  predicted?: boolean;
}

interface TrendAnalysis {
  parameter: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  confidence: number;
  forecast: DataPoint[];
}

export const TimeSeriesAnalysis: React.FC<TimeSeriesAnalysisProps> = ({ data }) => {
  const { toast } = useToast();
  const [selectedParameter, setSelectedParameter] = useState('aqi');
  const [timeRange, setTimeRange] = useState('30d');
  const [analysisType, setAnalysisType] = useState('trend');
  const [showPredictions, setShowPredictions] = useState(false);

  // Generate historical data with realistic trends
  const generateTimeSeriesData = (days: number): DataPoint[] => {
    const now = new Date();
    const dataPoints: DataPoint[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Base values from current data or defaults
      const baseAqi = data?.airQuality.aqi || 100;
      const baseTemp = data?.weather.temperature || 20;
      const baseHumidity = data?.weather.humidity || 60;
      
      // Add trends and seasonal variations
      const seasonalFactor = Math.sin((i / 365) * 2 * Math.PI) * 0.2;
      const trendFactor = (days - i) / days * 0.1;
      const randomVariation = (Math.random() - 0.5) * 0.3;
      
      dataPoints.push({
        timestamp: date.toISOString(),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aqi: Math.max(0, baseAqi * (1 + seasonalFactor + trendFactor + randomVariation)),
        pm25: Math.max(0, (data?.airQuality.pm25 || 50) * (1 + seasonalFactor + randomVariation)),
        temperature: baseTemp + seasonalFactor * 10 + randomVariation * 5,
        humidity: Math.max(0, Math.min(100, baseHumidity + randomVariation * 20)),
        windSpeed: Math.max(0, (data?.weather.windSpeed || 10) + randomVariation * 5),
        pressure: (data?.weather.pressure || 1013) + randomVariation * 20,
        ndvi: Math.max(0, Math.min(1, (data?.vegetation.ndvi || 0.7) + seasonalFactor * 0.2 + randomVariation * 0.1))
      });
    }
    
    return dataPoints;
  };

  // Generate predictions using simple linear regression
  const generatePredictions = (historicalData: DataPoint[], parameter: keyof DataPoint, days: number = 7): DataPoint[] => {
    const predictions: DataPoint[] = [];
    const values = historicalData.map((d, i) => ({ x: i, y: d[parameter] as number }));
    
    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, point) => sum + point.x, 0);
    const sumY = values.reduce((sum, point) => sum + point.y, 0);
    const sumXY = values.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = values.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate future predictions
    const lastDate = new Date(historicalData[historicalData.length - 1].timestamp);
    
    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      const predictedValue = slope * (n + i) + intercept;
      const lastPoint = historicalData[historicalData.length - 1];
      
      predictions.push({
        ...lastPoint,
        timestamp: futureDate.toISOString(),
        date: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        [parameter]: Math.max(0, predictedValue),
        predicted: true
      });
    }
    
    return predictions;
  };

  const timeSeriesData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const historical = generateTimeSeriesData(days);
    
    if (showPredictions) {
      const predictions = generatePredictions(historical, selectedParameter as keyof DataPoint);
      return [...historical, ...predictions];
    }
    
    return historical;
  }, [timeRange, selectedParameter, showPredictions, data]);

  // Analyze trends
  const trendAnalysis = useMemo((): TrendAnalysis => {
    const values = timeSeriesData
      .filter(d => !d.predicted)
      .map(d => d[selectedParameter as keyof DataPoint] as number);
    
    if (values.length < 2) {
      return {
        parameter: selectedParameter,
        direction: 'stable',
        changeRate: 0,
        confidence: 0,
        forecast: []
      };
    }
    
    const recent = values.slice(-7);
    const previous = values.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, val) => sum + val, 0) / previous.length 
      : values[0];
    
    const changeRate = ((recentAvg - previousAvg) / previousAvg) * 100;
    const direction = Math.abs(changeRate) < 2 ? 'stable' : changeRate > 0 ? 'increasing' : 'decreasing';
    
    // Calculate confidence based on data consistency
    const variance = values.reduce((sum, val) => sum + Math.pow(val - recentAvg, 2), 0) / values.length;
    const confidence = Math.max(0, Math.min(100, 100 - (variance / recentAvg) * 100));
    
    return {
      parameter: selectedParameter,
      direction,
      changeRate: Math.abs(changeRate),
      confidence,
      forecast: showPredictions ? timeSeriesData.filter(d => d.predicted) : []
    };
  }, [timeSeriesData, selectedParameter, showPredictions]);

  const exportData = () => {
    const csvData = timeSeriesData.map(point => ({
      Date: point.date,
      Timestamp: point.timestamp,
      [selectedParameter.toUpperCase()]: point[selectedParameter as keyof DataPoint],
      Predicted: point.predicted ? 'Yes' : 'No'
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedParameter}_timeseries_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: `Time series data for ${selectedParameter} exported successfully`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Parameter</label>
            <Select value={selectedParameter} onValueChange={setSelectedParameter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aqi">Air Quality Index</SelectItem>
                <SelectItem value="pm25">PM2.5</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="humidity">Humidity</SelectItem>
                <SelectItem value="windSpeed">Wind Speed</SelectItem>
                <SelectItem value="pressure">Pressure</SelectItem>
                <SelectItem value="ndvi">Vegetation Index</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Analysis Type</label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trend">Trend Analysis</SelectItem>
                <SelectItem value="seasonal">Seasonal Patterns</SelectItem>
                <SelectItem value="correlation">Correlation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button 
              onClick={() => setShowPredictions(!showPredictions)} 
              variant={showPredictions ? "default" : "outline"} 
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              {showPredictions ? 'Hide' : 'Show'} Predictions
            </Button>
          </div>
        </div>
      </Card>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trend Direction</p>
              <div className="flex items-center gap-2 mt-1">
                {trendAnalysis.direction === 'increasing' ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : trendAnalysis.direction === 'decreasing' ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium capitalize">{trendAnalysis.direction}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div>
            <p className="text-sm text-gray-600">Change Rate</p>
            <p className="text-2xl font-bold">{trendAnalysis.changeRate.toFixed(1)}%</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div>
            <p className="text-sm text-gray-600">Confidence</p>
            <p className="text-2xl font-bold">{trendAnalysis.confidence.toFixed(0)}%</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div>
            <p className="text-sm text-gray-600">Data Points</p>
            <p className="text-2xl font-bold">{timeSeriesData.filter(d => !d.predicted).length}</p>
          </div>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {selectedParameter.toUpperCase()} Time Series Analysis
          </h3>
          <Badge variant="outline">
            Last {timeRange}
          </Badge>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: any, name: string) => [
                typeof value === 'number' ? value.toFixed(2) : value, 
                name
              ]}
            />
            <Area
              type="monotone"
              dataKey={selectedParameter}
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            {showPredictions && (
              <Line
                type="monotone"
                dataKey={selectedParameter}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        
        {showPredictions && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Prediction Model:</strong> Linear regression based on historical trends. 
              Dashed line shows 7-day forecast with {trendAnalysis.confidence.toFixed(0)}% confidence.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
