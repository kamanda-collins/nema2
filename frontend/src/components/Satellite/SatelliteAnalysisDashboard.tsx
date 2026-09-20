import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { satelliteAnalysisService } from '@/services/satelliteAnalysisService';
import { Satellite, TrendingUp, MapPin, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface SatelliteAnalysisDashboardProps {
  className?: string;
}

const SatelliteAnalysisDashboard: React.FC<SatelliteAnalysisDashboardProps> = ({ className }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string>('ndvi');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  
  const { currentLocation } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (currentLocation) {
      loadAnalysisHistory();
    }
  }, [currentLocation]);

  const loadAnalysisHistory = async () => {
    if (!currentLocation) return;
    
    try {
      const history = await satelliteAnalysisService.getAnalysisHistory(
        currentLocation.lat,
        currentLocation.lng
      );
      setAnalysisHistory(history);
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const performAnalysis = async (analysisType: string) => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location to perform satellite analysis",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setActiveAnalysis(analysisType);

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await satelliteAnalysisService.performAnalysis({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        startDate,
        endDate,
        analysisType: analysisType as any,
        satellite: 'sentinel'
      });

      setAnalysisData(result);
      await loadAnalysisHistory();

      toast({
        title: "Analysis Complete",
        description: `${analysisType.toUpperCase()} analysis completed successfully`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to perform satellite analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateComprehensiveReport = async () => {
    if (!currentLocation) return;

    setIsLoading(true);
    try {
      const report = await satelliteAnalysisService.generateSatelliteReport(
        currentLocation.lat,
        currentLocation.lng,
        {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      );

      toast({
        title: "Report Generated",
        description: "Comprehensive satellite analysis report has been generated",
      });

      // Here you would typically trigger a download or display the report
      console.log('Generated report:', report);
    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate comprehensive report",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderNDVIAnalysis = () => {
    if (!analysisData?.results?.timeSeries) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Average NDVI</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {analysisData.results.summary?.averageNDVI?.toFixed(3) || 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Vegetation Health: {analysisData.results.summary?.averageNDVI > 0.7 ? 'Excellent' : 
                                   analysisData.results.summary?.averageNDVI > 0.5 ? 'Good' : 'Concerning'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Trend</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {analysisData.results.summary?.trend || 'Stable'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {analysisData.results.timeSeries.length} data points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Variation</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {analysisData.results.summary?.seasonalVariation?.toFixed(3) || 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Seasonal range
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>NDVI Time Series</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysisData.results.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip 
                  formatter={(value: any) => [value.toFixed(3), 'NDVI']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="ndvi" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderChangeDetection = () => {
    if (!analysisData?.results?.changes) return null;

    const changeData = analysisData.results.changes.map((change: any, index: number) => ({
      name: change.change_type.replace('_', ' ').toUpperCase(),
      value: change.change_percentage,
      area: change.affected_area_km2,
      color: `hsl(${index * 60}, 70%, 50%)`
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Changes Detected</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {analysisData.results.changes.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total affected area: {analysisData.results.summary?.totalAffectedArea?.toFixed(2) || 0} km²
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Major Change</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {analysisData.results.summary?.majorChangeType?.replace('_', ' ').toUpperCase() || 'None'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Confidence: {Math.round((analysisData.results.summary?.averageConfidence || 0) * 100)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {changeData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={changeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    >
                      {changeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Change']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detected Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisData.results.changes.map((change: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {change.change_type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {change.affected_area_km2.toFixed(2)} km² affected
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={change.change_percentage > 10 ? 'destructive' : 'secondary'}>
                          {change.change_percentage.toFixed(1)}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(change.confidence * 100)}% confident
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderAnalysisHistory = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Analysis History</span>
        </CardTitle>
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
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Satellite className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Satellite Analysis</h2>
            <p className="text-muted-foreground">
              Advanced remote sensing and change detection
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={generateComprehensiveReport}
            disabled={isLoading}
            variant="outline"
          >
            Generate Report
          </Button>
        </div>
      </div>

      {currentLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Analysis Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { key: 'ndvi', label: 'NDVI', description: 'Vegetation Health' },
          { key: 'change_detection', label: 'Change Detection', description: 'Land Cover Changes' },
          { key: 'land_cover', label: 'Land Cover', description: 'Classification' },
          { key: 'water_quality', label: 'Water Quality', description: 'Aquatic Assessment' },
          { key: 'thermal', label: 'Thermal', description: 'Temperature Analysis' }
        ].map(analysis => (
          <Button
            key={analysis.key}
            onClick={() => performAnalysis(analysis.key)}
            disabled={isLoading}
            variant={activeAnalysis === analysis.key ? 'default' : 'outline'}
            className="h-auto p-3 flex flex-col items-center space-y-1"
          >
            <span className="font-medium">{analysis.label}</span>
            <span className="text-xs opacity-70">{analysis.description}</span>
          </Button>
        ))}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Satellite className="h-5 w-5 animate-pulse text-primary" />
              <div className="flex-1">
                <p className="font-medium">Processing Satellite Analysis...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing satellite imagery for {activeAnalysis.replace('_', ' ')}
                </p>
              </div>
            </div>
            <Progress value={Math.random() * 100} className="mt-3" />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-6">
          {analysisData ? (
            <div>
              {activeAnalysis === 'ndvi' && renderNDVIAnalysis()}
              {activeAnalysis === 'change_detection' && renderChangeDetection()}
              {(activeAnalysis === 'land_cover' || activeAnalysis === 'water_quality' || activeAnalysis === 'thermal') && (
                <Card>
                  <CardHeader>
                    <CardTitle>{activeAnalysis.replace('_', ' ').toUpperCase()} Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(analysisData.results, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Satellite className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No Analysis Results</p>
                <p className="text-muted-foreground">
                  Select an analysis type above to begin satellite analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          {renderAnalysisHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SatelliteAnalysisDashboard;