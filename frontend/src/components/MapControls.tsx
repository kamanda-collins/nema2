
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MapPin, Download, FileText, Trash2, Save } from 'lucide-react';

interface MapControlsProps {
  shapeName: string;
  setShapeName: (name: string) => void;
  onSaveShape: () => void;
  onDownloadGeoJSON: () => void;
  onDownloadPDF: () => void;
  onClearMap: () => void;
  isLoading: boolean;
}

export const MapControls = ({
  shapeName = '',
  setShapeName,
  onSaveShape,
  onDownloadGeoJSON,
  onDownloadPDF,
  onClearMap,
  isLoading = false
}: MapControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shape Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Shape */}
        <div className="space-y-2">
          <Label htmlFor="shapeName">Shape Name</Label>
          <Input
            id="shapeName"
            value={shapeName || ''}
            onChange={(e) => setShapeName?.(e.target.value)}
            placeholder="Enter shape name..."
            className="w-full"
          />
          <Button
            onClick={onSaveShape}
            disabled={isLoading || !(shapeName || '').trim()}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Shape'}
          </Button>
        </div>

        <Separator />

        {/* Download Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Export Options</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={onDownloadGeoJSON}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download GeoJSON
            </Button>
            <Button
              onClick={onDownloadPDF}
              variant="outline"
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download PDF Report
            </Button>
          </div>
        </div>

        <Separator />

        {/* Clear Map */}
        <Button
          onClick={onClearMap}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Map
        </Button>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <p><strong>Instructions:</strong></p>
          <p>• Use the drawing tools on the map to create shapes</p>
          <p>• Name your shape and click Save</p>
          <p>• Export shapes as GeoJSON or PDF reports</p>
          <p>• Edit shapes using the edit tool</p>
        </div>
      </CardContent>
    </Card>
  );
};
