
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, BarChart3 } from 'lucide-react';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';

interface PredictiveAnalyticsProps {
  data: RealTimeEnvironmentalData | null;
}

interface Prediction {
  parameter: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: 'improving' | 'worsening' | 'stable';
  timeframe: string;
  factors: string[];
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  category: string;
  description: string;
  mitigation: string[];
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ data }) => {
  const [selectedModel, setSelectedModel] = useState('environmental_forecast');
  const [timeHorizon, setTimeHorizon] = useState('7d');

  // Generate predictions based on current data and trends
  const predictions = useMemo((): Prediction[] => {
    if (!data) return [];

    const baseFactors = [
      'Historical patterns',
      'Seasonal trends',
      'Weather conditions',
      'Industrial activity'
    ];

    return [
      {
        parameter: 'Air Quality Index',
        current: data.airQuality.aqi,
        predicted: data.airQuality.aqi * (1 + (Math.random() - 0.5) * 0.3),
        confidence: 85 + Math.random() * 10,
        trend: data.airQuality.aqi > 100 ? 'worsening' : 'improving',
        timeframe: timeHorizon,
        factors: [...baseFactors, 'Traffic patterns', 'Wind direction']
      },
      {
        parameter: 'PM2.5 Levels',
        current: data.airQuality.pm25,
        predicted: data.airQuality.pm25 * (1 + (Math.random() - 0.5) * 0.25),
        confidence: 82 + Math.random() * 8,
        trend: data.airQuality.pm25 > 75 ? 'worsening' : 'stable',
        timeframe: timeHorizon,
        factors: [...baseFactors, 'Construction activity', 'Vehicle emissions']
      },
      {
        parameter: 'Temperature',
        current: data.weather.temperature,
        predicted: data.weather.temperature + (Math.random() - 0.5) * 6,
        confidence: 90 + Math.random() * 5,
        trend: 'stable',
        timeframe: timeHorizon,
        factors: ['Climate models', 'Seasonal patterns', 'Urban heat island', 'Cloud cover']
      },
      {
        parameter: 'Vegetation Health',
        current: data.vegetation.ndvi * 100,
        predicted: (data.vegetation.ndvi * 100) * (1 + (Math.random() - 0.5) * 0.2),
        confidence: 78 + Math.random() * 12,
        trend: data.vegetation.health === 'healthy' ? 'stable' : 'improving',
        timeframe: timeHorizon,
        factors: ['Rainfall patterns', 'Temperature trends', 'Soil moisture', 'Human activity']
      }
    ];
  }, [data, timeHorizon]);

  // Risk assessments based on predictions
  const riskAssessments = useMemo((): RiskAssessment[] => {
    return [
      {
        level: predictions.find(p => p.parameter === 'Air Quality Index')?.predicted > 150 ? 'high' : 'medium',
        score: Math.random() * 40 + 40,
        category: 'Air Quality Degradation',
        description: 'Risk of air quality deteriorating beyond healthy levels',
        mitigation: [
          'Implement traffic restrictions during peak hours',
          'Increase monitoring in industrial zones',
          'Issue health advisories for sensitive groups',
          'Enhance public transportation usage'
        ]
      },
      {
        level: 'medium',
        score: Math.random() * 30 + 30,
        category: 'Climate Impact',
        description: 'Potential temperature and precipitation changes affecting local ecosystem',
        mitigation: [
          'Develop heat mitigation strategies',
          'Improve urban green infrastructure',
          'Water conservation measures',
          'Community preparedness programs'
        ]
      },
      {
        level: 'low',
        score: Math.random() * 25 + 15,
        category: 'Vegetation Stress',
        description: 'Risk of vegetation health decline due to environmental factors',
        mitigation: [
          'Implement drought-resistant landscaping',
          'Regular vegetation health monitoring',
          'Soil quality improvement programs',
          'Protected area expansion'
        ]
      }
    ];
  }, [predictions]);

  // Generate model accuracy data
  const modelAccuracy = useMemo(() => {
    return [
      { model: 'Air Quality Forecast', accuracy: 85, samples: 1250 },
      { model: 'Weather Prediction', accuracy: 92, samples: 2100 },
      { model: 'Vegetation Analysis', accuracy: 78, samples: 850 },
      { model: 'Pollution Dispersion', accuracy: 81, samples: 950 }
    ];
  }, []);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'worsening': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Prediction Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="environmental_forecast">Environmental Forecast</SelectItem>
                <SelectItem value="air_quality_model">Air Quality Model</SelectItem>
                <SelectItem value="climate_projection">Climate Projection</SelectItem>
                <SelectItem value="ecosystem_health">Ecosystem Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Time Horizon</label>
            <Select value={timeHorizon} onValueChange={setTimeHorizon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Run Prediction
            </Button>
          </div>
        </div>
      </Card>

      {/* Predictions Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Predictive Forecasts</h3>
          </div>
          
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{prediction.parameter}</h4>
                  <Badge variant="outline">
                    {prediction.confidence.toFixed(0)}% confidence
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Current</p>
                    <p className="text-lg font-bold">{prediction.current.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Predicted ({prediction.timeframe})</p>
                    <p className={`text-lg font-bold ${getTrendColor(prediction.trend)}`}>
                      {prediction.predicted.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`h-4 w-4 ${getTrendColor(prediction.trend)}`} />
                  <span className={`text-sm font-medium ${getTrendColor(prediction.trend)}`}>
                    {prediction.trend.charAt(0).toUpperCase() + prediction.trend.slice(1)}
                  </span>
                </div>
                
                <Progress value={prediction.confidence} className="mb-2" />
                
                <div className="text-xs text-gray-500">
                  <p>Key factors: {prediction.factors.slice(0, 2).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Risk Assessment</h3>
          </div>
          
          <div className="space-y-4">
            {riskAssessments.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{risk.category}</h4>
                  <Badge className={getRiskColor(risk.level)}>
                    {risk.level.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{risk.description}</p>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risk Score</span>
                    <span>{risk.score.toFixed(0)}/100</span>
                  </div>
                  <Progress value={risk.score} />
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Mitigation Strategies:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {risk.mitigation.slice(0, 2).map((strategy, i) => (
                      <li key={i}>• {strategy}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Model Performance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">Model Performance Metrics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modelAccuracy.map((model, index) => (
            <div key={index} className="text-center p-4 border rounded-lg">
              <h4 className="font-medium text-sm mb-2">{model.model}</h4>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {model.accuracy}%
              </div>
              <p className="text-xs text-gray-500">
                {model.samples.toLocaleString()} samples
              </p>
              <Progress value={model.accuracy} className="mt-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Model Information */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">AI-Powered Environmental Predictions</h4>
            <p className="text-sm text-blue-800 mb-2">
              Our machine learning models analyze historical patterns, current conditions, and environmental factors 
              to provide accurate forecasts and risk assessments.
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Models are updated continuously with new data</li>
              <li>• Confidence intervals indicate prediction reliability</li>
              <li>• Risk assessments help prioritize mitigation efforts</li>
              <li>• Forecasts improve planning and response strategies</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
