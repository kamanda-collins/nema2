
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataUploaderProps {
  onDataUploaded: (data: any) => void;
}

export const DataUploader: React.FC<DataUploaderProps> = ({ onDataUploaded }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    setUploadStatus('uploading');
    setUploadProgress(0);

    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('processing');
          
          // Simulate processing
          setTimeout(() => {
            const mockData = {
              id: Date.now(),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
              format: selectedFormat,
              rows: Math.floor(Math.random() * 10000) + 1000,
              columns: Math.floor(Math.random() * 20) + 5,
              preview: generateMockPreview(selectedFormat)
            };
            
            setUploadedFiles(prev => [...prev, mockData]);
            setUploadStatus('complete');
            onDataUploaded(mockData);
            
            toast({
              title: "Upload Complete",
              description: `${file.name} has been successfully processed`,
            });
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, [selectedFormat, onDataUploaded, toast]);

  const generateMockPreview = (format: string) => {
    if (format === 'csv' || format === 'excel') {
      return [
        { timestamp: '2024-01-01', latitude: 40.7589, longitude: -73.9851, ndvi: 0.65, temperature: 22.5 },
        { timestamp: '2024-01-02', latitude: 40.7589, longitude: -73.9851, ndvi: 0.67, temperature: 23.1 },
        { timestamp: '2024-01-03', latitude: 40.7589, longitude: -73.9851, ndvi: 0.69, temperature: 24.0 }
      ];
    } else if (format === 'geotiff') {
      return {
        bands: ['Red', 'Green', 'Blue', 'NIR'],
        resolution: '30m',
        projection: 'WGS84',
        extent: [-73.9851, 40.7589, -73.9751, 40.7689]
      };
    }
    return {};
  };

  const downloadTemplate = (format: string) => {
    const templates = {
      csv: 'timestamp,latitude,longitude,ndvi,temperature\n2024-01-01,40.7589,-73.9851,0.65,22.5',
      excel: 'Excel template with predefined columns',
      geotiff: 'GeoTIFF format specification',
      shapefile: 'Shapefile format specification'
    };
    
    const blob = new Blob([templates[format as keyof typeof templates]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template.${format === 'excel' ? 'xlsx' : format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: `${format.toUpperCase()} template downloaded successfully`,
    });
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'uploading':
      case 'processing': return <Upload className="h-5 w-5 text-blue-600 animate-pulse" />;
      default: return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading': return 'Uploading file...';
      case 'processing': return 'Processing data...';
      case 'complete': return 'Upload complete!';
      case 'error': return 'Upload failed';
      default: return 'Ready to upload';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Interface */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upload Your Data</h3>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="geotiff">GeoTIFF</SelectItem>
              <SelectItem value="shapefile">Shapefile</SelectItem>
              <SelectItem value="netcdf">NetCDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept={selectedFormat === 'csv' ? '.csv' : selectedFormat === 'excel' ? '.xlsx,.xls' : '.*'}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              {getStatusIcon()}
              <div>
                <p className="text-lg font-medium">{getStatusText()}</p>
                <p className="text-gray-600">
                  Drag and drop your {selectedFormat.toUpperCase()} file here, or click to browse
                </p>
              </div>
            </div>
          </label>
          
          {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">{uploadProgress}% complete</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => downloadTemplate(selectedFormat)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download {selectedFormat.toUpperCase()} Template
          </Button>
        </div>
      </Card>

      {/* Format Requirements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Data Format Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Time Series Data (CSV/Excel)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Required columns: timestamp, latitude, longitude</li>
              <li>• Optional: ndvi, evi, temperature, precipitation</li>
              <li>• Date format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS</li>
              <li>• Coordinate system: WGS84 (EPSG:4326)</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Raster Data (GeoTIFF)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Supported bands: RGB, NIR, SWIR, thermal</li>
              <li>• Projection: Any standard CRS</li>
              <li>• Bit depth: 8-bit, 16-bit, 32-bit</li>
              <li>• Max file size: 500MB</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {file.rows?.toLocaleString()} rows × {file.columns} columns • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {file.format.toUpperCase()}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
