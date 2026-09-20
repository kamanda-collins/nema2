import { useState } from 'react';
import { Map, Satellite, Download, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNEMAMapExport } from '@/hooks/useNEMACompliance';
import { type GeoJSONFeature } from '@/services/nemaApi';

interface NEMAMapExportDialogProps {
  currentShape?: any; // GeoJSON from the captured shape
  trigger?: React.ReactNode;
  onSuccess?: (imageUrl: string) => void;
}

export function NEMAMapExportDialog({ currentShape, trigger, onSuccess }: NEMAMapExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [bufferM, setBufferM] = useState(5000);
  const [dpi, setDpi] = useState(200);
  const [useSatellite, setUseSatellite] = useState(true);
  const [siteLabel, setSiteLabel] = useState('');
  const [showLabel, setShowLabel] = useState(true);

  const { mapResult, loading, error, progress, exportMap, downloadMap, reset } = useNEMAMapExport();

  // Check if we have a valid shape
  const hasValidShape = currentShape && 
    (currentShape.type === 'FeatureCollection' || currentShape.type === 'Feature' || currentShape.geometry);

  // Convert buffer to km for display
  const bufferKm = bufferM / 1000;

  // DPI presets
  const dpiPresets = [
    { value: 72, label: 'Screen (72 DPI)', description: 'Quick preview' },
    { value: 150, label: 'Standard (150 DPI)', description: 'Reports' },
    { value: 200, label: 'High (200 DPI)', description: 'Recommended' },
    { value: 300, label: 'Print (300 DPI)', description: 'Publication quality' },
  ];

  const handleExport = async () => {
    if (!hasValidShape) {
      return;
    }

    try {
      // Handle different GeoJSON formats from currentShape
      let siteFeature: GeoJSONFeature;
      
      if (currentShape.type === 'FeatureCollection' && currentShape.features?.length > 0) {
        // If it's a FeatureCollection, use the first feature
        siteFeature = {
          ...currentShape.features[0],
          properties: {
            ...currentShape.features[0].properties,
            name: siteLabel || currentShape.features[0].properties?.name || 'Site',
          },
        };
      } else if (currentShape.type === 'Feature') {
        // If it's already a Feature
        siteFeature = {
          ...currentShape,
          properties: {
            ...currentShape.properties,
            name: siteLabel || currentShape.properties?.name || 'Site',
          },
        };
      } else if (currentShape.geometry) {
        // If it's just a geometry object
        siteFeature = {
          type: 'Feature',
          geometry: currentShape.geometry,
          properties: {
            name: siteLabel || 'Site',
          },
        };
      } else {
        throw new Error('Invalid shape format');
      }

      // Export map
      const result = await exportMap({
        site_geojson: siteFeature,
        buffer_m: bufferM,
        use_satellite: useSatellite,
        site_label_text: siteLabel,
        show_site_label: showLabel,
        dpi: dpi,
      });

      if (onSuccess && result) {
        // Create blob URL for preview
        const base64Data = result.image_base64.replace(/^data:image\/\w+;base64,/, '');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        onSuccess(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDownload = () => {
    const filename = `nema-map-${siteLabel.toLowerCase().replace(/\s+/g, '-') || 'site'}-${new Date().toISOString().slice(0, 10)}.png`;
    downloadMap(filename);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2">
            <Map className="h-4 w-4" />
            Professional Map Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>NEMA Professional Map Export</DialogTitle>
          <DialogDescription>
            Generate high-resolution maps with satellite imagery, wetlands overlay, and professional elements for NEMA submissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Site Label */}
          <div className="space-y-2">
            <Label htmlFor="site-label">Site Label</Label>
            <Input
              id="site-label"
              placeholder="Enter site name or description"
              value={siteLabel}
              onChange={(e) => setSiteLabel(e.target.value)}
              disabled={loading}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="show-label"
                checked={showLabel}
                onCheckedChange={setShowLabel}
                disabled={loading}
              />
              <Label htmlFor="show-label" className="text-sm text-muted-foreground cursor-pointer">
                Show label on map
              </Label>
            </div>
          </div>

          {/* Basemap Type */}
          <div className="space-y-2">
            <Label>Basemap Style</Label>
            <RadioGroup
              value={useSatellite ? 'satellite' : 'street'}
              onValueChange={(value) => setUseSatellite(value === 'satellite')}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="satellite" id="satellite" />
                <Label htmlFor="satellite" className="flex items-center gap-2 cursor-pointer">
                  <Satellite className="h-4 w-4" />
                  Satellite View (Esri WorldImagery)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="street" id="street" />
                <Label htmlFor="street" className="flex items-center gap-2 cursor-pointer">
                  <Map className="h-4 w-4" />
                  Street Map (CartoDB Positron)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Buffer Distance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="buffer-slider">Buffer Distance</Label>
              <span className="text-sm font-medium">{bufferKm.toFixed(1)} km</span>
            </div>
            <Slider
              id="buffer-slider"
              min={100}
              max={50000}
              step={100}
              value={[bufferM]}
              onValueChange={(value) => setBufferM(value[0])}
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Area around site to include in the map (100m - 50km)
            </p>
          </div>

          {/* DPI Selection */}
          <div className="space-y-2">
            <Label>Output Quality (DPI)</Label>
            <RadioGroup
              value={dpi.toString()}
              onValueChange={(value) => setDpi(parseInt(value))}
              disabled={loading}
            >
              {dpiPresets.map((preset) => (
                <div key={preset.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={preset.value.toString()} id={`dpi-${preset.value}`} />
                  <Label
                    htmlFor={`dpi-${preset.value}`}
                    className="flex flex-col cursor-pointer"
                  >
                    <span className="font-medium">{preset.label}</span>
                    <span className="text-xs text-muted-foreground">{preset.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Display */}
          {loading && progress && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>{progress}</AlertDescription>
            </Alert>
          )}

          {/* Result Preview */}
          {mapResult && (
            <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium text-sm">Export Complete!</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Dimensions:</span>{' '}
                  <span className="font-medium">{mapResult.width_px} × {mapResult.height_px}px</span>
                </div>
                <div>
                  <span className="text-muted-foreground">DPI:</span>{' '}
                  <span className="font-medium">{mapResult.dpi}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">File Size:</span>{' '}
                  <span className="font-medium">{mapResult.file_size_kb.toFixed(1)} KB</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Wetlands:</span>{' '}
                  <span className="font-medium">{mapResult.metadata.wetlands_count}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Map includes: {useSatellite ? 'Satellite' : 'Street'} basemap, wetlands overlay,
                scale bar, north arrow, coordinate info, and legend.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {mapResult ? (
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download Map
            </Button>
          ) : (
            <Button
              onClick={handleExport}
              disabled={loading || !hasValidShape}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Map className="h-4 w-4" />
                  Generate Map
                </>
              )}
            </Button>
          )}
        </div>

        {!hasValidShape && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please capture a site shape first using the drawing tools or file upload.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
