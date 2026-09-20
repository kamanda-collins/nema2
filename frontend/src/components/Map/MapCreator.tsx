import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, MapPin, FileText, Share2, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapCreatorProps {
  currentShape?: any;
  searchLocation?: { lat: number; lng: number; name: string };
  onClearShape?: () => void;
}

export const MapCreator: React.FC<MapCreatorProps> = ({ 
  currentShape, 
  searchLocation,
  onClearShape 
}) => {
  const [mapTitle, setMapTitle] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [mapType, setMapType] = useState<'environmental' | 'mining' | 'analysis' | 'report'>('analysis');
  const [step, setStep] = useState<'create' | 'customize' | 'export'>('create');
  
  // Map customization options
  const [includeRoads, setIncludeRoads] = useState(true);
  const [includeBuildings, setIncludeBuildings] = useState(false);
  const [includeWaterBodies, setIncludeWaterBodies] = useState(true);
  const [includeCompass, setIncludeCompass] = useState(true);
  const [includeScale, setIncludeScale] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  
  const { toast } = useToast();

  const handleNextStep = () => {
    if (!currentShape) {
      toast({
        title: "No shape drawn",
        description: "Please draw a shape on the map first.",
        variant: "destructive"
      });
      return;
    }
    
    if (step === 'create') {
      setStep('customize');
    } else if (step === 'customize') {
      setStep('export');
    }
  };

  const generatePDFContent = () => {
    const mapData = {
      title: mapTitle || 'Custom Map',
      type: mapType,
      description: mapDescription,
      location: searchLocation?.name || 'Unknown Location',
      coordinates: searchLocation ? `${searchLocation.lat.toFixed(4)}, ${searchLocation.lng.toFixed(4)}` : 'Not specified',
      features: {
        roads: includeRoads ? 'Included' : 'Excluded',
        buildings: includeBuildings ? 'Included' : 'Excluded',
        waterBodies: includeWaterBodies ? 'Included' : 'Excluded',
        compass: includeCompass ? 'Included' : 'Excluded',
        scale: includeScale ? 'Included' : 'Excluded',
        legend: includeLegend ? 'Included' : 'Excluded'
      },
      shape: currentShape ? 'Custom polygon drawn' : 'No shape',
      createdAt: new Date().toLocaleString()
    };

    return `MAP EXPORT REPORT
=====================

Title: ${mapData.title}
Type: ${mapData.type}
Description: ${mapData.description}
Location: ${mapData.location}
Coordinates: ${mapData.coordinates}
Created: ${mapData.createdAt}

MAP FEATURES
============
Roads & Streets: ${mapData.features.roads}
Buildings: ${mapData.features.buildings}
Water Bodies: ${mapData.features.waterBodies}
Compass: ${mapData.features.compass}
Scale Bar: ${mapData.features.scale}
Legend: ${mapData.features.legend}

SHAPE DATA
==========
${mapData.shape}

GeoJSON Data:
${JSON.stringify(currentShape, null, 2)}

This map was created using GeoShape Map Creator.
For technical support, contact the application administrator.
`;
  };

  const handleExportMap = (format: 'pdf' | 'png' | 'geojson') => {
    if (!currentShape) {
      toast({
        title: "No shape drawn",
        description: "Please draw a shape on the map first.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: `Generating ${format.toUpperCase()} Map`,
      description: `Creating your custom map "${mapTitle || 'Untitled Map'}" with selected features...`,
    });

    setTimeout(() => {
      let blob;
      let filename = `${mapTitle || 'custom-map'}.${format}`;
      
      if (format === 'geojson') {
        blob = new Blob([JSON.stringify(currentShape, null, 2)], { 
          type: 'application/json' 
        });
      } else if (format === 'pdf') {
        const pdfContent = generatePDFContent();
        blob = new Blob([pdfContent], { 
          type: 'text/plain' 
        });
        filename = `${mapTitle || 'custom-map'}.txt`; // Change to .txt since we're generating text content
      } else {
        const exportData = {
          title: mapTitle || 'Custom Map',
          description: mapDescription,
          type: mapType,
          shape: currentShape,
          location: searchLocation,
          features: {
            roads: includeRoads,
            buildings: includeBuildings,
            waterBodies: includeWaterBodies,
            compass: includeCompass,
            scale: includeScale,
            legend: includeLegend
          },
          createdAt: new Date().toISOString()
        };
        blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Your ${format.toUpperCase()} map has been downloaded successfully!`,
      });
    }, 1500);
  };

  const getStepContent = () => {
    switch (step) {
      case 'create':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Map Title</Label>
                <Input
                  value={mapTitle}
                  onChange={(e) => setMapTitle(e.target.value)}
                  placeholder="Enter map title"
                  className="h-8"
                />
              </div>

              <div>
                <Label className="text-xs">Map Type</Label>
                <Select value={mapType} onValueChange={(value) => setMapType(value as any)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="mining">Mining/Quarry</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Description (Optional)</Label>
                <Textarea
                  value={mapDescription}
                  onChange={(e) => setMapDescription(e.target.value)}
                  placeholder="Describe your map area"
                  className="h-16 text-xs"
                />
              </div>

              {searchLocation && (
                <div className="text-xs text-blue-600 p-2 bg-blue-50 rounded">
                  <strong>Location:</strong> {searchLocation.name}
                </div>
              )}

              {currentShape && (
                <div className="text-xs text-green-600 p-2 bg-green-50 rounded">
                  <strong>Status:</strong> Shape drawn - ready to customize!
                </div>
              )}
            </div>

            <Button 
              onClick={handleNextStep}
              disabled={!currentShape}
              className="w-full"
            >
              Next: Customize Map Features
            </Button>
          </div>
        );

      case 'customize':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Map Features to Include:</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="roads" 
                  checked={includeRoads}
                  onCheckedChange={(checked) => setIncludeRoads(checked === true)}
                />
                <Label htmlFor="roads" className="text-xs">Roads & Streets</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="buildings" 
                  checked={includeBuildings}
                  onCheckedChange={(checked) => setIncludeBuildings(checked === true)}
                />
                <Label htmlFor="buildings" className="text-xs">Buildings & Structures</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="water" 
                  checked={includeWaterBodies}
                  onCheckedChange={(checked) => setIncludeWaterBodies(checked === true)}
                />
                <Label htmlFor="water" className="text-xs">Water Bodies</Label>
              </div>
            </div>

            <h4 className="font-medium text-sm pt-2">Map Elements:</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="compass" 
                  checked={includeCompass}
                  onCheckedChange={(checked) => setIncludeCompass(checked === true)}
                />
                <Label htmlFor="compass" className="text-xs">Compass/North Arrow</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="scale" 
                  checked={includeScale}
                  onCheckedChange={(checked) => setIncludeScale(checked === true)}
                />
                <Label htmlFor="scale" className="text-xs">Scale Bar</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="legend" 
                  checked={includeLegend}
                  onCheckedChange={(checked) => setIncludeLegend(checked === true)}
                />
                <Label htmlFor="legend" className="text-xs">Map Legend</Label>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => setStep('create')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                className="flex-1"
              >
                Next: Export Options
              </Button>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Export Your Custom Map:</h4>
            
            <div className="space-y-2">
              <Button
                onClick={() => handleExportMap('pdf')}
                className="w-full h-10 text-sm"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Map Report (TXT)
              </Button>
              
              <Button
                onClick={() => handleExportMap('png')}
                className="w-full h-10 text-sm"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Map Data (JSON)
              </Button>
              
              <Button
                onClick={() => handleExportMap('geojson')}
                className="w-full h-10 text-sm"
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Export as GeoJSON
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => setStep('customize')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={() => setStep('create')}
                variant="outline"
                className="flex-1"
              >
                Start Over
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-500" />
            <h3 className="font-medium text-sm">Map Creator</h3>
          </div>
          <span className="text-xs text-gray-500">
            Step {step === 'create' ? '1' : step === 'customize' ? '2' : '3'} of 3
          </span>
        </div>
        
        <div className="flex space-x-1">
          <div className={`h-2 flex-1 rounded ${step === 'create' ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded ${step === 'customize' ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded ${step === 'export' ? 'bg-blue-500' : 'bg-gray-200'}`} />
        </div>
      </Card>

      {/* Step content */}
      <Card className="p-4">
        {getStepContent()}
      </Card>

      {/* Instructions */}
      {step === 'create' && (
        <Card className="p-4">
          <h3 className="font-medium text-sm mb-2">How to Create Your Map</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>1. Search for a location to center your map</p>
            <p>2. Use the polygon tool to draw your area (crosshair cursor)</p>
            <p>3. Add a title and description</p>
            <p>4. Customize map features and export</p>
          </div>
        </Card>
      )}

      {currentShape && onClearShape && (
        <Button
          onClick={onClearShape}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          Clear Shape & Start Over
        </Button>
      )}
    </div>
  );
};
