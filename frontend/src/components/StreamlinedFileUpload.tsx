import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileType, Loader2, MapPin, FileJson, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamlinedFileUploadProps {
  onShapefileLoad: (geoJSON: any, filename: string) => void;
}

export const StreamlinedFileUpload = ({ onShapefileLoad }: StreamlinedFileUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    // Supported file types
    const supportedTypes = ['geojson', 'json', 'kml', 'gpx', 'csv'];
    if (!supportedTypes.includes(fileExtension || '')) {
      toast({
        title: "Unsupported File",
        description: `Supported formats: ${supportedTypes.join(', ').toUpperCase()}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const text = await file.text();
      let geoJSON;

      switch (fileExtension) {
        case 'geojson':
        case 'json':
          geoJSON = JSON.parse(text);
          break;
        case 'kml':
          geoJSON = await convertKmlToGeoJSON(text);
          break;
        case 'gpx':
          geoJSON = await convertGpxToGeoJSON(text);
          break;
        case 'csv':
          geoJSON = await convertCsvToGeoJSON(text);
          break;
        default:
          throw new Error('Unsupported file type');
      }
      
      // Validation
      if (!geoJSON.type || (geoJSON.type !== 'FeatureCollection' && geoJSON.type !== 'Feature')) {
        throw new Error('Invalid GeoJSON format');
      }

      onShapefileLoad(geoJSON, file.name);
      
      toast({
        title: "✅ File Loaded",
        description: `${file.name} imported successfully`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "❌ Load Failed",
        description: "Invalid file format. Please check your file.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
    event.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Helper conversion functions
  const convertKmlToGeoJSON = async (kmlText: string) => {
    // Simple KML to GeoJSON converter
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, 'text/xml');
    const placemarks = kml.getElementsByTagName('Placemark');
    
    const features = Array.from(placemarks).map((placemark) => {
      const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Unnamed';
      const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent?.trim().split(/\s+/);
      
      if (coordinates && coordinates.length > 0) {
        const coords = coordinates[0].split(',').map(Number);
        return {
          type: 'Feature',
          properties: { name },
          geometry: {
            type: 'Point',
            coordinates: [coords[0], coords[1]]
          }
        };
      }
      return null;
    }).filter(Boolean);

    return {
      type: 'FeatureCollection',
      features
    };
  };

  const convertGpxToGeoJSON = async (gpxText: string) => {
    // Simple GPX to GeoJSON converter
    const parser = new DOMParser();
    const gpx = parser.parseFromString(gpxText, 'text/xml');
    const waypoints = gpx.getElementsByTagName('wpt');
    
    const features = Array.from(waypoints).map((wpt) => {
      const lat = parseFloat(wpt.getAttribute('lat') || '0');
      const lon = parseFloat(wpt.getAttribute('lon') || '0');
      const name = wpt.getElementsByTagName('name')[0]?.textContent || 'Waypoint';
      
      return {
        type: 'Feature',
        properties: { name },
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  };

  const convertCsvToGeoJSON = async (csvText: string) => {
    // Simple CSV to GeoJSON converter
    const lines = csvText.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',');
    
    const latIndex = headers.findIndex(h => h.includes('lat'));
    const lonIndex = headers.findIndex(h => h.includes('lon') || h.includes('lng'));
    const nameIndex = headers.findIndex(h => h.includes('name'));
    
    if (latIndex === -1 || lonIndex === -1) {
      throw new Error('CSV must contain latitude and longitude columns');
    }

    const features = lines.slice(1).map((line) => {
      const values = line.split(',');
      const lat = parseFloat(values[latIndex]);
      const lon = parseFloat(values[lonIndex]);
      const name = nameIndex !== -1 ? values[nameIndex] : 'Point';
      
      if (!isNaN(lat) && !isNaN(lon)) {
        return {
          type: 'Feature',
          properties: { name },
          geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          }
        };
      }
      return null;
    }).filter(Boolean);

    return {
      type: 'FeatureCollection',
      features
    };
  };

  return (
    <Card className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/40 dark:border-slate-700/50 shadow-xl">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-words">
              Upload Geospatial Data
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Drag & drop or click to browse
            </p>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".geojson,.json,.kml,.gpx,.csv"
            onChange={handleInputChange}
            disabled={isLoading}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            {isLoading ? (
              <>
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 animate-spin mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processing file...
                </p>
              </>
            ) : (
              <>
                <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-3 sm:mb-4">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 px-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Maximum file size: 10MB
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm"
                >
                  <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Choose File
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Supported Formats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {[
            { icon: FileJson, label: 'GeoJSON', color: 'text-green-600 dark:text-green-400' },
            { icon: FileType, label: 'KML', color: 'text-blue-600 dark:text-blue-400' },
            { icon: FileType, label: 'GPX', color: 'text-purple-600 dark:text-purple-400' },
            { icon: FileSpreadsheet, label: 'CSV', color: 'text-orange-600 dark:text-orange-400' },
            { icon: MapPin, label: 'Shapefile', color: 'text-red-600 dark:text-red-400' },
          ].map((format, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
            >
              <format.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${format.color}`} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {format.label}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            💡 Quick Tips:
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <li className="break-words">• GeoJSON and JSON files are recommended for best compatibility</li>
            <li className="break-words">• CSV files must include latitude and longitude columns</li>
            <li className="break-words">• Large files may take longer to process</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
