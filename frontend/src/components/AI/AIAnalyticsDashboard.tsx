import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { aiAnalyticsService } from '@/services/aiAnalyticsService';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter } from 'recharts';

interface AIAnalyticsDashboardProps {
  environmentalData?: any;
  className?: string;
}

const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({ environmentalData, className }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string>('anomaly_detection');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  useEffect(() => {
    if (environmentalData) {
      generateIntelligence();
    }
  }, [environmentalData]);

  const loadAnalysisHistory = async () => {
    try {
      const history = await aiAnalyticsService.getAnalysisHistory();
      setAnalysisHistory(history);
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const generateIntelligence = async () => {
    if (!environmentalData) return;

    try {
      const intelligenceResult = await aiAnalyticsService.generateEnvironmentalIntelligence(environmentalData);
      setIntelligence(intelligenceResult);
    } catch (error) {
      console.error('Failed to generate intelligence:', error);
    }
  };

  const performAnalysis = async (analysisType: string) => {
    if (!environmentalData?.timeSeries) {
      toast({
        title: "Data Required",
        description: "Environmental time series data is required for AI analysis",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setActiveAnalysis(analysisType);

    try {
      let result;
      
      switch (analysisType) {
        case 'anomaly_detection':
          result = await aiAnalyticsService.detectAnomalies(environmentalData.timeSeries);
          break;
        case 'predictive_modeling':
          result = await aiAnalyticsService.generatePredictions(environmentalData.timeSeries);
          break;
        case 'pattern_recognition':
          result = await aiAnalyticsService.recognizePatterns(environmentalData.timeSeries);
          break;
        case 'risk_assessment':
          result = await aiAnalyticsService.assessRisk(environmentalData);
          break;
        case 'trend_analysis':
          result = await aiAnalyticsService.analyzeTrends(environmentalData.timeSeries);
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      setAnalysisResults(result);
      await loadAnalysisHistory();

      toast({
        title: "Analysis Complete",
        description: `AI ${analysisType.replace('_', ' ')} completed successfully`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to perform AI analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAnomalyDetection = () => {
    if (!analysisResults?.anomalies) return null;

    const severityColors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308'
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Total Anomalies</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analysisResults.summary.totalAnomalies}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Critical</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analysisResults.summary.criticalAnomalies}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Anomaly Rate</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analysisResults.summary.anomalyRate.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Threshold</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analysisResults.summary.detectionThreshold}σ</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResults.anomalies.map((anomaly: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(anomaly.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Value: {anomaly.value.toFixed(2)} (Z-Score: {anomaly.zScore})
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}
                      style={{ backgroundColor: severityColors[anomaly.severity as keyof typeof severityColors] }}
                    >
                      {anomaly.severity} {anomaly.type}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(anomaly.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPredictiveModeling = () => {
    if (!analysisResults?.predictions) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Model Accuracy</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {Math.round(analysisResults.model.accuracy * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Trend Direction</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {analysisResults.model.trendDirection}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Risk Level</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {analysisResults.insights.riskLevel}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analysisResults.predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stackId="1" 
                  stroke="none" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.1} 
                />
                <Area 
                  type="monotone" 
                  dataKey="lowerBound" 
                  stackId="1" 
                  stroke="none" 
                  fill="white" 
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedValue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRiskAssessment = () => {
    if (!analysisResults?.riskFactors) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <span className="text-2xl font-bold text-primary">
                  {analysisResults.overallRiskScore.toFixed(1)}
                </span>
              </div>
              <h3 className="text-lg font-medium">Overall Risk Score</h3>
              <Badge 
                variant={analysisResults.riskLevel === 'high' ? 'destructive' : 
                        analysisResults.riskLevel === 'medium' ? 'secondary' : 'default'}
              >
                {analysisResults.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResults.riskFactors.map((factor: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{factor.category}</span>
                      <Badge variant={factor.score > 6 ? 'destructive' : 'secondary'}>
                        {factor.score.toFixed(1)}
                      </Badge>
                    </div>
                    <Progress value={(factor.score / 10) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {factor.factors.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysisResults.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderIntelligenceDashboard = () => {
    if (!intelligence) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Environmental Intelligence Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{Math.round(intelligence.confidence * 100)}%</p>
                <p className="text-sm text-muted-foreground">Overall Confidence</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{intelligence.dataQuality.level.toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">Data Quality</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{Object.keys(intelligence.analyses).length}</p>
                <p className="text-sm text-muted-foreground">Analyses Performed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Key Insights</h4>
                <div className="space-y-1">
                  {intelligence.insights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Action Items</h4>
                <div className="space-y-1">
                  {intelligence.actionItems.map((item: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">AI Analytics</h2>
            <p className="text-muted-foreground">
              Advanced artificial intelligence for environmental insights
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { key: 'anomaly_detection', label: 'Anomaly Detection', icon: AlertTriangle },
          { key: 'predictive_modeling', label: 'Predictions', icon: TrendingUp },
          { key: 'pattern_recognition', label: 'Patterns', icon: BarChart3 },
          { key: 'risk_assessment', label: 'Risk Assessment', icon: Target },
          { key: 'trend_analysis', label: 'Trends', icon: Zap }
        ].map(analysis => {
          const Icon = analysis.icon;
          return (
            <Button
              key={analysis.key}
              onClick={() => performAnalysis(analysis.key)}
              disabled={isLoading}
              variant={activeAnalysis === analysis.key ? 'default' : 'outline'}
              className="h-auto p-3 flex flex-col items-center space-y-1"
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{analysis.label}</span>
            </Button>
          );
        })}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Brain className="h-5 w-5 animate-pulse text-primary" />
              <div className="flex-1">
                <p className="font-medium">Processing AI Analysis...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing data with advanced machine learning algorithms
                </p>
              </div>
            </div>
            <Progress value={Math.random() * 100} className="mt-3" />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="intelligence" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="intelligence">
          {renderIntelligenceDashboard()}
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          {analysisResults ? (
            <div>
              {activeAnalysis === 'anomaly_detection' && renderAnomalyDetection()}
              {activeAnalysis === 'predictive_modeling' && renderPredictiveModeling()}
              {activeAnalysis === 'risk_assessment' && renderRiskAssessment()}
              {(activeAnalysis === 'pattern_recognition' || activeAnalysis === 'trend_analysis') && (
                <Card>
                  <CardHeader>
                    <CardTitle>{activeAnalysis.replace('_', ' ').toUpperCase()} Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(analysisResults, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No Analysis Results</p>
                <p className="text-muted-foreground">
                  Select an analysis type above to begin AI analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisHistory.length > 0 ? (
                  analysisHistory.slice(0, 10).map((analysis, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{analysis.analysis_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(analysis.started_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'}>
                        {analysis.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No analysis history available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalyticsDashboard;