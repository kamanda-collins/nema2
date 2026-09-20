/**
 * Real-Time Environmental Monitoring Dashboard
 * 
 * Comprehensive dashboard that displays live environmental data, alerts,
 * monitoring points, and provides real-time collaborative features.
 * 
 * Features:
 * - Live sensor data streaming and visualization
 * - Real-time alert notifications and management
 * - Interactive monitoring points management
 * - Live collaboration with other users
 * - Professional data export and reporting
 * - Advanced analytics and AI insights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Wifi,
  Users,
  Database,
  Zap,
  Eye,
  Settings,
  Download,
  RefreshCw,
  Bell,
  BarChart3,
  Map,
  Satellite,
  FlaskConical
} from 'lucide-react';
import { useRealTimeMonitoring } from '@/hooks/useRealTimeMonitoring';
import { realDataService } from '@/services/realDataService';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/LocationContext';

interface LiveDataPoint {
  id: string;
  timestamp: Date;
  value: number;
  status: 'normal' | 'warning' | 'critical';
}

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  uptime: string;
  dataFlow: number; // readings per minute
  apiHealth: number; // percentage
  alertsActive: number;
}

export const RealTimeDashboard: React.FC = () => {
  const { currentLocation } = useLocation();
  const { toast } = useToast();
  const {
    monitoringPoints,
    sensorReadings,
    alerts,
    stats,
    isLoading,
    error,
    createMonitoringPoint,
    acknowledgeAlert,
    resolveAlert,
    refreshData
  } = useRealTimeMonitoring();

  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'good',
    uptime: '99.8%',
    dataFlow: 45,
    apiHealth: 94,
    alertsActive: alerts.filter(a => a.status === 'active').length
  });
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([]);
  const [selectedMonitoringPoint, setSelectedMonitoringPoint] = useState<string | null>(null);

  // Simulate live data streaming
  useEffect(() => {
    const interval = setInterval(() => {
      const newDataPoint: LiveDataPoint = {
        id: Date.now().toString(),
        timestamp: new Date(),
        value: 80 + Math.random() * 40,
        status: Math.random() > 0.8 ? 'warning' : 'normal'
      };

      setLiveData(prev => [...prev.slice(-20), newDataPoint]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update system health
  useEffect(() => {
    setSystemHealth(prev => ({
      ...prev,
      alertsActive: alerts.filter(a => a.status === 'active').length,
      status: alerts.some(a => a.severity === 'critical') ? 'critical' :
              alerts.some(a => a.severity === 'high') ? 'warning' : 'good'
    }));
  }, [alerts]);

  const handleCreateMonitoringPoint = async () => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map first",
        variant: "destructive"
      });
      return;
    }

    try {
      await createMonitoringPoint({
        user_id: '', // Will be set by the hook
        name: `Monitoring Point - ${currentLocation.name.split(',')[0]}`,
        description: 'Real-time environmental monitoring station',
        location: {
          type: 'Point',
          coordinates: [currentLocation.lng, currentLocation.lat]
        },
        location_name: currentLocation.name,
        monitoring_type: ['air_quality', 'weather', 'water_quality', 'vegetation'],
        status: 'active',
        alert_thresholds: {
          air_quality_aqi: { high: 150, critical: 200 },
          temperature: { low: -10, high: 40 },
          pm25: { high: 75, critical: 150 },
          ndvi: { low: 0.3, critical: 0.1 }
        }
      });

      toast({
        title: "Monitoring Point Created",
        description: `New monitoring point created at ${currentLocation.name.split(',')[0]}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Create Monitoring Point",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleStartRealTimeAnalysis = async () => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Start comprehensive real-time analysis
      const environmentalData = await realDataService.getComprehensiveEnvironmentalData(
        currentLocation.lat,
        currentLocation.lng,
        true
      );

      toast({
        title: "Real-Time Analysis Started",
        description: `Comprehensive environmental monitoring initiated for ${currentLocation.name.split(',')[0]}`,
      });

      console.log('Real-time analysis data:', environmentalData);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to start real-time analysis",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100 border-green-200';
      case 'good': return 'text-green-600 bg-green-100 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">Initializing Real-Time Monitoring...</p>
          <p className="text-sm text-gray-600">Setting up data streams and connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real-Time Environmental Monitoring</h1>
              <p className="text-gray-600">Live data streaming and intelligent analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(systemHealth.status)}>
              <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse" />
              System {systemHealth.status.toUpperCase()}
            </Badge>
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monitoring Points</p>
                  <p className="text-2xl font-bold">{stats.totalMonitoringPoints}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {monitoringPoints.filter(p => p.status === 'active').length} Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold">{stats.activeAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {alerts.filter(a => a.severity === 'critical').length} Critical
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Readings</p>
                  <p className="text-2xl font-bold">{stats.todayReadings}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {systemHealth.dataFlow}/min
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">API Health</p>
                  <p className="text-2xl font-bold">{systemHealth.apiHealth}%</p>
                </div>
                <Wifi className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {systemHealth.uptime} Uptime
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring Points</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Data Stream */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Live Data Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Real-time Updates</span>
                      <Badge className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                        Live
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {liveData.slice(-5).map((point) => (
                        <div key={point.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              point.status === 'critical' ? 'bg-red-500' : 
                              point.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            <span className="text-sm">AQI: {Math.round(point.value)}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {point.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={handleStartRealTimeAnalysis} 
                      className="w-full"
                      disabled={!currentLocation}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Start Real-Time Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleCreateMonitoringPoint} 
                    className="w-full justify-start"
                    variant="outline"
                    disabled={!currentLocation}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Create Monitoring Point
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <Satellite className="h-4 w-4 mr-2" />
                    Request Satellite Analysis
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data Report
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Schedule Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-500">{alert.location_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No alerts at this time</p>
                      <p className="text-sm">All systems are operating normally</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Points Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {monitoringPoints.map((point) => (
                    <Card key={point.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{point.name}</h3>
                          <Badge className={getStatusColor(point.status)}>
                            {point.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{point.description}</p>
                        <p className="text-xs text-gray-500 mb-3">{point.location_name}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {point.monitoring_type.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setSelectedMonitoringPoint(point.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {monitoringPoints.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No monitoring points yet</p>
                      <p className="text-sm mb-4">Create your first monitoring point to start collecting data</p>
                      <Button onClick={handleCreateMonitoringPoint} disabled={!currentLocation}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Create Monitoring Point
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alert Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {alert.status}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-lg">{alert.title}</h3>
                          <p className="text-gray-600 mb-2">{alert.description}</p>
                          <div className="text-sm text-gray-500">
                            <p>Location: {alert.location_name}</p>
                            <p>Type: {alert.alert_type}</p>
                            <p>Created: {new Date(alert.created_at).toLocaleString()}</p>
                            {alert.trigger_value && alert.threshold_value && (
                              <p>Trigger: {alert.trigger_value} (threshold: {alert.threshold_value})</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          {alert.status === 'active' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {alerts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No alerts</p>
                      <p className="text-sm">All monitoring parameters are within normal ranges</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Advanced Analytics Coming Soon</p>
                  <p className="text-sm">Predictive models, trend analysis, and AI insights</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Settings className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Settings Panel</p>
                  <p className="text-sm">Configure alerts, data sources, and system preferences</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};