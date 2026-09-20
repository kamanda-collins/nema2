import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { professionalExportService } from '@/services/professionalExportService';
import { Download, FileText, Map, Database, BarChart3, Settings, CheckCircle } from 'lucide-react';

interface ProfessionalExportPanelProps {
  data?: any;
  className?: string;
}

const ProfessionalExportPanel: React.FC<ProfessionalExportPanelProps> = ({ data, className }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [exportConfig, setExportConfig] = useState({
    title: 'Environmental Analysis Report',
    subtitle: '',
    organization: 'GeoLabs Environmental Solutions',
    author: '',
    dpi: 300,
    quality: 'high',
    includeMetadata: true,
    watermark: false,
    template: 'professional'
  });

  const { toast } = useToast();

  React.useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    try {
      const history = await professionalExportService.getExportHistory();
      setExportHistory(history);
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const handleExport = async (type: string, format: 'pdf' | 'png' | 'jpeg' | 'geotiff' | 'shapefile' | 'kml' | 'csv' | 'excel' | 'geojson') => {
    if (!data) {
      toast({
        title: "No Data Available",
        description: "Please load environmental data before exporting",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      let result;
      
      switch (type) {
        case 'map':
          result = await professionalExportService.exportHighResolutionMap(data, {
            ...exportConfig,
            format
          });
          break;
        case 'report':
          result = await professionalExportService.generateEnvironmentalReport(data, {
            ...exportConfig,
            format
          });
          break;
        case 'data':
          result = await professionalExportService.exportData(data, format, exportConfig);
          break;
        case 'analysis':
          result = await professionalExportService.exportAnalysis(data, format, exportConfig);
          break;
      }

      if (result) {
        await loadExportHistory();
        
        toast({
          title: "Export Successful",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} exported as ${format.toUpperCase()}`,
        });

        // In a real implementation, you would trigger the download here
        // window.open(result.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchExport = async () => {
    if (!data) return;

    const formats: ('pdf' | 'excel' | 'png')[] = ['pdf', 'excel', 'png'];
    setIsExporting(true);

    try {
      const exports = formats.map(format => ({
        data,
        format,
        filename: `environmental_analysis_${Date.now()}`
      }));

      await professionalExportService.batchExport(exports);
      await loadExportHistory();

      toast({
        title: "Batch Export Complete",
        description: `Exported in ${formats.length} formats: ${formats.join(', ').toUpperCase()}`,
      });
    } catch (error) {
      console.error('Batch export failed:', error);
      toast({
        title: "Batch Export Failed",
        description: "Failed to perform batch export",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderMapExports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { format: 'png' as const, label: 'PNG Image', description: 'High-resolution raster' },
          { format: 'pdf' as const, label: 'PDF Map', description: 'Print-ready vector' },
          { format: 'jpeg' as const, label: 'JPEG Image', description: 'Compressed raster' },
          { format: 'geotiff' as const, label: 'GeoTIFF', description: 'Georeferenced raster' }
        ].map(option => (
          <Card key={option.format} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-2">
                <Map className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExport('map', option.format)}
                  disabled={isExporting}
                  className="w-full"
                >
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReportExports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Professional Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleExport('report', 'pdf')}
              disabled={isExporting}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF Report
            </Button>
            <Button
              onClick={() => handleExport('report', 'excel')}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Excel Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Analysis Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleExport('analysis', 'pdf')}
              disabled={isExporting}
              className="w-full"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analysis PDF
            </Button>
            <Button
              onClick={() => handleExport('analysis', 'excel')}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Analysis Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDataExports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { format: 'csv' as const, label: 'CSV Data', description: 'Comma-separated values' },
          { format: 'excel' as const, label: 'Excel Workbook', description: 'Microsoft Excel format' },
          { format: 'geojson' as const, label: 'GeoJSON', description: 'Spatial data format' },
          { format: 'shapefile' as const, label: 'Shapefile', description: 'ESRI shapefile format' },
          { format: 'kml' as const, label: 'KML', description: 'Google Earth format' }
        ].map(option => (
          <Card key={option.format} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-2">
                <Database className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExport('data', option.format)}
                  disabled={isExporting}
                  className="w-full"
                >
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderExportSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={exportConfig.title}
                onChange={(e) => setExportConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={exportConfig.subtitle}
                onChange={(e) => setExportConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Optional subtitle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={exportConfig.organization}
                onChange={(e) => setExportConfig(prev => ({ ...prev, organization: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={exportConfig.author}
                onChange={(e) => setExportConfig(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Report author"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dpi">DPI Quality</Label>
              <Select
                value={exportConfig.dpi.toString()}
                onValueChange={(value) => setExportConfig(prev => ({ ...prev, dpi: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 DPI (Draft)</SelectItem>
                  <SelectItem value="150">150 DPI (Standard)</SelectItem>
                  <SelectItem value="300">300 DPI (High Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">Export Quality</Label>
              <Select
                value={exportConfig.quality}
                onValueChange={(value) => setExportConfig(prev => ({ ...prev, quality: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="publication">Publication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={exportConfig.template}
                onValueChange={(value) => setExportConfig(prev => ({ ...prev, template: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="metadata"
                checked={exportConfig.includeMetadata}
                onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeMetadata: checked }))}
              />
              <Label htmlFor="metadata">Include Metadata</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="watermark"
                checked={exportConfig.watermark}
                onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, watermark: checked }))}
              />
              <Label htmlFor="watermark">Add Watermark</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batch Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Export data in multiple formats simultaneously (PDF, Excel, PNG)
          </p>
          <Button
            onClick={handleBatchExport}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Formats
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderExportHistory = () => (
    <Card>
      <CardHeader>
        <CardTitle>Export History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exportHistory.length > 0 ? (
            exportHistory.map((export_item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">{export_item.analysis_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(export_item.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="default">
                    {export_item.status}
                  </Badge>
                  {export_item.results?.fileSize && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(export_item.results.fileSize / 1024 / 1024 * 100) / 100} MB
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No export history available
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
          <Download className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Professional Export</h2>
            <p className="text-muted-foreground">
              High-quality exports for presentations and compliance
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="maps" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="maps">Maps</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="maps">
          {renderMapExports()}
        </TabsContent>
        
        <TabsContent value="reports">
          {renderReportExports()}
        </TabsContent>
        
        <TabsContent value="data">
          {renderDataExports()}
        </TabsContent>
        
        <TabsContent value="settings">
          {renderExportSettings()}
        </TabsContent>
        
        <TabsContent value="history">
          {renderExportHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessionalExportPanel;