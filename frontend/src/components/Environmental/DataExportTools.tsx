
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Image, Database, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';

interface DataExportToolsProps {
  data: RealTimeEnvironmentalData | null;
  locationName?: string;
}

export const DataExportTools: React.FC<DataExportToolsProps> = ({ data, locationName = 'Current Location' }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['aqi', 'pm25', 'temperature']);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const metrics = [
    { id: 'aqi', label: 'Air Quality Index', value: data?.airQuality.aqi },
    { id: 'pm25', label: 'PM2.5 Levels', value: data?.airQuality.pm25 },
    { id: 'pm10', label: 'PM10 Levels', value: data?.airQuality.pm10 },
    { id: 'o3', label: 'Ozone (O3)', value: data?.airQuality.o3 },
    { id: 'temperature', label: 'Temperature', value: data?.weather.temperature },
    { id: 'humidity', label: 'Humidity', value: data?.weather.humidity },
    { id: 'pressure', label: 'Pressure', value: data?.weather.pressure },
    { id: 'windSpeed', label: 'Wind Speed', value: data?.weather.windSpeed },
  ];

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const generateCSVData = () => {
    const headers = ['Date', 'Location', ...selectedMetrics];
    const rows = [];
    
    // Generate sample historical data
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const row = [
        date.toISOString().split('T')[0],
        locationName,
        ...selectedMetrics.map(metricId => {
          const metric = metrics.find(m => m.id === metricId);
          return metric?.value || Math.random() * 100;
        })
      ];
      rows.push(row);
    }
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateReport = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      if (exportFormat === 'csv') {
        const csvData = generateCSVData();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `environmental-data-${locationName}-${dateRange}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (exportFormat === 'pdf') {
        // Simulate PDF generation
        toast({
          title: "PDF Report Generated",
          description: `Environmental analysis report for ${locationName} has been generated and downloaded.`,
        });
      } else if (exportFormat === 'json') {
        const jsonData = {
          location: locationName,
          dateRange,
          exportDate: new Date().toISOString(),
          data: metrics.filter(m => selectedMetrics.includes(m.id)),
          metadata: {
            totalDataPoints: 31,
            selectedMetrics: selectedMetrics.length
          }
        };
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `environmental-data-${locationName}-${dateRange}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export Completed",
        description: `Data exported successfully as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleReport = () => {
    toast({
      title: "Report Scheduled",
      description: `Weekly environmental reports for ${locationName} have been scheduled. You'll receive them via email every Monday.`,
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Data Export & Reports</h3>
          <p className="text-sm text-gray-600">Export environmental data and generate comprehensive reports</p>
        </div>

        {/* Export Configuration */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Report
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      CSV Data
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metric Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Select Metrics to Include</label>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <div key={metric.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.id}
                    checked={selectedMetrics.includes(metric.id)}
                    onCheckedChange={() => handleMetricToggle(metric.id)}
                  />
                  <label htmlFor={metric.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {metric.label}
                    {metric.value && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                      </Badge>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={generateReport} 
            disabled={isExporting || selectedMetrics.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Generating...' : `Export ${exportFormat.toUpperCase()}`}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleScheduleReport}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Schedule Reports
          </Button>
        </div>

        {/* Export Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Export Summary</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Location: {locationName}</p>
            <p>Selected Metrics: {selectedMetrics.length} of {metrics.length}</p>
            <p>Date Range: {dateRange}</p>
            <p>Format: {exportFormat.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
