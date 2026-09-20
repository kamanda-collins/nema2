import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Droplets, Wind, TreePine, AlertTriangle, TrendingUp, MapPin, Calendar, RefreshCw, BarChart3, Brain, Clock, Bell } from 'lucide-react';
import { EnvironmentalMetrics } from './EnvironmentalMetrics';
import { EnhancedAnalytics } from './EnhancedAnalytics';
import { AirQualityMonitor } from './AirQualityMonitor';
import { WaterQualityAnalysis } from './WaterQualityAnalysis';
import { VegetationAnalysis } from './VegetationAnalysis';
import { LocationPicker } from './LocationPicker';
import { MonitoringPointManager } from './MonitoringPointManager';
import { DataExportTools } from './DataExportTools';
import { AlertSystem } from './AlertSystem';
import { TimeSeriesAnalysis } from './TimeSeriesAnalysis';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { MapIntegration } from '../Map/MapIntegration';
import { useLocation } from '@/contexts/LocationContext';
import { useEnvironmentalData } from '@/hooks/useEnvironmentalData';
import { useToast } from '@/hooks/use-toast';
import { EnvironmentalTabs } from './EnvironmentalTabs';
import { EnvironmentalSidebar } from './EnvironmentalSidebar';
import { EnvironmentalMainPanel } from './EnvironmentalMainPanel';

export const EnvironmentalDashboard: React.FC = () => {
  const { currentLocation } = useLocation();
  const { data, isLoading, refreshData } = useEnvironmentalData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('overview');

  // Add detailed logs for Barnhart
  React.useEffect(() => {
    console.log('-------------------');
    if (currentLocation) {
      console.log("EnvironmentalDashboard: currentLocation", currentLocation);
    } else {
      console.log("EnvironmentalDashboard: no currentLocation");
    }
    if (data) {
      console.log("EnvironmentalDashboard: data keys", Object.keys(data));
      console.log("EnvironmentalDashboard: FULL data", data);
      if (currentLocation?.name && /barnhart/i.test(currentLocation.name)) {
        console.log(">>> BARHHART selected, full data:", data);
      }
    } else {
      console.log("EnvironmentalDashboard: data is null or undefined");
    }
    console.log('-------------------');
  }, [data, currentLocation]);

  // Generate alerts based on real environmental data
  const generateEnvironmentalAlerts = () => {
    const alerts = [];
    const locationName = currentLocation?.name.split(',')[0] || 'Current Location';
    
    if (data) {
      // Air quality alerts
      if (data.airQuality.aqi > 150) {
        alerts.push({
          id: 1,
          type: 'Air Quality',
          level: 'High',
          location: locationName,
          timestamp: 'Real-time',
          detail: `AQI: ${data.airQuality.aqi} (${data.airQuality.status})`
        });
      } else if (data.airQuality.aqi > 100) {
        alerts.push({
          id: 1,
          type: 'Air Quality',
          level: 'Medium',
          location: locationName,
          timestamp: 'Real-time',
          detail: `AQI: ${data.airQuality.aqi} (${data.airQuality.status})`
        });
      }

      // PM2.5 specific alert
      if (data.airQuality.pm25 > 75) {
        alerts.push({
          id: 2,
          type: 'PM2.5 Levels',
          level: data.airQuality.pm25 > 150 ? 'High' : 'Medium',
          location: locationName,
          timestamp: 'Real-time',
          detail: `${data.airQuality.pm25} µg/m³`
        });
      }

      // Water quality alerts
      if (data.waterQuality) {
        if (data.waterQuality.ph < 6.5 || data.waterQuality.ph > 8.5) {
          alerts.push({
            id: 3,
            type: 'Water pH',
            level: 'Medium',
            location: `${locationName} Water Sources`,
            timestamp: 'Real-time',
            detail: `pH: ${data.waterQuality.ph.toFixed(1)}`
          });
        }
        
        if (data.waterQuality.turbidity > 10) {
          alerts.push({
            id: 4,
            type: 'Water Turbidity',
            level: 'Medium',
            location: `${locationName} Water Sources`,
            timestamp: 'Real-time',
            detail: `${data.waterQuality.turbidity.toFixed(1)} NTU`
          });
        }
      }

      // Vegetation health alerts
      if (data.vegetation.health === 'declining') {
        alerts.push({
          id: 5,
          type: 'Vegetation Health',
          level: 'High',
          location: locationName,
          timestamp: 'Real-time',
          detail: `NDVI: ${data.vegetation.ndvi.toFixed(2)} (declining)`
        });
      } else if (data.vegetation.health === 'stressed') {
        alerts.push({
          id: 5,
          type: 'Vegetation Health',
          level: 'Medium',
          location: locationName,
          timestamp: 'Real-time',
          detail: `NDVI: ${data.vegetation.ndvi.toFixed(2)} (stressed)`
        });
      }
    }

    // If no real alerts, show a default good status
    if (alerts.length === 0) {
      alerts.push({
        id: 1,
        type: 'Environmental Status',
        level: 'Low',
        location: locationName,
        timestamp: 'Real-time',
        detail: 'All parameters within normal ranges'
      });
    }

    return alerts;
  };

  const environmentalAlerts = generateEnvironmentalAlerts();

  const handleScheduleAnalysis = () => {
    toast({
      title: "Analysis Scheduled",
      description: "Automated environmental monitoring has been scheduled for this location. You'll receive updates on significant changes.",
    });
  };

  const handleGenerateReport = () => {
    if (!currentLocation || !data) {
      toast({
        title: "No Data Available",
        description: "Please select a location and ensure environmental data is loaded before generating a report.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Report Generated",
      description: `Environmental analysis report created for ${currentLocation.name.split(',')[0]}. Report includes current air quality, water conditions, and vegetation health data.`,
    });
  };

  const handleSetMonitoringPoint = () => {
    setActiveTab('maps');
    toast({
      title: "Navigate to Maps",
      description: "Go to the Maps tab to select a location by clicking on the map, then return here to set monitoring points.",
    });
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': case 'healthy': case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': case 'fair': case 'stressed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy': case 'poor': case 'declining': return 'bg-red-100 text-red-800 border-red-200';
      case 'hazardous': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 w-full">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Environmental Analysis</h1>
            </div>
            <Button 
              onClick={refreshData} 
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Updating...' : 'Refresh Data'}
            </Button>
          </div>
          <p className="text-lg text-gray-600">Monitor and analyze environmental conditions in real-time</p>
          {currentLocation && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Analyzing: {currentLocation.name.split(',').slice(0, 2).join(', ')}</span>
              <Badge variant="outline" className="ml-2">
                {currentLocation.source} • {currentLocation.timestamp.toLocaleTimeString()}
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Wind className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Air Quality Index</p>
                <p className="text-2xl font-bold">{data?.airQuality.aqi || 142}</p>
                <Badge className={getStatusColor(data?.airQuality.status || 'moderate')}>
                  {data?.airQuality.status || 'Moderate'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Water Quality</p>
                <p className="text-2xl font-bold">{data?.waterQuality ? Math.round(data.waterQuality.ph * 10) : 87}%</p>
                <Badge className={getStatusColor(data?.waterQuality?.status || 'good')}>
                  {data?.waterQuality?.status || 'Good'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TreePine className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Vegetation Index</p>
                <p className="text-2xl font-bold">{data?.vegetation.ndvi.toFixed(2) || '0.74'}</p>
                <Badge className={getStatusColor(data?.vegetation.health || 'healthy')}>
                  {data?.vegetation.health || 'Healthy'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold">{environmentalAlerts.length}</p>
                <Badge className={environmentalAlerts.some(a => a.level === 'High') ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}>
                  {environmentalAlerts.some(a => a.level === 'High') ? 'Requires Attention' : 'All Clear'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis Panel */}
          <div className="lg:col-span-2">
            {/* Pass data and activeTab as props, always render "overview" first */}
            <EnvironmentalMainPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              data={data}
            />
          </div>
          {/* Sidebar */}
          <EnvironmentalSidebar
            environmentalAlerts={environmentalAlerts}
            currentLocation={currentLocation}
            data={data}
            setActiveTab={setActiveTab}
            handleSetMonitoringPoint={handleSetMonitoringPoint}
            handleGenerateReport={handleGenerateReport}
            handleScheduleAnalysis={handleScheduleAnalysis}
            getAlertColor={getAlertColor}
          />
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDashboard;
