
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ScreenshotPDFOptions {
  mapSelector: string;
  searchLocation?: { lat: number; lng: number; name: string };
  toast: (options: { title: string; description?: string }) => void;
}

export async function generateScreenshotPDF({ mapSelector, searchLocation, toast }: ScreenshotPDFOptions) {
  const mapElement = document.querySelector(mapSelector) as HTMLElement;
  if (!mapElement) throw new Error('Map element not found');

  toast({
    title: "Capturing Screenshot",
    description: "Taking screenshot of current map view...",
  });

  const canvas = await html2canvas(mapElement, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: '#ffffff'
  });

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const imgWidth = 280;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, Math.min(imgHeight, 180));
  pdf.setFontSize(16);
  pdf.text('Map Screenshot Export', 10, imgHeight + 25);

  if (searchLocation) {
    pdf.setFontSize(12);
    pdf.text(`Location: ${searchLocation.name}`, 10, imgHeight + 35);
    pdf.text(`Coordinates: ${searchLocation.lat.toFixed(4)}, ${searchLocation.lng.toFixed(4)}`, 10, imgHeight + 45);
    pdf.text(`Export Date: ${new Date().toLocaleString()}`, 10, imgHeight + 55);
  }

  pdf.save(`map-screenshot-${Date.now()}.pdf`);
  return true;
}
