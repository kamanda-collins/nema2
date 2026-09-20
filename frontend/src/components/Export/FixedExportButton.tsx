
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FixedExportButtonProps {
  currentShape?: any;
  searchLocation?: { lat: number; lng: number; name: string; boundingBox?: number[] };
  features?: any[];
}

export const FixedExportButton: React.FC<FixedExportButtonProps> = ({
  currentShape,
  searchLocation,
  features = []
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const { toast } = useToast();

  const handleMapScreenshot = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      if (!mapElement) {
        throw new Error('Map not found');
      }

      toast({
        title: "Capturing Map",
        description: "Taking screenshot of current map view..."
      });

      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      
      // Download as PNG
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `map-screenshot-${Date.now()}.png`;
      link.click();

      toast({
        title: "Screenshot Downloaded",
        description: "Map screenshot has been saved successfully"
      });

    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        title: "Screenshot Failed",
        description: "Could not capture map screenshot",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      if (!mapElement) {
        throw new Error('Map not found');
      }

      toast({
        title: "Generating PDF",
        description: "Creating PDF with map and location data..."
      });

      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 1.5,
        logging: false
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Geospatial Analysis Report', 15, 20);

      // Add location info if available
      if (searchLocation) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Location: ${searchLocation.name}`, 15, 35);
        pdf.text(`Coordinates: ${searchLocation.lat.toFixed(4)}, ${searchLocation.lng.toFixed(4)}`, 15, 45);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 55);
      }

      // Add map image
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 250;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 15, 65, imgWidth, Math.min(imgHeight, 120));

      // Add shape info if available
      if (currentShape) {
        let yPos = 195;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Analysis Area:', 15, yPos);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        yPos += 10;
        pdf.text('Boundary: Custom drawn area', 15, yPos);
        
        if (currentShape.properties?.area) {
          yPos += 8;
          pdf.text(`Area: ${currentShape.properties.area}`, 15, yPos);
        }
      }

      // Save PDF
      pdf.save(`geospatial-analysis-${Date.now()}.pdf`);

      toast({
        title: "PDF Generated",
        description: "Analysis report has been created and downloaded"
      });

    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "PDF Export Failed",
        description: "Could not generate PDF report",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeoJSONExport = () => {
    if (!currentShape) {
      toast({
        title: "No Shape Available",
        description: "Please draw a shape on the map first",
        variant: "destructive"
      });
      return;
    }

    try {
      const geoJsonData = {
        type: "FeatureCollection",
        features: [currentShape]
      };

      const dataStr = JSON.stringify(geoJsonData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `boundary-${Date.now()}.geojson`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "GeoJSON Exported",
        description: "Boundary data has been exported successfully"
      });

    } catch (error) {
      console.error('GeoJSON export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export GeoJSON data",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleMapScreenshot}>
          <Image className="h-4 w-4 mr-2" />
          Map Screenshot
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDFExport}>
          <FileText className="h-4 w-4 mr-2" />
          PDF Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGeoJSONExport}>
          <Map className="h-4 w-4 mr-2" />
          GeoJSON Data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
